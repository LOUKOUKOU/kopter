<template>
  <main>
    <img ref="kopter" class="invis" :src="require('./assets/images/kopter.png')" />
    <img
      ref="texture_building"
      width="30px"
      height="30px"
      class="invis"
      :src="require('./assets/images/texture_building.png')"
    />
    <img class="flag" :src="flag" />
    <button id="pause" @click="handlePlayPaused">{{paused === true ? 'Play' : 'Pause'}}</button>
    <button id="reset" v-if="gameOver === true" @click="init">Reset</button>
    <h2 v-if="gameOver === true" id="gameOver">GAME OVER</h2>
    <canvas ref="canvas"></canvas>
    <div id="dashboard">
      <button v-touch:start="() => accelerateX(-2, 'left')">ACCELERATE LEFT</button>
      <button
        v-touch:start="() => accelerateY(-0.2, 'start')"
        v-touch:end="() => accelerateY(0.2, 'end')"
        class="exel"
      >ACCELERATE</button>
      <button v-touch:start="() =>accelerateX(2, 'right')">ACCELERATE RIGHT</button>
    </div>
    <div class="debug">
      <p>Try accelerate the red square.</p>
      <p>Vertical Speed: {{ -Math.round(ySpeed)}}</p>
      <p>Horizontal Speed: {{ Math.round(xSpeed)}}</p>
      <p>Game Over: {{ gameOver === true }}</p>
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import { level1Config } from './level1Config'
import Entity, { IEntity } from './entity/Entity'
import Bullet, { IBullet } from './entity/Bullet'
import Turret, { ITurret } from './entity/Turret'

import IFuel from './IFuel'
import Animator from '@/Animator'
import Sound from '@/Sound'
import { ScaledValues } from './utils/ScaledValues'

@Component
export default class Stage extends Vue {
  @Prop() private color!: string
  @Prop({ default: 100 }) private maxSpeedX!: number
  @Prop({ default: 100 }) private maxSpeedY!: number
  @Prop({ default: 0 }) private windSpeed!: number

  private curX: number = 0
  private curY: number = 0
  private gravityY: number = 0.05
  private ySpeed: number = 0
  private xSpeed: number = 0
  private gravityX: number = 0.0
  private bounceSpeedThreshold = 50
  private directionAnimationTimeout: any = null
  private touchType: string = ''
  private direction: string = 'neutral'
  private gameOver = false
  private paused = false
  private chopperSound = true
  private platforms: Entity[] = []
  private bullets: Bullet[] = []
  private sounds: { [k: string]: Sound } = {}
  private scaledValues = new ScaledValues(0, 0)
  private turrets: Turret[] = []

  private kopter = {
    width: 0,
    height: 0,
    x: 0,
    y: 0
  }

  private kopterAnimator?: Animator

  private drainFuelInterval!: number
  private createBulletsInterval: number[] = []

  private fuel: IFuel = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    total: 0,
    current: 0
  }

  private get canvas(): HTMLCanvasElement {
    return this.$refs.canvas as HTMLCanvasElement
  }

  private get flag(): HTMLCanvasElement {
    if (this.windSpeed >= 0.05) {
      return require('./assets/images/flag_right_strong.png')
    } else if (this.windSpeed >= 0.02) {
      return require('./assets/images/flag_right_weak.png')
    } else if (this.windSpeed <= -0.02) {
      return require('./assets/images/flag_left_weak.png')
    } else if (this.windSpeed <= -0.05) {
      return require('./assets/images/flag_left_strong.png')
    } else {
      return require('./assets/images/flag_still.png')
    }
  }

  initialiseEntities() {
    for (const platform of level1Config.platforms) {
      const theHeight = this.scaledValues.getHeight(platform.height)
      const data: IEntity = {
        x: this.scaledValues.getX(platform.x),
        y: this.scaledValues.getY(platform.y, theHeight),
        width: this.scaledValues.getX(platform.width),
        height: theHeight,
        name: platform.name,
        color: platform.color,
        isPlatform: platform.isPlatform,
        texture: platform.texture
      }

      this.platforms.push(new Entity(data))
    }

    const kopterWidth = this.scaledValues.canvasWidth / 12
    const kopterHeight = this.scaledValues.canvasWidth / 23

    // placing kopter ontop of first skyscraper
    this.kopter = {
      width: kopterWidth,
      height: kopterHeight,
      x: this.platforms[0].x,
      y: this.platforms[0].y - kopterHeight * 1
    }
    this.curX = this.kopter.x
    this.curY = this.kopter.y

    const totalFuel = 100
    const fuelWidth = 25
    const fuelHeight = 2

    this.fuel = {
      x: this.scaledValues.getX(10),
      y: this.scaledValues.getY(10, this.scaledValues.getHeight(fuelHeight)),
      width: this.scaledValues.getWidth(25),
      height: this.scaledValues.getHeight(fuelHeight),
      total: totalFuel,
      current: totalFuel
    }

    for (const turret of level1Config.turrets) {
      this.turrets.push(
        new Turret({
          name: turret.name,
          x: this.scaledValues.getX(turret.x),
          y: this.scaledValues.getY(
            turret.y,
            this.scaledValues.getHeight(turret.height)
          ),
          width: this.scaledValues.getWidth(turret.width),
          height: this.scaledValues.getHeight(turret.height),
          color: turret.color,
          isPlatform: turret.isPlatform,
          rateOfFire: turret.rateOfFire,
          burst: turret.burst
        })
      )
    }

    for (const turret of this.turrets) {
      this.createBullets(turret)
    }
  }

  private init() {
    this.reset()
    this.initialiseEntities()
    const ctx: any = this.canvas.getContext('2d')
    this.kopterAnimator = new Animator(
      230,
      120,
      6,
      this.$refs.kopter as HTMLImageElement,
      ctx
    )

    const path1 = require('@/assets/sound/kopter.ogg')
    const path2 = require('@/assets/sound/kopter_up.ogg')
    const cannonPath = require('@/assets/sound/cannon.ogg')
    this.sounds.kopter = new Sound(path2, true, false, 0.3)
    this.sounds.kopter_idle = new Sound(path1, true, false, 0.2)
    this.sounds.cannon = new Sound(cannonPath, false, false, 0.4)

    window.addEventListener('focus', () => this.sounds.kopter_idle.play())
    window.addEventListener('load', () => this.sounds.kopter_idle.play())
    window.addEventListener('blur', () => this.sounds.kopter_idle.pause())

    const rand = Math.random() * 100
    for (const entity of this.platforms) {
      if (entity.texture) {
        this.drawEntityWithTexture(entity, ctx)
      } else {
        this.drawEntity(entity, ctx)
      }
    }
    this.drawFuel(ctx)
    for (const bullet of this.bullets) {
      this.drawEntity(bullet, ctx)
    }
    this.updateGameArea(ctx)
  }

  private mounted() {
    // Device screen size
    this.canvas.style.width = window.innerWidth + 'px'
    // this.canvas.style.width = window.innerHeight + 'px'
    this.canvas.style.height = window.innerHeight + 'px'

    // Below is the screensize to use, it includes DPS so that things do not blur
    const scale = window.devicePixelRatio
    this.scaledValues.canvasWidth = window.innerWidth * scale
    // this.canvasWidth = window.innerHeight * scale
    this.scaledValues.canvasHeight = window.innerHeight * scale

    this.canvas.width = this.scaledValues.canvasWidth
    this.canvas.height = this.scaledValues.canvasHeight

    this.init()
  }

  private createBullets(turret: ITurret) {
    // Percentage of the screen
    const bulletHeight = 0.5
    const bulletWidth = 0.5

    const bulletInterval = setInterval(() => {
      const speed = 4
      // calculate triangle between two objects. hypotenuse being the longest side
      // this determines the factor between x and y for their respective speed values
      const width = this.kopter.x + this.kopter.width / 2 - turret.x
      const height = this.kopter.y + this.kopter.height / 2 - turret.y
      const hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
      const theCos = width / hypotenuse
      const theSin = height / hypotenuse
      const x = speed * theCos
      const y = speed * theSin
      this.bullets.push(
        new Bullet({
          name: 'bullet',
          x: turret.x,
          y: turret.y,
          width: this.scaledValues.getWidth(bulletWidth),
          height: this.scaledValues.getHeight(bulletHeight),
          color: 'black',
          isPlatform: false,
          xSpeed: x,
          ySpeed: -y
        })
      )
      this.sounds.cannon.play()
    }, (60 / turret.rateOfFire) * 1000)

    this.createBulletsInterval.push(bulletInterval)
  }

  private update(ctx: CanvasRenderingContext2D) {
    const grd = ctx.createLinearGradient(0, this.canvas.height, 0, 0)
    grd.addColorStop(0, '#d47d48')
    grd.addColorStop(0.3, '#ddd')
    grd.addColorStop(1, '#7e94ae')

    // Fill with gradient
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.drawKopter(ctx)
    for (const entity of this.platforms) {
      if (entity.texture) {
        this.drawEntityWithTexture(entity, ctx)
      } else {
        this.drawEntity(entity, ctx)
      }
    }
    this.drawFuel(ctx)
    for (let i = 0; i < this.bullets.length; i++) {
      if (
        this.bullets[i].x > this.scaledValues.canvasWidth ||
        this.bullets[i].x < 0 ||
        this.bullets[i].y > this.scaledValues.canvasHeight ||
        this.bullets[i].y < 0
      ) {
        this.$delete(this.bullets, i)
      } else {
        this.drawEntity(this.bullets[i], ctx)
      }
    }

    for (const turret of this.turrets) {
      this.drawEntity(turret, ctx)
    }
  }

  private newPos() {
    if (
      this.ySpeed + this.gravityY <= this.maxSpeedY &&
      this.ySpeed + this.gravityY >= -this.maxSpeedY
    ) {
      this.ySpeed += this.gravityY
    }
    this.xSpeed = this.gravityX
    this.curX += this.xSpeed
    this.curY += this.ySpeed
    this.kopter.x = this.curX
    this.kopter.y = this.curY
    for (const bullet of this.bullets) {
      bullet.x += bullet.xSpeed
      bullet.y -= bullet.ySpeed
    }
    this.hitBoundaries()
  }

  private isTouchingEntity(
    curX: number,
    curY: number,
    entity: IEntity | IBullet
  ) {
    const entityTop = entity.y - this.kopter.height
    const entityLeft = entity.x
    const entityRight = entity.x + entity.width
    const entityBottom = entity.y + entity.height
    if (
      curY > entityTop &&
      curY < entityTop + this.kopter.height &&
      curX + this.kopter.width > entityLeft &&
      curX < entityRight &&
      this.ySpeed >= 0
    ) {
      // it is on the top and can rest here
      if (entity.isPlatform === true) {
        // console.log(entity instanceof Entity)
        return true
      } else {
        console.log('crashed into top of platform')
        this.gameOver = true
        return false
      }
    } else {
      if (
        curY > entityTop &&
        curY < entityBottom &&
        curX + this.kopter.width > entityLeft - this.xSpeed &&
        curX + this.kopter.width < entityRight &&
        this.xSpeed > 0
      ) {
        console.log('crashed into left of platform')
        this.gameOver = true
      } else if (
        curY > entityTop &&
        curY < entityBottom &&
        curX < entityRight + -this.xSpeed &&
        curX > entityLeft &&
        this.xSpeed < 0
      ) {
        console.log('crashed into right of platform')
        this.gameOver = true
      } else if (
        curY < entityBottom &&
        curY > entityTop &&
        curX + this.kopter.width > entityLeft &&
        curX < entityRight &&
        this.ySpeed < 0
      ) {
        console.log('crashed into bottom of platform')
        this.gameOver = true
      }
      return false
    }
  }

  handlePlayPaused() {
    this.paused = !this.paused
  }

  private hitBoundaries() {
    const rockbottom = this.canvas.height - this.kopter.height

    let onSurface: boolean = false
    // stop if hit bottom or platform surface
    for (const entity of this.platforms) {
      if (this.isTouchingEntity(this.curX, this.curY, entity)) {
        this.curY = entity.y - this.kopter.height
        this.ySpeed = 0
        onSurface = true || onSurface
      } else if (this.curY > rockbottom) {
        this.curY = rockbottom
        this.ySpeed = 0
        onSurface = true || onSurface
        this.gameOver = true
      } else {
        onSurface = false || onSurface
      }
    }

    for (const bullet of this.bullets) {
      if (this.isTouchingEntity(this.curX, this.curY, bullet)) {
        this.curY = bullet.y - this.kopter.height
        this.ySpeed = 0
        onSurface = true || onSurface
      } else if (this.curY > rockbottom) {
        this.curY = rockbottom
        this.ySpeed = 0
        onSurface = true || onSurface
        this.gameOver = true
      } else {
        onSurface = false || onSurface
      }
    }

    this.tapering(this.windSpeed, onSurface)
    // Stop if hit roof
    if (this.curY < 0) {
      if (this.ySpeed > -this.bounceSpeedThreshold) {
        this.ySpeed = -this.ySpeed
      } else {
        this.gameOver = true
      }
    }

    // stop if hit left side walls
    if (this.curX < 0) {
      if (-this.xSpeed < this.bounceSpeedThreshold) {
        this.xSpeed = -this.xSpeed
        this.gravityX = -this.gravityX
      } else {
        this.gameOver = true
      }
    }
    // stop if hit right side walls
    if (this.curX + this.kopter.width > this.canvas.width) {
      if (this.xSpeed < this.bounceSpeedThreshold) {
        this.xSpeed = -this.xSpeed
        this.gravityX = -this.gravityX
      } else {
        this.gameOver = true
      }
    }
  }

  private tapering(resistance: number = 0.02, onSurface: boolean) {
    if (this.xSpeed > 0.02) {
      this.xSpeed -= 0.02
      this.gravityX -= 0.02
    } else if (this.xSpeed < -0.02) {
      this.xSpeed += 0.02
      this.gravityX += 0.02
    } else {
      this.xSpeed = 0
      this.gravityX = 0
    }

    if (onSurface === false) {
      if (this.xSpeed <= this.maxSpeedX && this.xSpeed >= -this.maxSpeedX) {
        this.xSpeed += resistance
        this.gravityX += resistance
      }
    }
  }

  private reset() {
    this.gameOver = false
    this.bullets = []
    this.ySpeed = 0
    this.xSpeed = 0
    this.gravityY = 0.05
    this.gravityX = 0
    this.turrets = []
  }

  private handleGameOver() {
    clearInterval(this.drainFuelInterval)
    for (const bulletInterval of this.createBulletsInterval) {
      clearInterval(bulletInterval)
    }
  }

  private updateGameArea(ctx: CanvasRenderingContext2D): any {
    if (this.gameOver === false) {
      this.clear(ctx)
      this.newPos()

      this.update(ctx)
      requestAnimationFrame(() => this.updateGameArea(ctx))
    } else {
      this.handleGameOver()
      this.sounds.kopter_idle.pause()
      this.sounds.kopter.pause()
    }
  }

  private accelerateY(n: number, touchType: string) {
    if (this.gameOver === false) {
      if (touchType === 'start') {
        this.sounds.kopter_idle.pause()
        this.sounds.kopter.play()
      } else if (touchType === 'end') {
        this.sounds.kopter_idle.play()
        this.sounds.kopter.pause()
      }

      if (n > 0) {
        this.gravityY = n
        clearInterval(this.drainFuelInterval)
      } else {
        if (this.fuel.current > 0) {
          this.gravityY = n
          // this is for each click so  people cant exploit
          this.fuel.current -= 1
          this.drainFuelInterval = setInterval(() => {
            if (this.fuel.current > 0) {
              // this is the rate at which fuel burns on touchhold
              this.fuel.current -= 2
            } else {
              console.log('OUT OF FUEL!')
              this.gravityY = 0 - this.gravityY
              clearInterval(this.drainFuelInterval)
            }
          }, 200)
        } else {
          console.log('OUT OF FUEL!')
        }
      }
    }
  }

  private accelerateX(n: number, type: string) {
    if (this.gameOver === false) {
      if (
        this.gravityX + n <= this.maxSpeedX &&
        this.gravityX + n >= -this.maxSpeedX
      ) {
        this.gravityX = this.gravityX + n
      }

      this.direction = type
      this.directionAnimationTimeout = setTimeout(() => {
        this.direction = 'neutral'
        clearTimeout(this.directionAnimationTimeout)
      }, 500)
    }
  }

  private drawKopter(ctx: CanvasRenderingContext2D) {
    if (this.kopterAnimator) {
      this.kopterAnimator.nextFrame(
        this.kopter as any,
        this.direction === 'neutral' ? 0 : this.direction === 'left' ? 1 : 2
      )
    }
  }

  private drawEntity(entity: IEntity, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = entity.color
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
  }

  private drawEntityWithTexture(
    entity: IEntity,
    ctx: CanvasRenderingContext2D
  ) {
    ctx.fillStyle = ctx.createPattern(
      this.$refs[entity.texture ? entity.texture : 'blank'] as HTMLImageElement,
      'repeat'
    ) as CanvasPattern
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
  }

  private drawBullet(bullet: IBullet, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = bullet.color
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
  }

  private drawFuel(ctx: CanvasRenderingContext2D) {
    const newWidth = (this.fuel.current / this.fuel.total) * this.fuel.width
    ctx.fillStyle = 'orange'
    ctx.fillRect(this.fuel.x, this.fuel.y, newWidth, this.fuel.height)
  }

  private clear(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }
}
</script>

<style>
body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  overflow: hidden;
}
main {
  user-select: none;
  margin: 0 auto;
}

@font-face {
  font-family: 'army';
  src: url(Army.ttf);
}

h1 {
  font: 'army';
  position: fixed;
  top: 1rem;
  left: 1rem;
}

#gameOver {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  margin: auto;
  color: red;
  justify-content: center;
  align-items: center;
  font-size: 4rem;
  background: rgba(0, 0, 0, 0.2);
}

canvas {
  background-color: #f1f1f1;
}

.debug {
  position: fixed;
  top: 0;
  left: 20px;
  pointer-events: none;
}

.debug p {
  font-size: 10px;
  line-height: 1;
  margin-top: 2px;
  margin-bottom: 2px;
  padding-top: 2px;
  padding-bottom: 2px;
}

.invis {
  position: absolute;
  left: -5000px;
}

#dashboard {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
}
button {
  opacity: 0;
  width: 20%;
}

#pause {
  position: fixed;
  top: 2%;
  right: 20%;
  z-index: 1;
  opacity: 1;
}

#reset {
  position: fixed;
  top: 2%;
  right: 42%;
  z-index: 1;
  opacity: 1;
}

button.exel {
  width: 60%;
}

.flag {
  width: 40px;
  height: 32px;
  position: fixed;
  top: 10px;
  right: 20px;
}
</style>
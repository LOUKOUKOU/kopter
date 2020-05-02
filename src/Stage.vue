<template>
  <main>
    <img ref="kopter" class="invis" :src="require('./assets/images/kopter.gif')" />
    <img ref="kopterBackward" class="invis" :src="require('./assets/images/kopter_backward.gif')" />
    <img ref="kopterForward" class="invis" :src="require('./assets/images/kopter_forward.gif')" />
    <img class="flag" :src="flag" />
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
      <p>Vertical Speed: {{ -Math.round(YSpeed)}}</p>
      <p>Horizontal Speed: {{ Math.round(XSpeed)}}</p>
      <p>Game Over: {{ gameOver === true }}</p>
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import { entities } from './level1Entities'
import Entity, { IEntity } from './Entity'
import IFuel from './IFuel'

@Component
export default class Stage extends Vue {
  @Prop() private color!: string
  @Prop({ default: 10 }) private maxSpeedX!: number
  @Prop({ default: 10 }) private maxSpeedY!: number
  @Prop({ default: 0 }) private windSpeed!: number

  private fps: number = 16
  private curX: number = 0
  private curY: number = 0
  private gravityY: number = 0.05
  private YSpeed: number = 0
  private XSpeed: number = 0
  private gravityX: number = 0.0
  private interval: any = null
  private directionAnimationTimeout: any = null
  private touchType: string = ''
  private direction: string = 'neutral'
  private gameOver = false
  private entities: Entity[] = []

  private canvasWidth: number = 0
  private canvasHeight: number = 0

  private kopter = {
    width: 0,
    height: 0,
    x: 0,
    y: 0
  }

  private drainFuel!: number

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

  private start() {
    const ctx: any = this.canvas.getContext('2d')
    const rand = Math.random() * 100
    for (const entity of this.entities) {
      this.drawEntity(entity, ctx)
    }
    this.drawFuel(ctx)
    this.updateGameArea(ctx)
  }

  private mounted() {
    // Device screen size
    this.canvas.style.width = window.innerWidth + 'px'
    this.canvas.style.height = window.innerHeight + 'px'

    // Below is the screensize to use, it includes DPS so that things do not blur
    const scale = window.devicePixelRatio
    this.canvasWidth = window.innerWidth * scale
    this.canvasHeight = window.innerHeight * scale

    this.canvas.width = this.canvasWidth
    this.canvas.height = this.canvasHeight

    this.kopter = {
      width: this.canvasWidth / 20,
      height: this.canvasWidth / 40,
      x: this.canvasWidth / 2,
      y: this.canvasHeight
    }
    this.curX = this.kopter.x
    this.curY = this.kopter.y

    for (const entity of entities) {
      const theHeight = (entity.height / 100) * this.canvasHeight
      const data: IEntity = {
        x: (entity.x / 100) * this.canvasWidth,
        y: (entity.y / 100) * this.canvasHeight - theHeight,
        width: (entity.width / 100) * this.canvasWidth,
        height: theHeight,
        name: entity.name,
        color: entity.color
      }

      this.entities.push(new Entity(data))
    }

    const totalFuel = 100

    this.fuel = {
      x: this.canvasWidth / 10,
      y: this.canvasHeight / 10,
      width: this.canvasWidth / 4,
      height: this.canvasWidth / 100,
      total: totalFuel,
      current: totalFuel
    }
    this.start()
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
    for (const entity of this.entities) {
      this.drawEntity(entity, ctx)
    }
    this.drawFuel(ctx)
  }

  private newPos() {
    if (
      this.YSpeed + this.gravityY <= this.maxSpeedY &&
      this.YSpeed + this.gravityY >= -this.maxSpeedY
    ) {
      this.YSpeed += this.gravityY
    }
    this.XSpeed = this.gravityX
    this.curX += this.XSpeed
    this.curY += this.YSpeed
    this.hitBoundaries()
  }

  private isOnPlatform(curX: number, curY: number, entity: IEntity) {
    const entityTop = entity.y - this.kopter.height
    const entityLeft = entity.x
    const entityRight = entity.x + entity.width
    if (
      curY > entityTop &&
      curX + this.kopter.width > entityLeft &&
      curX < entityRight
    ) {
      return true
    } else {
      if (
        curY > entityTop &&
        curX + this.kopter.width > entityLeft - this.XSpeed &&
        curX + this.kopter.width < entityRight &&
        this.XSpeed > 0
      ) {
        console.log('crashed into left of platform')
        this.gameOver = true
      }
      if (
        curY > entityTop &&
        curX < entityRight + -this.XSpeed &&
        curX > entityLeft &&
        this.XSpeed < 0
      ) {
        console.log('crashed into right of platform')
        this.gameOver = true
      }
      return false
    }
  }

  private hitBoundaries() {
    const rockbottom = this.canvas.height - this.kopter.height

    let onSurface: boolean = false
    // stop if hit bottom or platform surface
    for (const entity of this.entities) {
      if (this.isOnPlatform(this.curX, this.curY, entity)) {
        this.curY = entity.y - this.kopter.height
        this.YSpeed = 0
        onSurface = true || onSurface
      } else if (this.curY > rockbottom) {
        this.curY = rockbottom
        this.YSpeed = 0
        onSurface = true || onSurface
        this.gameOver = true
      } else {
        onSurface = false || onSurface
      }
    }
    this.tapering(this.windSpeed, onSurface)
    // Stop if hit roof
    if (this.curY < 0) {
      if (this.YSpeed > -5) {
        this.YSpeed = -this.YSpeed
      } else {
        this.gameOver = true
      }
    }

    // stop if hit left side walls
    if (this.curX < 0) {
      if (this.XSpeed < 5) {
        this.XSpeed = -this.XSpeed
        this.gravityX = -this.gravityX
      } else {
        this.gameOver = true
      }
    }
    // stop if hit right side walls
    if (this.curX + this.kopter.width > this.canvas.width) {
      if (this.XSpeed < 5) {
        this.XSpeed = -this.XSpeed
        this.gravityX = -this.gravityX
      } else {
        this.gameOver = true
      }
    }
  }

  private tapering(resistance: number = 0.02, onSurface: boolean) {
    if (this.XSpeed > 0.02) {
      this.XSpeed -= 0.02
      this.gravityX -= 0.02
    } else if (this.XSpeed < -0.02) {
      this.XSpeed += 0.02
      this.gravityX += 0.02
    } else {
      this.XSpeed = 0
      this.gravityX = 0
    }

    if (onSurface === false) {
      if (this.XSpeed <= this.maxSpeedX && this.XSpeed >= -this.maxSpeedX) {
        this.XSpeed += resistance
        this.gravityX += resistance
      }
    }
  }

  private updateGameArea(ctx: CanvasRenderingContext2D): any {
    if (this.gameOver === false) {
      requestAnimationFrame(() => this.updateGameArea(ctx))
    }
    this.clear(ctx)
    this.newPos()

    this.update(ctx)
  }

  private accelerateY(n: number, touchType: string) {
    if (n > 0) {
      this.gravityY = n
      clearInterval(this.drainFuel)
    } else {
      if (this.fuel.current > 0) {
        this.gravityY = n
        this.drainFuel = setInterval(() => {
          if (this.fuel.current > 0) {
            this.fuel.current -= 2
          } else {
            console.log('OUT OF FUEL!')
            this.gravityY = 0 - this.gravityY
            clearInterval(this.drainFuel)
          }
        }, 200)
      } else {
        console.log('OUT OF FUEL!')
      }
    }
  }

  private accelerateX(n: number, type: string) {
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

  private drawKopter(ctx: CanvasRenderingContext2D) {
    let img: HTMLImageElement
    if (this.direction === 'right') {
      img = this.$refs.kopterForward as HTMLImageElement
    } else if (this.direction === 'left') {
      img = this.$refs.kopterBackward as HTMLImageElement
    } else {
      img = this.$refs.kopter as HTMLImageElement
    }

    ctx.drawImage(
      img,
      this.curX,
      this.curY,
      this.kopter.width,
      this.kopter.height
    )
  }

  private drawEntity(entity: IEntity, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = entity.color
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
  }

  private drawFuel(ctx: CanvasRenderingContext2D) {
    const newWidth = (this.fuel.current / this.fuel.total) * this.fuel.width
    ctx.fillStyle = 'orange'
    ctx.fillRect(this.fuel.x, this.fuel.y, newWidth, this.fuel.height)
  }

  private stop() {
    clearInterval(this.interval)
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
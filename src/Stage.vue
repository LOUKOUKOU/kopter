<template>
  <main>
    <img ref="kopter" class="invis" :src="require('./assets/images/kopter.gif')" />
    <img ref="kopterBackward" class="invis" :src="require('./assets/images/kopter_backward.gif')" />
    <img ref="kopterForward" class="invis" :src="require('./assets/images/kopter_forward.gif')" />
    <h2 v-if="gameOver === true" id="gameOver">GAME OVER</h2>
    <canvas ref="canvas"></canvas>
    <div id="dashboard">
      <button v-touch:start="() => accelerateX(-1, 'left')">ACCELERATE LEFT</button>
      <button
        v-touch:start="() => accelerateY(-0.1, 'start')"
        v-touch:end="() => accelerateY(0.1, 'end')"
        class="exel"
      >ACCELERATE</button>
      <button v-touch:start="() =>accelerateX(1, 'right')">ACCELERATE RIGHT</button>
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
@Component
export default class Stage extends Vue {
  @Prop() private windowWidth!: number
  @Prop() private windowHeight!: number

  @Prop() private width!: number
  @Prop() private height!: number
  @Prop() private x!: number
  @Prop() private y!: number
  @Prop() private color!: string
  @Prop({ default: 3 }) private maxSpeedX!: number
  @Prop({ default: 3 }) private maxSpeedY!: number
  @Prop({ default: -0.0 }) private windSpeed!: number

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

  private fuel = {
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

  private start() {
    this.canvas.width = this.windowWidth
    this.canvas.height = this.windowHeight
    document.body.insertBefore(this.canvas, document.body.childNodes[0])
    for (const entity of this.entities) {
      this.drawEntity(entity)
    }
    this.drawFuel()
    this.interval = setInterval(this.updateGameArea, this.fps)
  }

  private mounted() {
    this.curX = this.x
    this.curY = this.y
    for (const entity of entities) {
      const theHeight = (entity.height / 100) * this.windowHeight
      const data: IEntity = {
        x: (entity.x / 100) * this.windowWidth,
        y: (entity.y / 100) * this.windowHeight - theHeight,
        width: (entity.width / 100) * this.windowWidth,
        height: theHeight,
        name: entity.name
      }

      this.entities.push(new Entity(data))
    }

    this.fuel = {
      x: this.windowWidth / 10,
      y: this.windowHeight / 10,
      width: this.width * 4,
      height: this.height / 4,
      total: 100,
      current: 100
    }
    this.start()
  }

  private update() {
    const ctx: any = this.canvas.getContext('2d')
    // ctx.fillStyle = this.color
    // ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const grd = ctx.createLinearGradient(0, this.canvas.height, 0, 0)
    grd.addColorStop(0, '#d47d48')
    grd.addColorStop(0.3, '#ddd')
    grd.addColorStop(1, '#7e94ae')

    // Fill with gradient
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.drawKopter()
    for (const entity of this.entities) {
      this.drawEntity(entity)
    }
    this.drawFuel()
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
    const entityTop = entity.y - this.height
    const entityLeft = entity.x
    const entityRight = entity.x + entity.width
    if (
      curY > entityTop &&
      curX + this.width > entityLeft &&
      curX < entityRight
    ) {
      return true
    } else {
      // console.log(curX + this.width, boatLeft)
      if (
        curY > entityTop &&
        curX + this.width > entityLeft - 1 &&
        curX + this.width < entityRight &&
        this.XSpeed > 0
      ) {
        console.log('crashed into left of platform')
        this.gameOver = true
      }
      if (
        curY > entityTop &&
        curX < entityRight + 1 &&
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
    const rockbottom = this.canvas.height - this.height

    let onSurface: boolean = false
    // stop if hit bottom or platform surface
    for (const entity of this.entities) {
      if (this.isOnPlatform(this.curX, this.curY, entity)) {
        this.curY = entity.y - this.height
        this.YSpeed = 0
        onSurface = true
      } else if (this.curY > rockbottom) {
        this.curY = rockbottom
        this.YSpeed = 0
        onSurface = true
        this.gameOver = true
      } else {
        onSurface = false
      }
    }

    this.tapering(this.windSpeed, onSurface)
    // Stop if hit roof
    if (this.curY < 0) {
      this.curY = 0
      this.YSpeed = 0
    }

    // stop if hit side walls
    if (this.curX < 0) {
      this.curX = 0
      this.XSpeed = 0
      this.gravityX = 0
    }
    // stop if hit side walls
    if (this.curX + this.width > this.canvas.width) {
      this.curX = this.canvas.width - this.width
      this.XSpeed = 0
      this.gravityX = 0
    }
  }

  private tapering(resistance: number = 0.02, onSurface?: boolean) {
    if (onSurface === false) {
      if (this.XSpeed <= this.maxSpeedX && this.XSpeed >= -this.maxSpeedX) {
        this.XSpeed += resistance
        this.gravityX += resistance
      }
    }
    // Need to decide if accelaration is constant or tapers off
    // if (onSurface === true) {
    // if (this.XSpeed > 0.02) {
    //   this.XSpeed -= resistance
    //   this.gravityX -= resistance
    // } else if (this.XSpeed < -0.02) {
    //   this.XSpeed += resistance
    //   this.gravityX += resistance
    // } else {
    //   this.XSpeed = 0
    //   this.gravityX = 0
    // }
    // }
  }

  private updateGameArea() {
    this.clear()
    this.newPos()
    this.update()
  }

  private accelerateY(n: number, touchType: string) {
    this.gravityY = n
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

  private drawKopter() {
    const ctx: any = this.canvas.getContext('2d')

    let img: HTMLImageElement
    if (this.direction === 'right') {
      img = this.$refs.kopterForward as HTMLImageElement
    } else if (this.direction === 'left') {
      img = this.$refs.kopterBackward as HTMLImageElement
    } else {
      img = this.$refs.kopter as HTMLImageElement
    }

    ctx.drawImage(img, this.curX, this.curY, this.width, this.height)
  }

  private drawEntity(entity: IEntity) {
    const ctx: any = this.canvas.getContext('2d')
    ctx.fillStyle = 'green'
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
  }

  private drawFuel() {
    const ctx: any = this.canvas.getContext('2d')
    ctx.fillStyle = 'orange'
    ctx.fillRect(this.fuel.x, this.fuel.y, this.fuel.width, this.fuel.height)
  }

  private stop() {
    clearInterval(this.interval)
  }

  private clear() {
    const ctx: any = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
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
</style>
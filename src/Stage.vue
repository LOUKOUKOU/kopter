<template>
  <main>
    <h1>kopter</h1>
    <canvas ref="canvas"></canvas>
    <div id="dashboard">
      <button v-touch:start="() => accelerateX(-1, 'left')">ACCELERATE LEFT</button>
      <button
        v-touch:start="() => accelerateY(-0.1, 'start')"
        v-touch:end="() => accelerateY(0.1, 'end')"
      >ACCELERATE</button>
      <button v-touch:start="() =>accelerateX(1, 'right')">ACCELERATE RIGHT</button>
      <p>Try accelerate the red square.</p>
      <p>Vertical Speed: {{ -Math.round(gravityYSpeed)}}</p>
      <p>Horizontal Speed: {{ Math.round(gravityXSpeed)}}</p>
      <p>Touch type: {{ touchType}}</p>
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'

@Component
export default class Stage extends Vue {
  @Prop() private windowWidth!: number
  @Prop() private windowHeight!: number

  @Prop() private width!: number
  @Prop() private height!: number
  @Prop() private x!: number
  @Prop() private y!: number
  @Prop() private color!: string

  private curX: number = 0
  private curY: number = 0
  private gravityY: number = 0.05
  private gravityYSpeed: number = 0
  private gravityXSpeed: number = 0
  private gravityX: number = 0.0
  private interval: any = null
  private touchType: string = ''

  private boat = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }

  private get canvas(): HTMLCanvasElement {
    return this.$refs.canvas as HTMLCanvasElement
  }

  private start() {
    this.canvas.width = this.windowWidth
    this.canvas.height = this.windowHeight
    document.body.insertBefore(this.canvas, document.body.childNodes[0])
    this.drawBoat()
    this.interval = setInterval(this.updateGameArea, 20)
  }

  private mounted() {
    this.curX = this.x
    this.curY = this.y
    this.boat = {
      x: this.windowWidth / 2,
      y: this.windowHeight - this.height / 2,
      width: this.width * 2,
      height: this.height / 2
    }
    this.start()
  }

  private update() {
    const ctx: any = this.canvas.getContext('2d')
    ctx.fillStyle = this.color
    ctx.fillRect(this.curX, this.curY, this.width, this.height)
    this.drawBoat()
  }

  private newPos() {
    this.gravityYSpeed += this.gravityY
    this.gravityXSpeed = this.gravityX
    this.curX += this.gravityXSpeed
    this.curY += this.gravityYSpeed
    this.hitBoundaries()
  }

  private platformTop(curX: number, curY: number) {
    const boatTop = this.boat.y - this.height
    const boatLeft = this.boat.x
    const boatRight = this.boat.x + this.boat.width
    if (
      curY > boatTop &&
      curX + this.width / 2 > boatLeft &&
      curX + this.width / 2 < boatRight
    ) {
      return true
    } else {
      return false
    }
  }

  private hitBoundaries() {
    const rockbottom = this.canvas.height - this.height

    // stop if hit bottom
    if (this.platformTop(this.curX, this.curY)) {
      this.curY = this.boat.y - this.height
      this.gravityYSpeed = 0
    } else if (this.curY > rockbottom) {
      this.curY = rockbottom
      this.gravityYSpeed = 0
      if (this.gravityXSpeed > 0.02) {
        this.gravityXSpeed -= 0.02
        this.gravityX -= 0.02
      } else if (this.gravityXSpeed < -0.02) {
        this.gravityXSpeed += 0.02
        this.gravityX += 0.02
      } else {
        this.gravityXSpeed = 0
        this.gravityX = 0
      }
    }
    // Stop if hit roof
    if (this.curY < 0) {
      this.curY = 0
      this.gravityYSpeed = 0
    }

    // stop if hit side walls
    if (this.curX < 0) {
      this.curX = 0
      this.gravityXSpeed = 0
    }
    // stop if hit side walls
    if (this.curX + this.width > this.canvas.width) {
      this.curX = this.canvas.width - this.width
      this.gravityXSpeed = 0
    }
  }

  private updateGameArea() {
    this.clear()
    this.newPos()
    this.update()
  }
  private accelerateY(n: number, touchType: string) {
    this.gravityY = n
    this.touchType = touchType
  }
  private accelerateX(n: number) {
    this.gravityX = this.gravityX + n
  }

  private drawBoat() {
    const ctx: any = this.canvas.getContext('2d')
    ctx.fillStyle = 'green'
    ctx.fillRect(this.boat.x, this.boat.y, this.boat.width, this.boat.height)
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

canvas {
  background-color: #f1f1f1;
}

#dashboard {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
}
</style>
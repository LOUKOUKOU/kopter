<template>
  <main>
    <h1>kopter</h1>
    <canvas ref="canvas"></canvas>
    <button v-touch:start="() => accelerateX(-1)">ACCELERATE LEFT</button>
    <button
      v-touch:start="() => accelerateY(-0.1, 'start')"
      v-touch:end="() => accelerateY(0.1, 'end')"
    >ACCELERATE</button>
    <button v-touch:start="() =>accelerateX(1)">ACCELERATE RIGHT</button>
    <p>Try accelerate the red square.</p>
    <p>Gravity Speed: {{ -gravityYSpeed}}</p>
    <p>Touch type: {{ touchType}}</p>
  </main>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'

@Component
export default class App extends Vue {
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
  private mounted() {
    this.curX = this.x
    this.curY = this.y
    this.start()
  }

  private update() {
    const ctx: any = this.canvas.getContext('2d')
    ctx.fillStyle = this.color
    ctx.fillRect(this.curX, this.curY, this.width, this.height)
  }

  private newPos() {
    this.gravityYSpeed += this.gravityY
    this.gravityXSpeed = this.gravityX
    this.curX += this.gravityXSpeed
    this.curY += this.gravityYSpeed
    this.hitBottom()
  }

  private hitBottom() {
    const rockbottom = this.canvas.height - this.height
    if (this.curY > rockbottom) {
      this.curY = rockbottom
      this.gravityYSpeed = 0
      if (this.gravityXSpeed > 0) {
        this.gravityXSpeed -= 0.02
        this.gravityX -= 0.02
      } else if (this.gravityXSpeed < 0) {
        this.gravityXSpeed += 0.02
        this.gravityX += 0.02
      } else {
        this.gravityXSpeed = 0
        this.gravityX = 0
      }
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

  private start() {
    this.canvas.width = 480
    this.canvas.height = 270
    document.body.insertBefore(this.canvas, document.body.childNodes[0])
    this.interval = setInterval(this.updateGameArea, 20)
  }

  private stop() {
    clearInterval(this.interval)
  }

  private clear() {
    const ctx: any = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private get canvas(): HTMLCanvasElement {
    return this.$refs.canvas as HTMLCanvasElement
  }
}
</script>

<style>
main {
  user-select: none;
}

@font-face {
  font-family: 'army';
  src: url(Army.ttf);
}

h1 {
  font: 'army';
}

canvas {
  border: 1px solid #d3d3d3;
  background-color: #f1f1f1;
}
</style>
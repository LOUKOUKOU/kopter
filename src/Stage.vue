<template>
  <main>
    <h1>kopter</h1>
    <canvas ref="canvas"></canvas>
    <div id="dashboard">
      <button v-touch:start="() => accelerateX(-1)">ACCELERATE LEFT</button>
      <button
        v-touch:start="() => accelerateY(-0.1, 'start')"
        v-touch:end="() => accelerateY(0.1, 'end')"
      >ACCELERATE</button>
      <button v-touch:start="() =>accelerateX(1)">ACCELERATE RIGHT</button>
      <p>Try accelerate the red square.</p>
      <p>Gravity Speed: {{ -Math.round(gravityYSpeed)}}</p>
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

  private get canvas(): HTMLCanvasElement {
    return this.$refs.canvas as HTMLCanvasElement
  }

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
    this.hitBoundaries()
  }

  private hitBoundaries() {
    const rockbottom = this.canvas.height - this.height
    // stop if hit bottom
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
    // Stop if hit roof
    if (this.curY < 0) {
      this.curY = 0
      this.gravityYSpeed = 0
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
    this.canvas.width = this.windowWidth
    this.canvas.height = this.windowHeight
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
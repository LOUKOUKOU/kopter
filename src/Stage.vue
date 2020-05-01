<template>
  <main>
    <img ref="kopter" class="invis" :src="require('./assets/images/kopter.gif')">
    <img ref="kopterBackward" class="invis" :src="require('./assets/images/kopter_backward.gif')">
    <img ref="kopterForward" class="invis" :src="require('./assets/images/kopter_forward.gif')">
    <h1>kopter</h1>
    <canvas ref="canvas"></canvas>
    <div id="dashboard">
      <button 
      v-touch:start="() => accelerateX(-1, 'left')">ACCELERATE LEFT</button>
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
  private directionAnimationTimeout: any = null
  private touchType: string = ''
  private direction: string = 'neutral'

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
    // ctx.fillStyle = this.color
    // ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const grd = ctx.createLinearGradient(0, this.canvas.height, 0, 0)
    grd.addColorStop(0, '#d47d48')
    grd.addColorStop(0.3, '#ddd')
    grd.addColorStop(1, '#7e94ae')

    // Fill with gradient
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    let img: HTMLImageElement
    if (this.direction === 'right') {
      img = this.$refs.kopterForward as HTMLImageElement
    } else
    if (this.direction === 'left') {
      img = this.$refs.kopterBackward as HTMLImageElement
    } else {
      img = this.$refs.kopter as HTMLImageElement
    }

    ctx.drawImage(img, this.curX, this.curY, this.width, this.height);

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
  private accelerateX(n: number, type: string) {
    this.gravityX = this.gravityX + n
    this.direction = type
    this.directionAnimationTimeout =
    setTimeout(() => {
      this.direction = 'neutral'
      clearTimeout(this.directionAnimationTimeout)
      },
      500
    )
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

canvas {
  background-color: #f1f1f1;
}

.invis {
  position: absolute;
  left: -5000px;
}

#dashboard {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
}
</style>
<template>
  <main>
    <img
      ref="kopterElement"
      class="invis"
      :style="{
        width: `${kopterAttributes.width}px`,
        height: `${kopterAttributes.height}px`,
      }"
      src="@/assets/images/kopter.png"
    />
    <img
      ref="platformElement"
      width="30px"
      height="30px"
      class="invis"
      src="@/assets/images/texture_building.png"
    />
    <img v-if="windSpeed >= 0.05" class="flag" src="@/assets/images/flag_right_strong.png" />
    <img v-else-if="windSpeed >= 0.02" class="flag" src="@/assets/images/flag_right_weak.png" />
    <img v-else-if="windSpeed >= -0.02" class="flag" src="@/assets/images/flag_left_weak.png" />
    <img v-else-if="windSpeed >= -0.05" class="flag" src="@/assets/images/flag_left_strong.png" />
    <img v-else class="flag" src="@/assets/images/flag_still.png" />
    <button id="pause" @click="handlePlayPaused">{{ paused === true ? 'Play' : 'Pause' }}</button>
    <button id="reset" v-if="gameOver === true" @click="init">Reset</button>
    <h2 v-if="gameOver === true" id="gameOver.value">GAME OVER</h2>
    <canvas ref="canvas"></canvas>
    <div id="dashboard">
      <button v-touch:tap="() => accelerateX(-2, 'left')">ACCELERATE LEFT</button>
      <button
        v-touch:press="() => accelerateY(-0.2, 'start')"
        v-touch:release="() => accelerateY(0.2, 'end')"
        class="exel"
      >
        ACCELERATE UP
      </button>

      <button v-touch:tap="() => accelerateX(2, 'right')">ACCELERATE RIGHT</button>
    </div>
    <div class="debug">
      <p>Try accelerate the red square.</p>
      <p>Vertical Speed: {{ -Math.round(ySpeed) }}</p>
      <p>Horizontal Speed: {{ Math.round(xSpeed) }}</p>
      <p>Game Over: {{ gameOver === true }}</p>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { level1Config } from '@/level1Config'
import Entity, { type IEntity } from '@/entity/Entity'
import Bullet, { type IBullet } from '@/entity/Bullet'
import Turret, { type ITurret } from '@/entity/Turret'

import type IFuel from '@/IFuel'
import Animator from '@/Animator'
// import Sound from '@/Sound'
import { ScaledValues } from '@/utils/ScaledValues'
import { onMounted, reactive, ref } from 'vue'
import type { Ref } from 'vue'
const ASSET_PATH = '../assets/images/'
const props = defineProps({
  color: { type: String },
  maxSpeedX: { type: Number, default: 100 },
  maxSpeedY: { type: Number, default: 100 },
  windSpeed: { type: Number, default: 0 },
})

let curX: number = 0
let curY: number = 0
let ySpeed: number = 0
let xSpeed: number = 0
let paused = false
let gravityY: number = 0.05
let gravityX: number = 0.0
let direction: string = 'neutral'
let directionAnimationTimeout: any = null
let bullets: Bullet[] = []
let turrets: Turret[] = []
const gameOver = ref(false)
const bounceSpeedThreshold = 50
const touchType: string = ''
const chopperSound = true
const platforms: Entity[] = []
// const sounds: { [k: string]: Sound } = {}
const scaledValues = new ScaledValues(0, 0)

let kopterAnimator: Animator

let drainFuelInterval!: any
const createBulletsInterval: any[] = []

const fuel: IFuel = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  total: 0,
  current: 0,
}

const canvas: Ref<HTMLCanvasElement | null> = ref(null)
const kopterElement: Ref<HTMLImageElement | null> = ref(null)
const platformElement: Ref<HTMLImageElement | null> = ref(null)
const kopterAttributes = reactive({
  width: 0,
  height: 0,
  x: 0,
  y: 0,
})

function initialiseEntities() {
  for (const platform of level1Config.platforms) {
    const theHeight = scaledValues.getHeight(platform.height)
    const data: IEntity = {
      x: scaledValues.getX(platform.x),
      y: scaledValues.getY(platform.y, theHeight),
      width: scaledValues.getX(platform.width),
      height: theHeight,
      name: platform.name,
      color: platform.color,
      isPlatform: platform.isPlatform,
      texture: platform.texture,
    }

    platforms.push(new Entity(data))
  }

  const kopterWidth = scaledValues.canvasWidth / 12
  const kopterHeight = scaledValues.canvasWidth / 23
  kopterAttributes.width = kopterWidth
  kopterAttributes.height = kopterHeight
  kopterAttributes.x = platforms[0].x
  kopterAttributes.y = platforms[0].y - kopterHeight * 1 - 30

  // placing kopter ontop of first skyscraper
  curX = kopterAttributes.x
  curY = kopterAttributes.y

  const totalFuel = 20000000000
  const fuelWidth = 25
  const fuelHeight = 2

  fuel.x = scaledValues.getX(10)
  fuel.y = scaledValues.getY(10, scaledValues.getHeight(fuelHeight))
  fuel.width = scaledValues.getWidth(25)
  fuel.height = scaledValues.getHeight(fuelHeight)
  fuel.total = totalFuel
  fuel.current = totalFuel

  for (const t of level1Config.turrets) {
    const turret = t as ITurret
    turrets.push(
      new Turret({
        name: turret.name,
        x: scaledValues.getX(turret.x),
        y: scaledValues.getY(turret.y, scaledValues.getHeight(turret.height)),
        width: scaledValues.getWidth(turret.width),
        height: scaledValues.getHeight(turret.height),
        color: turret.color,
        isPlatform: turret.isPlatform,
        rateOfFire: turret.rateOfFire,
        burst: turret.burst,
      }),
    )
  }

  for (const turret of turrets) {
    createBullets(turret)
  }
}

function init() {
  reset()
  initialiseEntities()
  if (canvas.value) {
    const ctx: any = canvas.value.getContext('2d')
    kopterAnimator = new Animator(230, 120, 6, kopterElement.value as HTMLImageElement, ctx)

    // const path1 = require('@/assets/sound/kopter.ogg')
    // const path2 = require('@/assets/sound/kopter_up.ogg')
    // const cannonPath = require('@/assets/sound/cannon.ogg')
    // sounds.kopter = new Sound(path2, true, false, 0.3)
    // sounds.kopter_idle = new Sound(path1, true, false, 0.2)
    // sounds.cannon = new Sound(cannonPath, false, false, 0.4)

    // window.addEventListener('focus', () => sounds.kopter_idle.play())
    // window.addEventListener('load', () => sounds.kopter_idle.play())
    // window.addEventListener('blur', () => sounds.kopter_idle.pause())

    const rand = Math.random() * 100
    for (const entity of platforms) {
      if (entity.texture) {
        drawPlatform(entity, ctx)
      } else {
        drawEntity(entity, ctx)
      }
    }
    drawFuel(ctx)
    for (const bullet of bullets) {
      drawEntity(bullet, ctx)
    }
    updateGameArea(ctx)
  }
}

onMounted(() => {
  // Below is the screensize to use, it includes DPS so that things do not blur
  const scale = window.devicePixelRatio
  scaledValues.canvasWidth = window.innerWidth * scale
  // canvasWidth = window.innerHeight * scale
  scaledValues.canvasHeight = window.innerHeight * scale

  if (canvas.value) {
    // Device screen size
    canvas.value.style.width = window.innerWidth + 'px'
    // canvas.value.style.width = window.innerHeight + 'px'
    canvas.value.style.height = window.innerHeight + 'px'
    canvas.value.width = scaledValues.canvasWidth
    canvas.value.height = scaledValues.canvasHeight
  }
  init()
})

function createBullets(turret: ITurret) {
  // Percentage of the screen
  const bulletHeight = 0.5
  const bulletWidth = 0.5

  const bulletInterval = setInterval(
    () => {
      const speed = 4
      // calculate triangle between two objects. hypotenuse being the longest side
      // this determines the factor between x and y for their respective speed values
      const width = kopterAttributes.x + kopterAttributes.width / 2 - turret.x
      const height = kopterAttributes.y + kopterAttributes.height / 2 - turret.y
      const hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
      const theCos = width / hypotenuse
      const theSin = height / hypotenuse
      const x = speed * theCos
      const y = speed * theSin
      bullets.push(
        new Bullet({
          name: 'bullet',
          x: turret.x,
          y: turret.y,
          width: scaledValues.getWidth(bulletWidth),
          height: scaledValues.getHeight(bulletHeight),
          color: 'black',
          isPlatform: false,
          xSpeed: x,
          ySpeed: -y,
        }),
      )
      // sounds.cannon.play()
    },
    (60 / turret.rateOfFire) * 1000,
  )

  createBulletsInterval.push(bulletInterval)
}

function update(ctx: CanvasRenderingContext2D) {
  const grd = ctx.createLinearGradient(0, getCanvasHeight(), 0, 0)
  grd.addColorStop(0, '#d47d48')
  grd.addColorStop(0.3, '#ddd')
  grd.addColorStop(1, '#7e94ae')

  // Fill with gradient
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, getCanvasWidth(), getCanvasHeight())

  drawKopter(ctx)
  for (const entity of platforms) {
    if (entity.texture) {
      drawPlatform(entity, ctx)
    } else {
      drawEntity(entity, ctx)
    }
  }
  drawFuel(ctx)
  for (let i = 0; i < bullets.length; i++) {
    if (
      bullets[i].x > scaledValues.canvasWidth ||
      bullets[i].x < 0 ||
      bullets[i].y > scaledValues.canvasHeight ||
      bullets[i].y < 0
    ) {
      bullets.splice(i, 1)
    } else {
      drawEntity(bullets[i], ctx)
    }
  }

  for (const turret of turrets) {
    drawEntity(turret, ctx)
  }
}

function newPos() {
  if (ySpeed + gravityY <= props.maxSpeedY && ySpeed + gravityY >= -1 * props.maxSpeedY) {
    ySpeed += gravityY
  }
  xSpeed = gravityX
  curX += xSpeed
  curY += ySpeed

  kopterAttributes.x = curX
  kopterAttributes.y = curY
  for (const bullet of bullets) {
    bullet.x += bullet.xSpeed
    bullet.y -= bullet.ySpeed
  }
  hitBoundaries()
}

function isTouchingEntity(curX: number, curY: number, entity: IEntity | IBullet) {
  const entityTop = entity.y - kopterAttributes.height
  const entityLeft = entity.x
  const entityRight = entity.x + entity.width
  const entityBottom = entity.y + entity.height
  if (
    curY > entityTop &&
    curY < entityTop + kopterAttributes.height &&
    curX + kopterAttributes.width > entityLeft &&
    curX < entityRight &&
    ySpeed >= 0
  ) {
    // it is on the top and can rest here
    if (entity.isPlatform === true) {
      // console.log(entity instanceof Entity)
      return true
    } else {
      console.log('crashed into top of platform')
      gameOver.value = true
      return false
    }
  } else {
    if (
      curY > entityTop &&
      curY < entityBottom &&
      curX + kopterAttributes.width > entityLeft - xSpeed &&
      curX + kopterAttributes.width < entityRight &&
      xSpeed > 0
    ) {
      console.log('crashed into left of platform')
      gameOver.value = true
    } else if (
      curY > entityTop &&
      curY < entityBottom &&
      curX < entityRight + -xSpeed &&
      curX > entityLeft &&
      xSpeed < 0
    ) {
      console.log('crashed into right of platform')
      gameOver.value = true
    } else if (
      curY < entityBottom &&
      curY > entityTop &&
      curX + kopterAttributes.width > entityLeft &&
      curX < entityRight &&
      ySpeed < 0
    ) {
      console.log('crashed into bottom of platform')
      gameOver.value = true
    }
    return false
  }
}

function handlePlayPaused() {
  paused = !paused
}

function getCanvasHeight() {
  return canvas.value ? canvas.value.height : 0
}

function getCanvasWidth() {
  return canvas.value ? canvas.value.width : 0
}

function hitBoundaries() {
  const rockbottom = getCanvasHeight() - kopterAttributes.height

  let onSurface: boolean = false
  // stop if hit bottom or platform surface
  for (const entity of platforms) {
    if (isTouchingEntity(curX, curY, entity)) {
      curY = entity.y - kopterAttributes.height
      ySpeed = 0
      onSurface = true || onSurface
    } else if (curY > rockbottom) {
      curY = rockbottom
      ySpeed = 0
      onSurface = true || onSurface
      gameOver.value = true
    } else {
      onSurface = false || onSurface
    }
  }

  for (const bullet of bullets) {
    if (isTouchingEntity(curX, curY, bullet)) {
      curY = bullet.y - kopterAttributes.height
      ySpeed = 0
      onSurface = true || onSurface
    } else if (curY > rockbottom) {
      curY = rockbottom
      ySpeed = 0
      onSurface = true || onSurface
      gameOver.value = true
    } else {
      onSurface = false || onSurface
    }
  }

  tapering(props.windSpeed, onSurface)
  // Stop if hit roof
  if (curY < 0) {
    if (ySpeed > -bounceSpeedThreshold) {
      ySpeed = -ySpeed
    } else {
      gameOver.value = true
    }
  }

  // stop if hit left side walls
  if (curX < 0) {
    if (-xSpeed < bounceSpeedThreshold) {
      xSpeed = -xSpeed
      gravityX = -gravityX
    } else {
      gameOver.value = true
    }
  }
  // stop if hit right side walls
  if (canvas.value && curX + kopterAttributes.width > getCanvasWidth()) {
    if (xSpeed < bounceSpeedThreshold) {
      xSpeed = -xSpeed
      gravityX = -gravityX
    } else {
      gameOver.value = true
    }
  }
}

function tapering(resistance: number = 0.02, onSurface: boolean) {
  if (xSpeed > 0.02) {
    xSpeed -= 0.02
    gravityX -= 0.02
  } else if (xSpeed < -0.02) {
    xSpeed += 0.02
    gravityX += 0.02
  } else {
    xSpeed = 0
    gravityX = 0
  }

  if (onSurface === false) {
    if (xSpeed <= props.maxSpeedX && xSpeed >= -props.maxSpeedX) {
      xSpeed += resistance
      gravityX += resistance
    }
  }
}

function reset() {
  gameOver.value = false
  bullets = []
  ySpeed = 0
  xSpeed = 0
  gravityY = 0.05
  gravityX = 0
  turrets = []
}

function handleGameOver() {
  clearInterval(drainFuelInterval)
  for (const bulletInterval of createBulletsInterval) {
    clearInterval(bulletInterval)
  }
}

function updateGameArea(ctx: CanvasRenderingContext2D): any {
  if (gameOver.value === false) {
    clear(ctx)
    newPos()

    update(ctx)
    requestAnimationFrame(() => updateGameArea(ctx))
  } else {
    handleGameOver()
    // sounds.kopter_idle.pause()
    // sounds.kopter.pause()
  }
}

function accelerateY(n: number, touchType: string) {
  if (gameOver.value === false) {
    if (touchType === 'start') {
      // sounds.kopter_idle.pause()
      // sounds.kopter.play()
    } else if (touchType === 'end') {
      // sounds.kopter_idle.play()
      // sounds.kopter.pause()
    }

    if (n > 0) {
      gravityY = n
      clearInterval(drainFuelInterval)
    } else {
      if (fuel.current > 0) {
        gravityY = n
        // this is for each click so  people cant exploit
        fuel.current -= 1
        drainFuelInterval = setInterval(() => {
          if (fuel.current > 0) {
            // this is the rate at which fuel burns on touchhold
            fuel.current -= 2
          } else {
            console.log('OUT OF FUEL!')
            gravityY = 0 - gravityY
            clearInterval(drainFuelInterval)
          }
        }, 200)
      } else {
        console.log('OUT OF FUEL!')
      }
    }
  }
}

function accelerateX(n: number, type: string) {
  if (gameOver.value === false) {
    if (gravityX + n <= props.maxSpeedX && gravityX + n >= -props.maxSpeedX) {
      gravityX = gravityX + n
    }

    direction = type
    directionAnimationTimeout = setTimeout(() => {
      direction = 'neutral'
      clearTimeout(directionAnimationTimeout)
    }, 500)
  }
}

function drawKopter(ctx: CanvasRenderingContext2D) {
  if (kopterAnimator) {
    kopterAnimator.nextFrame(
      kopterAttributes,
      direction === 'neutral' ? 0 : direction === 'left' ? 1 : 2,
    )
  }
}

function drawEntity(entity: IEntity, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = entity.color
  ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
}

async function drawPlatform(entity: IEntity, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = ctx.createPattern(
    platformElement.value as HTMLImageElement,
    'repeat',
  ) as CanvasPattern
  ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
}

function drawBullet(bullet: IBullet, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = bullet.color
  ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
}

function drawFuel(ctx: CanvasRenderingContext2D) {
  const newWidth = (fuel.current / fuel.total) * fuel.width
  ctx.fillStyle = 'orange'
  ctx.fillRect(fuel.x, fuel.y, newWidth, fuel.height)
}

function clear(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
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

#gameOver.value {
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

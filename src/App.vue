<template>
  <div>
    <div v-if="windowWidth == 0 && windowHeight === 0">Loading...</div>
    <stage v-else color="#1bffe3"></stage>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import stage from '@/Stage.vue'

@Component({
  components: {
    stage
  }
})
export default class App extends Vue {
  private windowWidth: number = 0
  private windowHeight: number = 0
  private scale = 0

  private mounted() {
    this.scale = window.devicePixelRatio
    this.windowWidth = window.innerWidth * this.scale
    this.windowHeight = window.innerHeight * this.scale
  }
}
</script>

<style>
</style>
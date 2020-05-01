<template>
  <div>
    <div v-if="windowWidth == 0 && windowHeight === 0">Loading...</div>
    <stage
      v-else
      :windowWidth="windowWidth"
      :windowHeight="windowHeight"
      :width="windowWidth / 30"
      :height="windowHeight / 15"
      color="#1bffe3"
      :x="1400"
      :y="75"
    ></stage>
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

  private mounted() {
    this.windowWidth = window.innerWidth - 16
    this.windowHeight = window.innerHeight - 16
  }
}
</script>

<style>
</style>
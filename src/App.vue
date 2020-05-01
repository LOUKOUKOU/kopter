<template>
  <stage :width="30" :height="30" color="red" :x="80" :y="75"></stage>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import stage from '@/Stage.vue'

@Component({
  components: {
    stage
  }
})
export default class App extends Vue {}
</script>

<style>
</style>
<script lang="ts" setup>
import stage from '@/components/Stage.vue'

const scale: number = window.devicePixelRatio
const windowWidth: number = window.innerWidth * scale
const windowHeight: number = window.innerHeight * scale
</script>

<template>
  <div>
    hello
    <div v-if="windowWidth == 0 && windowHeight === 0">Loading...</div>
    <stage v-else color="#1bffe3"></stage>
  </div>
</template>

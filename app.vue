<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <DebugWidget v-if="enableDebugWidget" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRuntimeConfig } from '#app'

const config = useRuntimeConfig()
const enableDebugWidget = computed(() => {
  return process.dev || String(config.public.enableDebugWidget) === 'true'
})
</script>

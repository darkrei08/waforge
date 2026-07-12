<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <DebugWidget />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRuntimeConfig } from '#app'

const config = useRuntimeConfig()
const enableDebugWidget = computed(() => true)
</script>

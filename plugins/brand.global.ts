export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.client) {
    const auth = useAuthStore() // Assuming auth store exists
    if (auth?.isAuthenticated) {
      const store = useSettingsStore()
      await store.fetchSettings()
    }
  }
})

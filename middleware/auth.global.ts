import { useAuthStore } from '~/stores/auth'
import { defineNuxtRouteMiddleware, navigateTo } from '#app'

export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = ['/login', '/register']
  const authStore = useAuthStore()
  
  const isAuthenticated = authStore.isAuthenticated

  if (publicRoutes.includes(to.path)) {
    if (isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  if (!isAuthenticated) {
    return navigateTo('/login')
  }
})

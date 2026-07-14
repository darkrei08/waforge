import { useAuthStore } from '~/stores/auth'
import { defineNuxtRouteMiddleware, navigateTo } from '#app'

export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = ['/login', '/register']
  const authStore = useAuthStore()
  
  const isAuthenticated = authStore.isAuthenticated

  // Strip i18n locale prefix to correctly match public routes
  const normalizedPath = to.path.replace(/^\/(en|it)/, '') || '/'

  if (publicRoutes.includes(normalizedPath)) {
    if (isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  if (!isAuthenticated) {
    return navigateTo('/login')
  }
})

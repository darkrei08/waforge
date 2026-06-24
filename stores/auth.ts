import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  
  const isAuthenticated = computed(() => !!user.value)
  const currentTeam = computed(() => {
    return user.value?.memberships?.[0]?.team || null
  })

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout error', e)
    }
    user.value = null
    const router = useRouter()
    if (router) {
      router.push('/login')
    } else {
      window.location.href = '/login'
    }
  }

  const fetchUser = async () => {
    try {
      const data: any = await $fetch('/api/auth/me')
      if (data && data.user) {
        user.value = data.user
      } else {
        user.value = null
      }
    } catch (e) {
      user.value = null
    }
  }

  return { user, isAuthenticated, currentTeam, fetchUser, logout }
})

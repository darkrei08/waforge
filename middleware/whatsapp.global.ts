export default defineNuxtRouteMiddleware((to) => {
  const waStore = useWhatsappStore()

  // Rotte protette che richiedono almeno un dispositivo connesso
  const protectedRoutes = ['/contacts', '/campaigns', '/chat', '/templates']

  // Strip i18n locale prefix before matching protected routes
  const normalizedPath = to.path.replace(/^\/(en|it)/, '') || '/'
  const isProtected = protectedRoutes.some(route => normalizedPath.startsWith(route))

  if (isProtected && !waStore.connected) {
    return navigateTo('/devices?blocked=true')
  }
})

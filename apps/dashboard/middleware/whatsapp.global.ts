export default defineNuxtRouteMiddleware(async (to) => {
  const waStore = useWhatsappStore()

  // Le sezioni rubriche (/contacts), campagne (/campaigns), template (/templates) e workspace AI (/chat)
  // sono sempre accessibili per permettere all'utente di operare sui propri dati CRM.
  const protectedRoutes: string[] = []

  // Strip i18n locale prefix before matching protected routes
  const normalizedPath = to.path.replace(/^\/(en|it)/, '') || '/'
  const isProtected = protectedRoutes.some(route => normalizedPath.startsWith(route))

  if (isProtected) {
    // Evita blocchi e reindirizzamenti prematuri durante SSR / prima idratazione se le sessioni stanno sincronizzando
    if (import.meta.server) {
      return
    }

    if (!waStore.fetched) {
      await waStore.fetchSessions()
    }

    if (waStore.sessions.length === 0) {
      return navigateTo('/devices?blocked=true')
    }
  }
})

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  // Inizializza array di telemetria globali su window
  if (!window.__waforge_debug_errors__) {
    window.__waforge_debug_errors__ = []
  }
  if (!window.__waforge_debug_network__) {
    window.__waforge_debug_network__ = []
  }

  // 1. Intercetta errori Vue (Rendering e Componenti)
  const originalErrorHandler = nuxtApp.vueApp.config.errorHandler
  nuxtApp.vueApp.config.errorHandler = (err: any, instance, info) => {
    window.__waforge_debug_errors__?.unshift({
      time: new Date().toLocaleTimeString(),
      type: 'Vue Error',
      message: err?.message || typeof err === 'string' ? err : 'Errore imprevisto nel componente Vue',
      stack: err?.stack || `Hook: ${info}`,
      source: `Component: ${instance?.$options?.name || instance?.$options?.__file || 'Anonymous'}`
    })
    if (originalErrorHandler) {
      originalErrorHandler(err, instance, info)
    } else {
      console.error('[WaForge Vue Error]', err, info)
    }
  }

  // 2. Intercetta chiamate Network $fetch ($fetch hooks / ofetch)
  const originalFetch = globalThis.$fetch
  if (originalFetch && typeof originalFetch.create === 'function') {
    let reqIdCounter = 1
    globalThis.$fetch = originalFetch.create({
      onRequest({ request, options }) {
        options._debugReqId = reqIdCounter++
        options._debugStartTime = performance.now()
      },
      onResponse({ request, response, options }) {
        const duration = Math.round(performance.now() - (options._debugStartTime || performance.now())) + 'ms'
        const urlStr = typeof request === 'string' ? request : (request?.url || String(request))
        window.__waforge_debug_network__?.unshift({
          id: options._debugReqId || Date.now(),
          method: (options.method || 'GET').toUpperCase(),
          url: urlStr,
          status: response.status || 200,
          duration
        })
        if (window.__waforge_debug_network__ && window.__waforge_debug_network__.length > 100) {
          window.__waforge_debug_network__.pop()
        }
        window.dispatchEvent(new CustomEvent('waforge-debug-network-update'))
      },
      onResponseError({ request, response, options }) {
        const duration = Math.round(performance.now() - (options._debugStartTime || performance.now())) + 'ms'
        const urlStr = typeof request === 'string' ? request : (request?.url || String(request))
        const status = response?.status || 500
        window.__waforge_debug_network__?.unshift({
          id: options._debugReqId || Date.now(),
          method: (options.method || 'GET').toUpperCase(),
          url: urlStr,
          status,
          duration
        })
        window.__waforge_debug_errors__?.unshift({
          time: new Date().toLocaleTimeString(),
          type: `HTTP ${status} Error`,
          message: `Richiesta fallita: ${urlStr}`,
          stack: JSON.stringify(response?._data || response?.statusText || 'Network Error'),
          source: 'Nitro API / $fetch'
        })
        window.dispatchEvent(new CustomEvent('waforge-debug-network-update'))
        window.dispatchEvent(new CustomEvent('waforge-debug-error-update'))
      }
    }) as typeof $fetch
  }
})

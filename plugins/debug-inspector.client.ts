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
    window.dispatchEvent(new CustomEvent('waforge-debug-error-update'))
    if (originalErrorHandler) {
      originalErrorHandler(err, instance, info)
    } else {
      console.error('[WaForge Vue Error]', err, info)
    }
  }

  // 1.1 Intercetta errori globali di logica e runtime JS (window.error)
  window.addEventListener('error', (event) => {
    window.__waforge_debug_errors__?.unshift({
      time: new Date().toLocaleTimeString(),
      type: 'JS Runtime Error',
      message: event.message || 'Runtime Logic Error',
      stack: event.error?.stack || `${event.filename || 'script'}:${event.lineno}:${event.colno}`,
      source: `Script: ${event.filename ? event.filename.split('/').pop() : 'Client Logic'}`
    })
    window.dispatchEvent(new CustomEvent('waforge-debug-error-update'))
  })

  // 1.2 Intercetta unhandled promise rejections (Async Logic Errors)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    window.__waforge_debug_errors__?.unshift({
      time: new Date().toLocaleTimeString(),
      type: 'Unhandled Promise Rejection',
      message: reason?.message || (typeof reason === 'string' ? reason : JSON.stringify(reason || 'Async Logic Error')),
      stack: reason?.stack || 'Async Operation / Promise Rejection',
      source: 'Async Client Logic'
    })
    window.dispatchEvent(new CustomEvent('waforge-debug-error-update'))
  })

  // 1.3 Intercetta console.error e console.warn
  const origConsoleError = console.error
  console.error = (...args: any[]) => {
    origConsoleError.apply(console, args)
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    if (!msg.includes('[WaForge Vue Error]')) {
      window.__waforge_debug_errors__?.unshift({
        time: new Date().toLocaleTimeString(),
        type: 'Console Error',
        message: msg.slice(0, 300),
        stack: new Error().stack || 'console.error',
        source: 'Console Logic'
      })
      window.dispatchEvent(new CustomEvent('waforge-debug-error-update'))
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

  // 2.1 Intercetta chiamate native window.fetch (es. SSE / Streaming / API custom)
  const nativeFetch = window.fetch
  window.fetch = async (...args: [RequestInfo | URL, RequestInit?]) => {
    const startTime = performance.now()
    const urlStr = typeof args[0] === 'string' ? args[0] : ('url' in args[0] ? args[0].url : String(args[0]))
    const method = (args[1]?.method || 'GET').toUpperCase()
    const reqId = Date.now() + Math.floor(Math.random() * 1000)

    try {
      const response = await nativeFetch(...args)
      const duration = Math.round(performance.now() - startTime) + 'ms'
      window.__waforge_debug_network__?.unshift({
        id: reqId,
        method,
        url: urlStr,
        status: response.status,
        duration
      })
      if (!response.ok) {
        window.__waforge_debug_errors__?.unshift({
          time: new Date().toLocaleTimeString(),
          type: `Fetch HTTP ${response.status}`,
          message: `Streaming/Fetch API fallita: ${urlStr}`,
          stack: `Status: ${response.status} ${response.statusText}`,
          source: 'Native fetch()'
        })
        window.dispatchEvent(new CustomEvent('waforge-debug-error-update'))
      }
      if (window.__waforge_debug_network__ && window.__waforge_debug_network__.length > 100) {
        window.__waforge_debug_network__.pop()
      }
      window.dispatchEvent(new CustomEvent('waforge-debug-network-update'))
      return response
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime) + 'ms'
      window.__waforge_debug_network__?.unshift({
        id: reqId,
        method,
        url: urlStr,
        status: 0,
        duration
      })
      window.__waforge_debug_errors__?.unshift({
        time: new Date().toLocaleTimeString(),
        type: 'Network Fetch Error',
        message: `Errore di connessione a: ${urlStr}`,
        stack: err?.stack || err?.message || String(err),
        source: 'Native fetch()'
      })
      window.dispatchEvent(new CustomEvent('waforge-debug-network-update'))
      window.dispatchEvent(new CustomEvent('waforge-debug-error-update'))
      throw err
    }
  }
})

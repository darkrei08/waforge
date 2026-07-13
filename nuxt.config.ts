export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  sourcemap: { server: false, client: false },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@nuxtjs/color-mode'
  ],

  css: ['~/assets/css/main.css'],

  i18n: {
    locales: [
      { code: 'it', file: 'it.json' },
      { code: 'en', file: 'en.json' }
    ],
    lazy: false,
    langDir: 'locales',
    defaultLocale: 'it',
    strategy: 'no_prefix'
  },

  colorMode: {
    classSuffix: ''
  },

  runtimeConfig: {
    redisUrl: process.env.REDIS_URL || '',
    databaseUrl: process.env.DATABASE_URL || '',
    public: {
      enableDebugWidget: process.env.ENABLE_DEBUG_WIDGET || 'true',
      oauthEnabled: !!process.env.OAUTH_CLIENT_ID,
      logLevelWaForge: process.env.LOG_LEVEL || process.env.LOG_LEVEL_WAFORGE || 'verbose',
      logLevelWuzAPI: process.env.LOG_LEVEL_WUZAPI || 'info',
      logLevelGoWA: process.env.LOG_LEVEL_GOWA || 'info',
      logLevelOpenWA: process.env.LOG_LEVEL_OPENWA || 'info',
      logLevelCockpit: process.env.LOG_LEVEL_COCKPIT || 'info',
      logLevelMCP: process.env.LOG_LEVEL_MCP || 'info'
    }
  },

  nitro: {
    externals: {
      external: ['@prisma/client']
    },
    experimental: {
      database: true,
      websocket: true
    }
  }
})

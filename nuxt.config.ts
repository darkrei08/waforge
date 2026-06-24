export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@nuxtjs/color-mode'
  ],

  i18n: {
    locales: [
      { code: 'it', file: 'it.json', name: 'Italiano' },
      { code: 'en', file: 'en.json', name: 'English' }
    ],
    defaultLocale: 'it',
    lazy: true,
    langDir: 'locales/'
  },

  colorMode: {
    classSuffix: ''
  },

  nitro: {
    experimental: {
      database: true,
      websocket: true
    }
  }
})

import it from './locales/it.json'
import en from './locales/en.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'it',
  messages: {
    it,
    en
  }
}))

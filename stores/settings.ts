/**
 * Settings Store
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface AppSettings {
  delayMin: number
  delayMax: number
  maxMessagesPerHour: number
  spintaxEnabled: boolean
  whatsappEngine: 'wuzapi' | 'gowa'
  supportedEngines: string[]
}

interface BrandSettings {
  primaryColor: string
  secondaryColor: string
  fontName: string
  enableGlassmorphism: boolean
  motionLevel: number
}

interface LlmSettings {
  provider: string
  apiKey: string
  model: string
  useCockpit: boolean
  cockpitAccount: string
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({
    delayMin: 15,
    delayMax: 45,
    maxMessagesPerHour: 100,
    spintaxEnabled: true,
    whatsappEngine: 'wuzapi',
    supportedEngines: ['wuzapi', 'gowa'],
  })
  
  const brandSettings = ref<BrandSettings>({
    primaryColor: '#25D366',
    secondaryColor: '#128C7E',
    fontName: 'Inter',
    enableGlassmorphism: true,
    motionLevel: 50,
  })

  const llmSettings = ref<LlmSettings>({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    useCockpit: false,
    cockpitAccount: ''
  })
  const cockpitAccounts = ref<{email: string, id: string}[]>([])
  const cockpitAvailable = ref(false)

  const loading = ref(false)
  const saved = ref(false)

  async function fetchSettings() {
    loading.value = true
    try {
      const [appRes, brandRes, llmRes, cockpitRes] = await Promise.all([
        $fetch<{ data: AppSettings }>('/api/settings'),
        $fetch<{ data: BrandSettings }>('/api/settings/brand').catch(() => ({ data: brandSettings.value })),
        $fetch<{ data: LlmSettings }>('/api/settings/llm').catch(() => ({ data: llmSettings.value })),
        $fetch<{ data: { available: boolean, accounts: any[] } }>('/api/settings/cockpit').catch(() => ({ data: { available: false, accounts: [] } }))
      ])
      settings.value = appRes.data
      if (brandRes.data) {
        brandSettings.value = brandRes.data
        applyBrandSettingsToDOM(brandRes.data)
      }
      if (llmRes.data) llmSettings.value = llmRes.data
      if (cockpitRes.data) {
        cockpitAvailable.value = cockpitRes.data.available
        cockpitAccounts.value = cockpitRes.data.accounts
      }
    } finally { loading.value = false }
  }

  async function saveSettings() {
    loading.value = true
    saved.value = false
    try {
      await Promise.all([
        $fetch('/api/settings', { method: 'PUT', body: settings.value }),
        $fetch('/api/settings/brand', { method: 'PUT', body: brandSettings.value }),
        $fetch('/api/settings/llm', { method: 'PUT', body: llmSettings.value })
      ])
      saved.value = true
      applyBrandSettingsToDOM(brandSettings.value)
      setTimeout(() => { saved.value = false }, 3000)
    } finally { loading.value = false }
  }

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null
  }

  function applyBrandSettingsToDOM(config: BrandSettings) {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    
    // Apply Colors
    const primaryRgb = hexToRgb(config.primaryColor)
    if (primaryRgb) root.style.setProperty('--primary', primaryRgb)
    
    const secondaryRgb = hexToRgb(config.secondaryColor)
    if (secondaryRgb) root.style.setProperty('--secondary', secondaryRgb)
    
    // Apply Typography
    root.style.setProperty('--font-sans', `"${config.fontName}", sans-serif`)
    
    // Apply UI Trends (Glassmorphism & Motion)
    root.style.setProperty('--glass-opacity', config.enableGlassmorphism ? '0.4' : '1')
    root.style.setProperty('--glass-blur', config.enableGlassmorphism ? '12px' : '0px')
    
    // Motion Level (0 to 100) -> mapped to transition duration
    const duration = Math.max(100, 600 - (config.motionLevel * 5))
    root.style.setProperty('--motion-duration', `${duration}ms`)
  }

  return { settings, brandSettings, llmSettings, cockpitAccounts, cockpitAvailable, loading, saved, fetchSettings, saveSettings, applyBrandSettingsToDOM }
})

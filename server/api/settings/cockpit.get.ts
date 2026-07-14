import { defineEventHandler } from 'h3'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

export default defineEventHandler(async () => {
  try {
    const homeDir = os.homedir()
    let cockpitDir = path.join(homeDir, '.antigravity_cockpit')
    const dockerCockpitDir = '/home/nuxtjs/.antigravity_cockpit'
    
    if (!fs.existsSync(cockpitDir) && fs.existsSync(dockerCockpitDir)) {
      cockpitDir = dockerCockpitDir
    }

    const accountsFile = path.join(cockpitDir, 'accounts.json')
    const accountsDir = path.join(cockpitDir, 'accounts')

    if (fs.existsSync(accountsFile)) {
      const data = JSON.parse(fs.readFileSync(accountsFile, 'utf-8'))
      if (data && Array.isArray(data.accounts)) {
        
        // Enrich accounts with quota from individual files
        const enrichedAccounts = data.accounts.map((acc: any) => {
          let quota = null
          let tierStr = 'FREE'
          
          try {
            if (acc && acc.id) {
              const accFilePath = path.join(accountsDir, `${acc.id}.json`)
              if (fs.existsSync(accFilePath)) {
                const accData = JSON.parse(fs.readFileSync(accFilePath, 'utf-8'))
                if (accData && accData.quota) {
                  quota = accData.quota.models
                  tierStr = accData.quota.subscription_tier || 'FREE'
                }
              }
            }
          } catch (e) {
            // Ignore parse errors for individual files
          }

          // Safe type checks to prevent 500 errors
          const isPro = typeof tierStr === 'string' && tierStr.toLowerCase().includes('pro')
          const safeEmail = (acc && acc.email && typeof acc.email === 'string') ? acc.email : 'Unknown'
          
          return {
            id: acc?.id || 'unknown',
            email: safeEmail,
            tier: isPro ? 'PRO' : 'FREE',
            quota: quota
          }
        })

        return {
          data: {
            available: true,
            accounts: enrichedAccounts
          }
        }
      }
    }
    return { data: { available: false, accounts: [] } }
  } catch (error) {
    return { data: { available: false, accounts: [] } }
  }
})

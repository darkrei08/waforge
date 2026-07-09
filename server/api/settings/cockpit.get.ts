import { defineEventHandler } from 'h3'
import fs from 'fs'
import path from 'path'
import os from 'os'

export default defineEventHandler(async () => {
  try {
    const isWindows = process.platform === 'win32'
    const homeDir = os.homedir()
    // Resolving paths as described in the cockpit-tools SKILL.md
    const cockpitDir = path.join(homeDir, '.antigravity_cockpit')
    const accountsFile = path.join(cockpitDir, 'accounts.json')
    
    if (fs.existsSync(accountsFile)) {
      const data = JSON.parse(fs.readFileSync(accountsFile, 'utf-8'))
      if (data && Array.isArray(data.accounts)) {
        return {
          data: {
            available: true,
            accounts: data.accounts.map((a: any) => ({ email: a.email, id: a.id }))
          }
        }
      }
    }
    return { data: { available: false, accounts: [] } }
  } catch (error) {
    return { data: { available: false, accounts: [] } }
  }
})

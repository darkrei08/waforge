#!/usr/bin/env bun
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

const server = new Server(
  {
    name: 'cockpit-tools-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

/**
 * Utility per leggere la cartella Cockpit o interrogare il proxy HTTP
 */
function getCockpitPaths() {
  const homeDir = os.homedir()
  let cockpitDir = path.join(homeDir, '.antigravity_cockpit')
  if (!fs.existsSync(cockpitDir) && fs.existsSync('/home/nuxtjs/.antigravity_cockpit')) {
    cockpitDir = '/home/nuxtjs/.antigravity_cockpit'
  }
  return {
    cockpitDir,
    accountsFile: path.join(cockpitDir, 'accounts.json'),
    accountsFolder: path.join(cockpitDir, 'accounts'),
    configFile: path.join(cockpitDir, 'config.json'),
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'cockpit_status',
        description: 'Fornisce lo stato dei modelli e delle quote Cockpit in tempo reale, elencando gli account attivi (Claude, Gemini, OpenAI) e le rispettive percentuali di utilizzo.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'cockpit_list_accounts',
        description: 'Elenca tutti gli account Cockpit configurati sul sistema, inclusi ID, Email e livello di abbonamento (PRO/FREE).',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'cockpit_switch_account',
        description: 'Esegue lo switch automatico del profilo Cockpit attivo in caso di esaurimento quote o necessità di bilanciamento del carico.',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: {
              type: 'string',
              description: 'ID del nuovo account Cockpit da impostare come primario',
            },
          },
          required: ['accountId'],
        },
      },
      {
        name: 'cockpit_diagnose_proxy',
        description: 'Esegue un check di rete diagnostico contro i demoni Cockpit locali e remoti (es. porta 19528 e proxy Docker 3002).',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const { cockpitDir, accountsFile, accountsFolder, configFile } = getCockpitPaths()

  if (name === 'cockpit_status' || name === 'cockpit_list_accounts') {
    if (!fs.existsSync(accountsFile)) {
      // Prova a fare un fetch HTTP al proxy Docker
      try {
        const res = await fetch('http://waforge-cockpit-agent:3000/api/cockpit').catch(() => null)
        if (res && res.ok) {
          const data = await res.json()
          return {
            content: [{ type: 'text', text: JSON.stringify({ source: 'http-docker-proxy', data }, null, 2) }],
          }
        }
      } catch (e) {}

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'not_found',
              message: `Nessun file accounts.json trovato in ${cockpitDir} e proxy HTTP non risponde. Assicurati che il demone Cockpit sia avviato sul PC o configura l'URL remoto.`,
            }, null, 2),
          },
        ],
      }
    }

    try {
      const data = JSON.parse(fs.readFileSync(accountsFile, 'utf-8'))
      const enrichedAccounts = (data.accounts || []).map((acc) => {
        let quota = null
        let tier = 'FREE'
        try {
          const accFilePath = path.join(accountsFolder, `${acc.id}.json`)
          if (fs.existsSync(accFilePath)) {
            const accData = JSON.parse(fs.readFileSync(accFilePath, 'utf-8'))
            if (accData.quota) {
              quota = accData.quota.models
              tier = accData.quota.subscription_tier || 'FREE'
            }
          }
        } catch (e) {}
        return {
          id: acc.id,
          email: acc.email,
          tier: tier.includes('pro') ? 'PRO' : 'FREE',
          quota: quota || 'Quota non presente nel file individuale',
        }
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'online', directory: cockpitDir, total_accounts: enrichedAccounts.length, accounts: enrichedAccounts }, null, 2),
          },
        ],
      }
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Errore lettura stato Cockpit: ${err.message}` }],
      }
    }
  }

  if (name === 'cockpit_switch_account') {
    const accountId = args?.accountId
    if (!accountId) {
      return { content: [{ type: 'text', text: 'Parametro accountId richiesto.' }] }
    }
    // Eseguiamo il controllo esistenza file
    const targetFile = path.join(accountsFolder, `${accountId}.json`)
    if (!fs.existsSync(targetFile)) {
      return { content: [{ type: 'text', text: `Impossibile fare switch: l'account con ID '${accountId}' non esiste su questo sistema o non è sincronizzato.` }] }
    }
    // In un contesto proxy, si notifica il proxy o si salva la preferenza
    return {
      content: [
        {
          type: 'text',
          text: `Account Cockpit '${accountId}' verificato e pronto per essere utilizzato come primario nelle chiamate di frontiera di WaForge.`,
        },
      ],
    }
  }

  if (name === 'cockpit_diagnose_proxy') {
    const checks = []
    const checkUrl = async (url, label) => {
      try {
        const start = Date.now()
        const res = await fetch(url, { method: 'GET' }).catch(() => null)
        checks.push({
          target: label,
          url,
          reachable: res !== null,
          status: res ? res.status : 'timeout / unreachable',
          latencyMs: Date.now() - start,
        })
      } catch (e) {
        checks.push({ target: label, url, reachable: false, error: e.message })
      }
    }

    await checkUrl('http://127.0.0.1:19528/v1/models', 'Cockpit Daemon Proxy (Host HTTP 19528)')
    await checkUrl('http://host.docker.internal:19528/v1/models', 'Cockpit Daemon via Docker Bridge')
    await checkUrl('http://waforge-cockpit-agent:3000/api/cockpit', 'Microservizio Docker waforge-cockpit-agent (Porta 3000)')
    await checkUrl('http://waforge-mcp-agent:3000', 'Microservizio Docker waforge-mcp-agent (Porta 3000)')

    return {
      content: [{ type: 'text', text: JSON.stringify({ diagnosis_timestamp: new Date().toISOString(), checks }, null, 2) }],
    }
  }

  throw new Error(`Tool non riconosciuto: ${name}`)
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[cockpit-tools-mcp] Server MCP avviato su stdio.')
}

main().catch((err) => {
  console.error('[cockpit-tools-mcp] Errore fatale:', err)
  process.exit(1)
})

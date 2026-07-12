import { defineEventHandler, readBody, createError, setResponseHeader } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { ListRootsRequestSchema, CreateMessageRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const { prompt, originalMessage, action, chatHistory } = await readBody(event)

  // Setup SSE Headers
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')
  const resNode = event.node.res
  let clientAborted = false
  resNode.on('close', () => {
    clientAborted = true
  })
  const sendEvent = (type: string, data: any) => {
    if (!clientAborted) {
      resNode.write(`data: ${JSON.stringify({ type, ...data })}\n\n`)
    }
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { llmSettings: true }
  })

  const settings: any = team?.llmSettings || {}
  
  let baseURL = 'https://api.openai.com/v1'
  if (settings.useCockpit) {
    baseURL = (process.env.COCKPIT_HOST_URL || 'http://127.0.0.1:19528') + '/v1'
  } else if (settings.provider === 'custom' && settings.customBaseUrl) {
    baseURL = settings.customBaseUrl
  } else if (settings.provider === 'openrouter' || settings.provider === 'meta') {
    baseURL = 'https://openrouter.ai/api/v1'
  } else if (settings.provider === 'deepseek') {
    baseURL = 'https://api.deepseek.com' // deepseek is openai compatible
  } else if (settings.provider === 'mistral') {
    baseURL = 'https://api.mistral.ai/v1' // mistral is openai compatible
  } else if (settings.provider === 'groq') {
    baseURL = 'https://api.groq.com/openai/v1' // groq is openai compatible
  } else if (settings.provider === 'cohere') {
    baseURL = 'https://api.cohere.com/v1' // cohere recently added openai compatibility
  } else if (settings.provider === 'gemini') {
    baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai'
  } else if (settings.provider === 'anthropic') {
    // Anthropic non ha compatibilità nativa con /chat/completions; forziamo via OpenRouter se non ci sono proxy terzi
    baseURL = 'https://openrouter.ai/api/v1'
  }

  let apiKey = settings.apiKey || 'dummy-key'

  if (settings.useCockpit) {
    let targetAccountId = settings.cockpitAccountId
    try {
      const homeDir = os.homedir()
      let cockpitDir = path.join(homeDir, '.antigravity_cockpit')
      const dockerCockpitDir = '/home/nuxtjs/.antigravity_cockpit'
      
      if (!fs.existsSync(cockpitDir) && fs.existsSync(dockerCockpitDir)) {
        cockpitDir = dockerCockpitDir
      }
      
      if (!targetAccountId) {
        const accountsFile = path.join(cockpitDir, 'accounts.json')
        if (fs.existsSync(accountsFile)) {
          const accList = JSON.parse(fs.readFileSync(accountsFile, 'utf-8'))
          if (accList?.accounts?.[0]?.id) {
            targetAccountId = accList.accounts[0].id
          }
        }
      }

      if (targetAccountId) {
        const accFilePath = path.join(cockpitDir, 'accounts', `${targetAccountId}.json`)
        if (fs.existsSync(accFilePath)) {
          const accData = JSON.parse(fs.readFileSync(accFilePath, 'utf-8'))
          apiKey = accData?.token?.access_token || accData?.oauth_token || accData?.api_key || settings.cockpitAccount || 'dummy-key'
        }
      } else {
        apiKey = settings.cockpitAccount || 'dummy-key'
      }

      // Smart Cockpit Proxy & Fallback Routing
      if (baseURL.includes(':19528')) {
        // 19528 is Cockpit Daemon WebSocket port. If HTTP proxy is not on another port, fallback to direct provider API using Cockpit token
        const checkModel = (settings.model || '').toLowerCase()
        if (checkModel.includes('gemini')) {
          baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai'
        } else if (checkModel.includes('claude')) {
          baseURL = 'https://openrouter.ai/api/v1'
        } else if (checkModel.includes('gpt')) {
          baseURL = 'https://api.openai.com/v1'
        } else {
          baseURL = 'https://openrouter.ai/api/v1'
        }
      }
    } catch (e) {
      console.error('Error reading cockpit token in generate.post.ts:', e)
    }
  }

  const model = settings.model || 'gpt-4o-mini'

  if (!apiKey && !settings.useCockpit && settings.provider !== 'custom') {
    throw createError({ statusCode: 400, statusMessage: 'API Key mancante nelle impostazioni LLM.' })
  }

  let systemPrompt = "Sei un esperto di marketing su WhatsApp. Il tuo compito è assistere l'utente nella scrittura di messaggi."
  
  if (action === 'antiban') {
    systemPrompt = `Sei un esperto di WhatsApp Marketing e Anti-Ban. 
Il tuo obiettivo è riscrivere il messaggio fornito seguendo scrupolosamente le linee guida anti-ban per il 2026:
1. Usa sintassi Spintax (es. {Ciao|Buongiorno|Ehi} oppure [Ciao|Buongiorno|Ehi]) per creare variazioni e impedire che i messaggi siano identici.
2. Inserisci sempre una chiara via di uscita (es. "Rispondi STOP per disiscriverti").
3. Evita linguaggio spam (TUTTO MAIUSCOLO, link eccessivi, keyword promozionali aggressive).
4. Usa variabili di personalizzazione come {{Name}} se opportuno.
5. Usa formattazione leggibile (*grassetto*, _corsivo_).
Restituisci SOLO il messaggio riscritto, pronto per l'uso.`
  } else if (action === 'improve') {
    systemPrompt = `Sei un copywriter esperto. Il tuo compito è migliorare il lessico, la sintassi e la leggibilità del testo fornito.
DEVI OBBLIGATORIAMENTE usare la formattazione di WhatsApp (*grassetto*, _corsivo_) per evidenziare le parole chiave, e USARE la sintassi Spintax (es. {Ciao|Salve|Ehi} o [Ciao|Salve|Ehi]) dove possibile per creare varianti del messaggio e renderlo dinamico.`
  }

  let messages = []
  let defaultReq = action === 'antiban' ? "Applica regole anti-ban al seguente testo." : "Migliora la formattazione e la sintassi del seguente testo."

  if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
    messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory
    ]
    if (action === 'improve' || action === 'antiban') {
      messages.push({
        role: 'user',
        content: `Testo attuale:\n\n${originalMessage}\n\nRichiesta: ${defaultReq}`
      })
    }
  } else {
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt || (originalMessage ? `Testo attuale:\n\n${originalMessage}\n\nRichiesta: ${defaultReq}` : "Ciao!") }
    ]
  }

  const mcpServers = Array.isArray(settings.mcpServers) ? settings.mcpServers : []
  let availableTools: any[] = []
  const mcpClients: { client: Client, transport: StdioClientTransport, serverName: string }[] = []

  console.log(`[waforge-llm] Avvio richiesta LLM | Action: ${action || 'default'} | Model: ${model} | Provider: ${settings.provider} | UseCockpit: ${settings.useCockpit || false}`)

  try {
    sendEvent('progress', { msg: 'Inizializzazione server MCP...' })

    // 1. Initialize MCP Clients if servers are defined
    for (const cmd of mcpServers) {
      if (!cmd.trim() || cmd.trim().startsWith('{')) continue // Skip obvious JSON pasting mistakes
      const args = cmd.split(' ')
      const command = args.shift()!
      const friendlyName = args.find(a => a.includes('@modelcontextprotocol/server-'))?.replace('@modelcontextprotocol/server-', '') || args[0] || command
      
      sendEvent('progress', { msg: `Avvio MCP: ${friendlyName}...` })
      console.log(`[waforge-mcp-agent] Tentativo avvio server MCP [${friendlyName}] con comando: ${command} ${args.join(' ')}`)
      
      try {
        const transport = new StdioClientTransport({
          command,
          args,
          env: process.env
        })
        
        const client = new Client({ name: 'waforge-client', version: '1.0.0' }, { 
          capabilities: {
            roots: { listChanged: false },
            sampling: {}
          } 
        })

        // Roots capability
        client.setRequestHandler(ListRootsRequestSchema, async () => {
          console.log(`[waforge-mcp-agent] MCP [${friendlyName}] ha richiesto la lista delle directory root.`)
          return {
            roots: [
              {
                uri: `file://${process.cwd()}`,
                name: 'Workspace corrente'
              }
            ]
          }
        })

        // Sampling capability
        client.setRequestHandler(CreateMessageRequestSchema, async (req: any) => {
          console.log(`[waforge-mcp-agent] MCP [${friendlyName}] richiede un sampling (LLM Inception)...`)
          sendEvent('progress', { msg: `Il server MCP [${friendlyName}] richiede un sampling (LLM Inception)...` })
          let samplingRes: any
          try {
            samplingRes = await fetch(`${baseURL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: req.params.modelPreferences?.hints?.[0]?.name || model,
                messages: req.params.messages,
                max_tokens: req.params.maxTokens || 1000
              })
            })
          } catch (sampErr: any) {
            if (settings.useCockpit && (sampErr.message?.includes('failed') || sampErr.message?.includes('ECONNREFUSED') || sampErr.message?.includes('Empty reply'))) {
              const checkModel = (req.params.modelPreferences?.hints?.[0]?.name || model || '').toLowerCase()
              let fallbackUrl = 'https://openrouter.ai/api/v1'
              if (checkModel.includes('gemini')) fallbackUrl = 'https://generativelanguage.googleapis.com/v1beta/openai'
              else if (checkModel.includes('gpt')) fallbackUrl = 'https://api.openai.com/v1'
              
              console.warn(`[waforge-cockpit-agent] Sampling fallito su proxy locale, fallback su API diretta: ${fallbackUrl}`)
              samplingRes = await fetch(`${fallbackUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                  model: req.params.modelPreferences?.hints?.[0]?.name || model,
                  messages: req.params.messages,
                  max_tokens: req.params.maxTokens || 1000
                })
              })
            } else {
              throw sampErr
            }
          }
          const samplingData = await samplingRes.json()
          return {
            role: samplingData.choices?.[0]?.message?.role || 'assistant',
            content: { type: 'text', text: samplingData.choices?.[0]?.message?.content || '' },
            model: samplingData.model || model
          }
        })

        // Add a safe timeout (4s) to prevent hanging forever on missing/404 MCP servers
        await Promise.race([
          client.connect(transport),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connessione o pacchetto non trovato')), 4000))
        ])
        
        const toolsRes = await client.listTools()
        console.log(`[waforge-mcp-agent] Server MCP [${friendlyName}] connesso con successo! Trovati ${toolsRes.tools.length} tool(s).`)
        
        for (const t of toolsRes.tools) {
          availableTools.push({
            type: 'function',
            function: {
              name: `${friendlyName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${t.name}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
              description: t.description,
              parameters: t.inputSchema
            },
            _mcpClient: client,
            _originalName: t.name,
            _friendlyName: friendlyName
          })
        }
        mcpClients.push({ client, transport, serverName: friendlyName })
      } catch (err: any) {
        console.warn(`[waforge-mcp-agent] Impossibile avviare il server MCP [${friendlyName}]: ${err.message}`)
        sendEvent('progress', { msg: `MCP [${friendlyName}] saltato (${err.message})` })
      }
    }

    // 2. Agent Chat Loop
    let maxIterations = 5
    let currentIteration = 0
    let finalContent = ''

    console.log(`[waforge-llm] Inizio ciclo di generazione. Tool disponibili: ${availableTools.length}`)
    sendEvent('progress', { msg: 'Elaborazione della risposta (LLM)...' })

    while (currentIteration < maxIterations) {
      if (clientAborted) {
        console.warn(`[waforge-llm] Richiesta interrotta dal client.`)
        break
      }
      currentIteration++
      
      const payload: any = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500
      }
      
      if (availableTools.length > 0) {
        payload.tools = availableTools.map(t => ({ type: 'function', function: t.function }))
      }

      console.log(`[waforge-llm] Iterazione #${currentIteration} | Invio richiesta a ${baseURL}/chat/completions | Messaggi: ${messages.length}`)
      let res: any
      try {
        res = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload)
        })
      } catch (proxyErr: any) {
        if (settings.useCockpit && (proxyErr.message?.includes('failed') || proxyErr.message?.includes('ECONNREFUSED') || proxyErr.message?.includes('Empty reply'))) {
          const checkModel = (payload.model || '').toLowerCase()
          let fallbackUrl = 'https://openrouter.ai/api/v1'
          if (checkModel.includes('gemini')) fallbackUrl = 'https://generativelanguage.googleapis.com/v1beta/openai'
          else if (checkModel.includes('gpt')) fallbackUrl = 'https://api.openai.com/v1'
          
          console.warn(`[waforge-cockpit-agent] Proxy Cockpit HTTP (${baseURL}) non raggiungibile: ${proxyErr.message}. Esecuzione failover su API diretta (${fallbackUrl}).`)
          sendEvent('progress', { msg: `Cockpit proxy failover -> ${fallbackUrl}...` })
          res = await fetch(`${fallbackUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
          })
        } else {
          throw proxyErr
        }
      }

      if (!res.ok) {
        const errText = await res.text()
        console.error(`[waforge-llm] Errore API HTTP ${res.status}: ${errText}`)
        throw new Error(`LLM API Error (${res.status}): ${errText}`)
      }

      const data = await res.json()
      const message = data.choices?.[0]?.message
      if (!message) {
        throw new Error('Risposta vuota o formato non valido dal provider LLM')
      }
      
      messages.push(message)
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`[waforge-llm] Il modello ha richiesto l'esecuzione di ${message.tool_calls.length} tool(s).`)
        // Execute tools
        for (const call of message.tool_calls) {
          const fnName = call.function.name
          const args = JSON.parse(call.function.arguments || '{}')
          
          console.log(`[waforge-mcp-agent] Esecuzione tool [${fnName}] con argomenti:`, args)
          sendEvent('progress', { msg: `Esecuzione tool: ${fnName}...` })

          const toolConfig = availableTools.find(t => t.function.name === fnName)
          if (toolConfig) {
            try {
              const result = await toolConfig._mcpClient.callTool({
                name: toolConfig._originalName,
                arguments: args
              })
              console.log(`[waforge-mcp-agent] Tool [${fnName}] eseguito con successo.`)
              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: JSON.stringify(result)
              })
            } catch (e: any) {
              console.error(`[waforge-mcp-agent] Errore esecuzione tool [${fnName}]:`, e.message)
              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: `Error: ${e.message}`
              })
            }
          } else {
            console.warn(`[waforge-mcp-agent] Tool non trovato: ${fnName}`)
            messages.push({
              role: 'tool',
              tool_call_id: call.id,
              content: `Tool ${fnName} not found.`
            })
          }
        }
        sendEvent('progress', { msg: 'Analisi dei risultati del tool...' })
        continue // Continue the while loop with tool outputs
      } else {
        finalContent = message.content
        console.log(`[waforge-llm] Generazione completata con successo (${finalContent.length} caratteri).`)
        break // No more tool calls
      }
    }

    sendEvent('complete', { result: finalContent })
  } catch (err: any) {
    console.error(`[waforge-llm] Errore critico durante la generazione:`, err.message || err)
    sendEvent('error', { error: err.message || 'Errore Server' })
  } finally {
    // Cleanup MCP processes to avoid memory leaks
    for (const c of mcpClients) {
      try {
        await c.client.close()
      } catch (e) {}
    }
    resNode.end()
  }
})

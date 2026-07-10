import { defineEventHandler, readBody, createError, setResponseHeader } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
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
  const sendEvent = (type: string, data: any) => {
    resNode.write(`data: ${JSON.stringify({ type, ...data })}\n\n`)
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
  } else if (settings.provider === 'openrouter' || settings.provider === 'deepseek' || settings.provider === 'meta' || settings.provider === 'mistral') {
    baseURL = 'https://openrouter.ai/api/v1'
  } else if (settings.provider === 'gemini') {
    baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai'
  } else if (settings.provider === 'anthropic') {
    // Anthropic non ha compatibilità nativa con /chat/completions; forziamo via OpenRouter se non ci sono proxy terzi
    baseURL = 'https://openrouter.ai/api/v1'
  }

  let apiKey = settings.apiKey || 'dummy-key'

  if (settings.useCockpit) {
    if (settings.cockpitAccountId) {
      try {
        const homeDir = os.homedir()
        let cockpitDir = path.join(homeDir, '.antigravity_cockpit')
        const dockerCockpitDir = '/home/nuxtjs/.antigravity_cockpit'
        
        if (!fs.existsSync(cockpitDir) && fs.existsSync(dockerCockpitDir)) {
          cockpitDir = dockerCockpitDir
        }
        
        const accFilePath = path.join(cockpitDir, 'accounts', `${settings.cockpitAccountId}.json`)
        if (fs.existsSync(accFilePath)) {
          const accData = JSON.parse(fs.readFileSync(accFilePath, 'utf-8'))
          if (accData.token && accData.token.access_token) {
            apiKey = accData.token.access_token
          }
        }
      } catch (e) {
        console.error('Error reading cockpit token in generate.post.ts:', e)
      }
    } else {
      apiKey = settings.cockpitAccount || 'dummy-key'
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
1. Usa sintassi Spintax (es. {Ciao|Buongiorno|Ehi}) per creare variazioni e impedire che i messaggi siano identici.
2. Inserisci sempre una chiara via di uscita (es. "Rispondi STOP per disiscriverti").
3. Evita linguaggio spam (TUTTO MAIUSCOLO, link eccessivi, keyword promozionali aggressive).
4. Usa variabili di personalizzazione come {{Name}} se opportuno.
5. Usa formattazione leggibile (*grassetto*, _corsivo_).
Restituisci SOLO il messaggio riscritto, pronto per l'uso.`
  } else if (action === 'improve') {
    systemPrompt = `Sei un copywriter esperto. Il tuo compito è migliorare il lessico, la sintassi e la leggibilità (con markdown di WhatsApp) del testo fornito.`
  }

  let messages = []
  if (chatHistory && Array.isArray(chatHistory)) {
    messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory
    ]
  } else {
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt || (originalMessage ? `Testo attuale:\n\n${originalMessage}\n\nRichiesta: Miglioralo.` : "Ciao!") }
    ]
  }

  const mcpServers = settings.mcpServers || []
  let availableTools: any[] = []
  const mcpClients: { client: Client, transport: StdioClientTransport, serverName: string }[] = []

  try {
    // 1. Initialize MCP Clients if servers are defined
    for (const cmd of mcpServers) {
      if (!cmd.trim()) continue
      const args = cmd.split(' ')
      const command = args.shift()!
      
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
      client.setRequestHandler({ method: 'roots/list' } as any, async () => {
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
      client.setRequestHandler({ method: 'sampling/createMessage' } as any, async (req: any) => {
        sendEvent('progress', { msg: `Il server MCP richiede un sampling (LLM Inception)...` })
        const samplingRes = await fetch(`${baseURL}/chat/completions`, {
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
        const samplingData = await samplingRes.json()
        return {
          role: samplingData.choices[0].message.role,
          content: { type: 'text', text: samplingData.choices[0].message.content },
          model: samplingData.model
        }
      })

      await client.connect(transport)
      
      const toolsRes = await client.listTools()
      
      for (const t of toolsRes.tools) {
        availableTools.push({
          type: 'function',
          function: {
            name: `${command}_${t.name}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
            description: t.description,
            parameters: t.inputSchema
          },
          _mcpClient: client,
          _originalName: t.name
        })
      }
      mcpClients.push({ client, transport, serverName: command })
    }

    sendEvent('progress', { msg: 'Inizializzazione server MCP...' })

    // 2. Agent Chat Loop
    let maxIterations = 5
    let currentIteration = 0
    let finalContent = ''

    sendEvent('progress', { msg: 'Elaborazione della risposta (LLM)...' })

    while (currentIteration < maxIterations) {
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

      const res = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`LLM API Error: ${errText}`)
      }

      const data = await res.json()
      const message = data.choices[0].message
      
      messages.push(message)
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Execute tools
        for (const call of message.tool_calls) {
          const fnName = call.function.name
          const args = JSON.parse(call.function.arguments || '{}')
          
          sendEvent('progress', { msg: `Esecuzione tool: ${fnName}...` })

          const toolConfig = availableTools.find(t => t.function.name === fnName)
          if (toolConfig) {
            try {
              const result = await toolConfig._mcpClient.callTool({
                name: toolConfig._originalName,
                arguments: args
              })
              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: JSON.stringify(result)
              })
            } catch (e: any) {
              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: `Error: ${e.message}`
              })
            }
          } else {
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
        break // No more tool calls
      }
    }

    sendEvent('complete', { result: finalContent })
  } catch (err: any) {
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

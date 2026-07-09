import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const { prompt, originalMessage, action } = await readBody(event)

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { llmSettings: true }
  })

  const settings: any = team?.llmSettings || {}
  
  let baseURL = 'https://api.openai.com/v1'
  if (settings.useCockpit) {
    baseURL = 'http://127.0.0.1:19528/v1'
  } else if (settings.provider === 'custom' && settings.customBaseUrl) {
    baseURL = settings.customBaseUrl
  }

  const apiKey = settings.useCockpit ? (settings.cockpitAccount || 'dummy-key') : (settings.apiKey || 'dummy-key')
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
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt || (originalMessage ? `Migliora questo messaggio:\n\n${originalMessage}` : "Ciao!") }
  ]

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`LLM API Error: ${errText}`)
    }

    const data = await res.json()
    return { data: { result: data.choices[0].message.content } }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: 'Errore durante la generazione LLM', data: err.message })
  }
})

import { verifyJWT } from '../utils/jwt'

// Mappa per tenere traccia dei client connessi divisi per teamId
export const activeClients = new Map<string, any[]>()

export default defineWebSocketHandler({
  async open(peer) {
    // 1. Autenticazione via query string (es. /ws?token=XYZ)
    const url = new URL(peer.url || '', 'http://localhost')
    const token = url.searchParams.get('token')
    
    if (!token) {
      peer.send(JSON.stringify({ error: 'unauthorized' }))
      peer.close()
      return
    }

    const payload = await verifyJWT(token)
    if (!payload || !payload.teamId) {
      peer.send(JSON.stringify({ error: 'invalid token' }))
      peer.close()
      return
    }

    const teamId = payload.teamId as string
    
    // Attacchiamo il teamId al contesto del peer
    // @ts-ignore (peer.ctx is a standard object but types might not perfectly match)
    peer.ctx = { teamId }

    // Aggiungiamo il peer alla stanza del team
    const clients = activeClients.get(teamId) || []
    clients.push(peer)
    activeClients.set(teamId, clients)

    console.log(`[WS] Client collegato al team: ${teamId}`)
    peer.send(JSON.stringify({ type: 'connected', teamId }))
  },
  
  message(peer, message) {
    // La chat invia i messaggi tramite API REST (/api/chat/send)
    // I websocket qui li usiamo solo per *ricevere* eventi push dal server al client
    // (es. nuovo messaggio in arrivo, notifica di lettura, stato della campagna)
  },

  close(peer) {
    // @ts-ignore
    if (peer.ctx?.teamId) {
      // @ts-ignore
      const teamId = peer.ctx.teamId
      const clients = activeClients.get(teamId) || []
      activeClients.set(teamId, clients.filter(c => c !== peer))
      console.log(`[WS] Client disconnesso dal team: ${teamId}`)
    }
  },

  error(peer, error) {
    console.error('[WS] Errore connessione', error)
  }
})

/**
 * Utility function per inviare un payload realtime a tutti gli agenti di un Team
 */
export function broadcastToTeam(teamId: string, event: string, data: any) {
  const clients = activeClients.get(teamId) || []
  const payload = JSON.stringify({ type: event, data })
  for (const client of clients) {
    try {
      client.send(payload)
    } catch (e) {
      console.error('[WS] Errore di invio:', e)
    }
  }
}

import { defineEventHandler, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { checkPhone } from '~/lib/whatsapp-engine'
import { parseAndCleanPhone } from '~/lib/phone'
import { z } from 'zod'
import { zodReadBody } from '~/server/utils/validation'

const VerifyInstantSchema = z.object({
  phones: z.array(z.string()).optional(),
  contactIds: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  
  const session = await prisma.whatsAppSession.findFirst({ where: { teamId } })
  if (!session || !session.token) {
    throw createError({ statusCode: 400, statusMessage: 'Nessun dispositivo WhatsApp connesso. Connetti una sessione in Impostazioni prima di verificare.' })
  }

  const { phones = [], contactIds = [] } = await zodReadBody(event, VerifyInstantSchema)

  const numbersToCheck: { phone: string, contactId?: string }[] = []

  // Collect explicitly passed phone numbers
  for (const p of phones) {
    const parsed = parseAndCleanPhone(p)
    numbersToCheck.push({ phone: parsed.fullPhone || p })
  }

  // Collect contacts' primary and secondary numbers
  if (contactIds.length > 0) {
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds }, teamId }
    })
    for (const c of contacts) {
      numbersToCheck.push({ phone: c.fullPhone, contactId: c.id })
      if (c.secondaryPhones) {
        try {
          const sec: string[] = JSON.parse(c.secondaryPhones)
          for (const sp of sec) {
            const parsedSp = parseAndCleanPhone(sp)
            if (parsedSp.fullPhone) {
              numbersToCheck.push({ phone: parsedSp.fullPhone, contactId: c.id })
            }
          }
        } catch {
          // not valid json array
        }
      }
    }
  }

  // Dedup by phone
  const uniqueNumbers = new Map<string, { phone: string, contactId?: string }>()
  for (const item of numbersToCheck) {
    uniqueNumbers.set(item.phone, item)
  }

  const results: Record<string, { isOnWhatsApp: boolean, phone: string, reason?: string }> = {}

  // Check each unique number against WhatsApp
  for (const [phoneStr, item] of uniqueNumbers.entries()) {
    try {
      const isValid = await checkPhone(session.token, phoneStr)
      results[phoneStr] = {
        isOnWhatsApp: isValid,
        phone: phoneStr,
        ...(!isValid ? { reason: 'Numero fisso o non registrato su WhatsApp' } : {})
      }

      // If it's a primary contact number, update its isOnWhatsApp status in database
      if (item.contactId) {
        const contact = await prisma.contact.findUnique({ where: { id: item.contactId } })
        if (contact && contact.fullPhone === phoneStr) {
          await prisma.contact.update({
            where: { id: item.contactId },
            data: { isOnWhatsApp: isValid }
          })
        }
      }
    } catch (e: any) {
      results[phoneStr] = {
        isOnWhatsApp: false,
        phone: phoneStr,
        reason: e.message || 'Errore durante la verifica API'
      }
    }
  }

  return { results }
})

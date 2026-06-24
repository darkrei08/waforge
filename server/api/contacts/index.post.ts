/**
 * POST /api/contacts — Create a new contact
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { readValidatedBody } from '~/server/utils/validation'
import { CreateContactSchema } from '~/lib/validation'
import parsePhoneNumber from 'libphonenumber-js'

export default defineEventHandler(async (event) => {
  const data = await readValidatedBody(event, CreateContactSchema)
  const teamId = event.context.user.teamId

  let fullPhone = (data.prefix + data.phone).replace(/\D/g, '')
  let formattedPrefix = data.prefix
  let formattedPhone = data.phone

  try {
    // Attempt to parse the combined number assuming Italy (IT) as default region if no + is found
    const phoneNumberStr = data.phone.startsWith('+') ? data.phone : `${data.prefix}${data.phone}`
    const phoneNumber = parsePhoneNumber(phoneNumberStr, 'IT')
    
    if (phoneNumber && phoneNumber.isValid()) {
      fullPhone = phoneNumber.number.replace('+', '')
      formattedPrefix = `+${phoneNumber.countryCallingCode}`
      formattedPhone = phoneNumber.nationalNumber
    }
  } catch (e) {
    // Fallback to basic stripping if parsing fails
    console.error('Phone parsing error:', e)
  }

  const contact = await prisma.contact.create({
    data: {
      teamId,
      name: data.name,
      prefix: data.prefix,
      phone: data.phone,
      fullPhone,
      email: data.email,
      company: data.company,
      notes: data.notes,
      customFields: data.customFields ? JSON.stringify(data.customFields) : null,
    },
  })

  return { data: contact }
})

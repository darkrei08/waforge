/**
 * Phone Parsing Utility — International phone number parsing
 * Migrated from apps/dashboard/lib/phone.ts
 */
import parsePhoneNumber, { type PhoneNumber } from 'libphonenumber-js'

export interface ParsedPhoneResult {
  prefix: string
  phone: string
  fullPhone: string
  formatted: string
  isValid: boolean
}

export function parseAndCleanPhone(rawPhone: string, defaultCountry: any = 'IT'): ParsedPhoneResult {
  if (!rawPhone) {
    return { prefix: '+39', phone: '', fullPhone: '', formatted: '', isValid: false }
  }

  let clean = rawPhone.trim()
  if (clean.startsWith('00')) clean = '+' + clean.substring(2)

  let toParse = clean
  if (/^\d+$/.test(clean)) toParse = '+' + clean

  try {
    let parsed: PhoneNumber | undefined = parsePhoneNumber(toParse)
    if (!parsed || !parsed.isValid()) {
      parsed = parsePhoneNumber(clean, defaultCountry)
    }
    if (parsed && parsed.isValid()) {
      const prefix = `+${parsed.countryCallingCode}`
      const phone = parsed.nationalNumber
      const fullPhone = `${parsed.countryCallingCode}${parsed.nationalNumber}`
      return { prefix, phone, fullPhone, formatted: parsed.formatInternational(), isValid: true }
    }
  } catch (e) { /* Fallback below */ }

  const digitsOnly = clean.replace(/\D/g, '')
  let prefix = '+39'
  let phone = digitsOnly

  if (digitsOnly.startsWith('971') && digitsOnly.length >= 10) { prefix = '+971'; phone = digitsOnly.substring(3) }
  else if (digitsOnly.startsWith('39') && digitsOnly.length >= 11) { prefix = '+39'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('44') && digitsOnly.length >= 11) { prefix = '+44'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('49') && digitsOnly.length >= 11) { prefix = '+49'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('33') && digitsOnly.length >= 11) { prefix = '+33'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('34') && digitsOnly.length >= 11) { prefix = '+34'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('41') && digitsOnly.length >= 11) { prefix = '+41'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('55') && digitsOnly.length >= 12) { prefix = '+55'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('91') && digitsOnly.length >= 12) { prefix = '+91'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('86') && digitsOnly.length >= 12) { prefix = '+86'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('81') && digitsOnly.length >= 11) { prefix = '+81'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('61') && digitsOnly.length >= 11) { prefix = '+61'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('1') && digitsOnly.length === 11) { prefix = '+1'; phone = digitsOnly.substring(1) }
  else if (digitsOnly.startsWith('7') && digitsOnly.length === 11) { prefix = '+7'; phone = digitsOnly.substring(1) }

  return { prefix, phone, fullPhone: prefix.replace('+', '') + phone, formatted: `${prefix} ${phone}`, isValid: false }
}

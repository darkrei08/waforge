/**
 * CSV & Excel parser for contact import
 * Handles: comma/semicolon delimiters, UTF-8-BOM, numeric phones from Excel
 */

import parsePhoneNumber from 'libphonenumber-js'

export interface ParsedContact {
  name: string
  prefix: string
  phone: string
  fullPhone: string
  email?: string
  company?: string
  customFields?: Record<string, string>
  rawRow: Record<string, string>
}

export interface ParseResult {
  contacts: ParsedContact[]
  errors: { row: number; reason: string }[]
  totalRows: number
}

/**
 * Sanitize phone number using libphonenumber-js
 * Extracts prefix, national number, and full digits
 */
function sanitizePhone(prefix: string, phone: string): { full: string; pref: string; nat: string } {
  let p = String(prefix || '').trim()
  let n = String(phone || '').trim()
  if (p.endsWith('.0')) p = p.slice(0, -2)
  if (n.endsWith('.0')) n = n.slice(0, -2)

  let full = (p + n).replace(/\D/g, '')
  let pref = p.startsWith('+') ? p : (p ? `+${p}` : '+39')
  let nat = n

  try {
    const combined = n.startsWith('+') ? n : (p ? `${p.startsWith('+') ? p : '+' + p}${n}` : `+39${n}`)
    const phoneNumber = parsePhoneNumber(combined)
    
    if (phoneNumber && phoneNumber.isValid()) {
      full = phoneNumber.number.replace('+', '')
      pref = `+${phoneNumber.countryCallingCode}`
      nat = phoneNumber.nationalNumber
    }
  } catch (e) {
    // Fallback
  }

  return { full, pref, nat }
}

/**
 * Parse CSV text into contacts
 */
export function parseCSV(text: string): ParseResult {
  // Remove BOM
  const clean = text.replace(/^\uFEFF/, '')

  // Detect delimiter
  const firstLine = clean.split('\n')[0]
  const delimiter = firstLine.includes(';') ? ';' : ','

  const lines = clean.split('\n').filter(l => l.trim())
  if (lines.length < 2) {
    return { contacts: [], errors: [{ row: 0, reason: 'File vuoto o header mancante' }], totalRows: 0 }
  }

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''))
  const contacts: ParsedContact[] = []
  const errors: { row: number; reason: string }[] = []

  // Map case-insensitive headers
  const getCol = (row: string[], name: string): string => {
    const idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase())
    return idx >= 0 ? (row[idx] || '').trim().replace(/^"|"$/g, '') : ''
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter)
    const rawRow: Record<string, string> = {}
    headers.forEach((h, idx) => { rawRow[h] = (cells[idx] || '').trim().replace(/^"|"$/g, '') })

    const name = getCol(cells, 'Name') || getCol(cells, 'nome') || getCol(cells, 'nominativo')
    const prefix = getCol(cells, 'Prefix') || getCol(cells, 'prefisso') || '+39'
    const phone = getCol(cells, 'Phone') || getCol(cells, 'telefono') || getCol(cells, 'numero')

    if (!phone) {
      errors.push({ row: i + 1, reason: `Numero telefono mancante` })
      continue
    }

    const sanitized = sanitizePhone(prefix, phone)
    if (sanitized.full.length < 5) {
      errors.push({ row: i + 1, reason: `Numero non valido: ${phone}` })
      continue
    }

    // Custom fields: any column not in standard set
    const standardCols = new Set(['name', 'nome', 'prefix', 'prefisso', 'phone', 'telefono', 'numero', 'email', 'company', 'azienda', 'message'])
    const customFields: Record<string, string> = {}
    headers.forEach((h, idx) => {
      if (!standardCols.has(h.toLowerCase())) {
        customFields[h] = (cells[idx] || '').trim().replace(/^"|"$/g, '')
      }
    })

    contacts.push({
      name: name || `Contatto ${i}`,
      prefix: sanitized.pref,
      phone: sanitized.nat,
      fullPhone: sanitized.full,
      email: getCol(cells, 'email') || undefined,
      company: getCol(cells, 'Company') || getCol(cells, 'azienda') || undefined,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      rawRow,
    })
  }

  return { contacts, errors, totalRows: lines.length - 1 }
}

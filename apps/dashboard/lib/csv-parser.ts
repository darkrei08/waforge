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
  secondaryPhones?: string[]
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

    const name = getCol(cells, 'Name') || getCol(cells, 'nome') || getCol(cells, 'nominativo') || getCol(cells, 'contatto') || getCol(cells, 'azienda') || 'Senza Nome'
    const prefix = getCol(cells, 'Prefix') || getCol(cells, 'prefisso') || '+39'
    const phone = getCol(cells, 'Phone') || getCol(cells, 'telefono') || getCol(cells, 'numero') || getCol(cells, 'cellulare') || getCol(cells, 'mobile') || getCol(cells, 'cell') || getCol(cells, 'telefono 1') || getCol(cells, 'phone 1') || getCol(cells, 'cellulare 1')

    if (!phone) {
      errors.push({ row: i + 1, reason: `Numero telefono mancante` })
      continue
    }

    const sanitized = sanitizePhone(prefix, phone)
    if (sanitized.full.length < 5) {
      errors.push({ row: i + 1, reason: `Numero non valido: ${phone}` })
      continue
    }

    // Identifichiamo tutte le colonne destinate a telefoni secondari ("Telefono 2", "Telefono 3", "Telefono 4", "Phone 2..5", "Cellulare 2..5", ecc.)
    const secPatterns: (string | RegExp)[] = [
      'telefono 2', 'phone 2', 'cellulare 2', 'mobile 2', 'tel 2', 'numero 2', 'whatsapp 2', 'wa 2', 'secondario 1', 'telefono2', 'phone2', 'cellulare2',
      'telefono 3', 'phone 3', 'cellulare 3', 'mobile 3', 'tel 3', 'numero 3', 'whatsapp 3', 'wa 3', 'secondario 2', 'telefono3', 'phone3', 'cellulare3',
      'telefono 4', 'phone 4', 'cellulare 4', 'mobile 4', 'tel 4', 'numero 4', 'whatsapp 4', 'wa 4', 'secondario 3', 'telefono4', 'phone4', 'cellulare4',
      'telefono 5', 'phone 5', 'cellulare 5', 'mobile 5', 'tel 5', 'numero 5', 'whatsapp 5', 'wa 5', 'secondario 4', 'telefono5', 'phone5', 'cellulare5',
      'secondary phones', 'secondaryphones', 'altri numeri', 'altrinumeri', 'altri telefoni', 'altritelefoni', 'numeri aggiuntivi', 'telefoni aggiuntivi',
      /^(telefono|phone|cellulare|mobile|tel|numero|wa|whatsapp|secondario|secondaryphone|altronumero|altrotelefono)[\s_-]*([2-5])$/i
    ]

    const secColVals: string[] = []
    headers.forEach((h, idx) => {
      const hNorm = h.trim().toLowerCase().replace(/\s+/g, ' ').replace(/_/g, ' ')
      const hNoSpace = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
      const matches = secPatterns.some(p => {
        if (typeof p === 'string') return hNorm === p || hNoSpace === p
        return p.test(hNorm) || p.test(hNoSpace)
      })
      if (matches) {
        const val = (cells[idx] || '').trim().replace(/^"|"$/g, '')
        if (val) secColVals.push(val)
      }
    })

    const secondaryPhones: string[] = []
    secColVals.forEach(rawVal => {
      if (rawVal) {
        const parts = rawVal.split(',').map(s => s.trim()).filter(Boolean)
        for (const p of parts) {
          if (secondaryPhones.length < 4) {
            const spSan = sanitizePhone(prefix, p)
            if (spSan.full.length >= 5 && spSan.full !== sanitized.full && !secondaryPhones.includes(spSan.full)) {
              secondaryPhones.push(spSan.full)
            }
          }
        }
      }
    })

    // Custom fields: any column not in standard set and not caught as secondary phone column
    const standardSetNorm = new Set([
      'name', 'nome', 'nominativo', 'prefix', 'prefisso', 'phone', 'telefono', 'numero', 'email', 'company', 'azienda', 'message', 'messaggio'
    ])
    const customFields: Record<string, string> = {}
    headers.forEach((h, idx) => {
      const hNorm = h.trim().toLowerCase().replace(/\s+/g, ' ').replace(/_/g, ' ')
      const hNoSpace = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
      const isSecCol = secPatterns.some(p => {
        if (typeof p === 'string') return hNorm === p || hNoSpace === p
        return p.test(hNorm) || p.test(hNoSpace)
      })

      if (!standardSetNorm.has(hNorm) && !standardSetNorm.has(hNoSpace) && !isSecCol) {
        customFields[h] = (cells[idx] || '').trim().replace(/^"|"$/g, '')
      }
    })

    contacts.push({
      name: name || `Contatto ${i}`,
      prefix: sanitized.pref,
      phone: sanitized.nat,
      fullPhone: sanitized.full,
      secondaryPhones: secondaryPhones.length > 0 ? secondaryPhones : undefined,
      email: getCol(cells, 'email') || undefined,
      company: getCol(cells, 'Company') || getCol(cells, 'azienda') || undefined,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      rawRow,
    })
  }

  return { contacts, errors, totalRows: lines.length - 1 }
}

/**
 * Generate CSV string from contacts
 */
export function generateCSV(contacts: Partial<ParsedContact>[]): string {
  if (contacts.length === 0) return ''

  const headers = ['Name', 'Prefix', 'Phone', 'Email', 'Company']
  const rows = [headers.join(',')]

  for (const contact of contacts) {
    const row = [
      `"${(contact.name || '').replace(/"/g, '""')}"`,
      `"${(contact.prefix || '').replace(/"/g, '""')}"`,
      `"${(contact.phone || '').replace(/"/g, '""')}"`,
      `"${(contact.email || '').replace(/"/g, '""')}"`,
      `"${(contact.company || '').replace(/"/g, '""')}"`
    ]
    rows.push(row.join(','))
  }

  return rows.join('\n')
}

import parsePhoneNumber, { type PhoneNumber } from 'libphonenumber-js'

export interface ParsedPhoneResult {
  prefix: string      // es. "+39", "+44", "+1"
  phone: string       // es. "3271357323", "7911123456" (senza prefisso)
  fullPhone: string   // es. "393271357323" (solo cifre, con prefisso)
  formatted: string   // es. "+39 327 135 7323"
  isValid: boolean
}

/**
 * Parsa e pulisce un numero di telefono di qualsiasi paese al mondo,
 * separando in modo preciso il prefisso internazionale (prefix) dal numero locale (phone).
 * 
 * @param rawPhone - Stringa grezza (es. "393271357323", "+39 327...", "0039327...")
 * @param defaultCountry - Codice paese di fallback (es. "IT")
 */
export function parseAndCleanPhone(rawPhone: string, defaultCountry: any = 'IT'): ParsedPhoneResult {
  if (!rawPhone) {
    return { prefix: '+39', phone: '', fullPhone: '', formatted: '', isValid: false }
  }

  // Pulisci i caratteri speciali
  let clean = rawPhone.trim()
  if (clean.startsWith('00')) {
    clean = '+' + clean.substring(2)
  }

  // Se è solo una stringa di cifre es. "393271357323" e non ha un "+", aggiungiamo il "+" per permettere il parsing universale E.164
  let toParse = clean
  if (/^\d+$/.test(clean)) {
    // Se inizia con il prefisso di un paese (es. 39 per l'Italia o 1 per USA o 44 per UK), prova con "+" davanti
    toParse = '+' + clean
  }

  try {
    let parsed: PhoneNumber | undefined = parsePhoneNumber(toParse)
    if (!parsed || !parsed.isValid()) {
      // Prova con il defaultCountry se non aveva il prefisso esplicito
      parsed = parsePhoneNumber(clean, defaultCountry)
    }

    if (parsed && parsed.isValid()) {
      const prefix = `+${parsed.countryCallingCode}`
      const phone = parsed.nationalNumber
      const fullPhone = `${parsed.countryCallingCode}${parsed.nationalNumber}`
      return {
        prefix,
        phone,
        fullPhone,
        formatted: parsed.formatInternational(),
        isValid: true
      }
    }
  } catch (e) {
    // Fallback se libphonenumber non riesce
  }

  // Fallback euristico universale per i prefissi internazionali ordinati per lunghezza (cifre decrescenti)
  const digitsOnly = clean.replace(/\D/g, '')
  let prefix = '+39'
  let phone = digitsOnly

  // Prefissi a 3 cifre
  if (digitsOnly.startsWith('971') && digitsOnly.length >= 10) { prefix = '+971'; phone = digitsOnly.substring(3) }
  // Prefissi a 2 cifre
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
  else if (digitsOnly.startsWith('52') && digitsOnly.length >= 12) { prefix = '+52'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('54') && digitsOnly.length >= 12) { prefix = '+54'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('27') && digitsOnly.length >= 11) { prefix = '+27'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('82') && digitsOnly.length >= 11) { prefix = '+82'; phone = digitsOnly.substring(2) }
  else if (digitsOnly.startsWith('90') && digitsOnly.length >= 11) { prefix = '+90'; phone = digitsOnly.substring(2) }
  // Prefissi a 1 cifra
  else if (digitsOnly.startsWith('1') && digitsOnly.length === 11) { prefix = '+1'; phone = digitsOnly.substring(1) }
  else if (digitsOnly.startsWith('7') && digitsOnly.length === 11) { prefix = '+7'; phone = digitsOnly.substring(1) }

  return {
    prefix,
    phone,
    fullPhone: prefix.replace('+', '') + phone,
    formatted: `${prefix} ${phone}`,
    isValid: false
  }
}

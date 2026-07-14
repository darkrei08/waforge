import { describe, it, expect } from 'bun:test'
import { generateCSV } from '../lib/csv-parser'

describe('CSV Parser', () => {
  it('should export contacts to CSV string', () => {
    const contacts = [
      { name: 'Mario Rossi', prefix: '+39', phone: '3331234567', email: 'mario@example.com', company: 'Acme Inc' },
      { name: 'Luigi Verdi', prefix: '+44', phone: '777123456', email: '', company: '' }
    ]

    const csvStr = generateCSV(contacts as any)
    
    // Check headers
    expect(csvStr).toContain('Name,Prefix,Phone,Email,Company')
    // Check rows
    expect(csvStr).toContain('"Mario Rossi","+39","3331234567","mario@example.com","Acme Inc"')
    expect(csvStr).toContain('"Luigi Verdi","+44","777123456","",""')
  })
})

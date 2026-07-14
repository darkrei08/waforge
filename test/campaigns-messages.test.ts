import { describe, it, expect } from 'bun:test'
import * as fs from 'fs'
import * as path from 'path'

describe('Campaign Messages API', () => {
  it('should have GET /api/campaigns/[id]/messages.get.ts endpoint', () => {
    const dir = (import.meta as any).dir || (import.meta as any).dirname || path.resolve('test')
    const fileExists = fs.existsSync(path.join(dir, '../server/api/campaigns/[id]/messages.get.ts'))
    expect(fileExists).toBe(true)
  })
})

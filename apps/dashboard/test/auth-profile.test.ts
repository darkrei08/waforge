import { describe, it, expect } from 'bun:test'
import * as fs from 'fs'
import * as path from 'path'

describe('Profile API', () => {
  it('should have PUT /api/auth/profile endpoint', () => {
    const dir = (import.meta as any).dir || (import.meta as any).dirname || path.resolve('test')
    const fileExists = fs.existsSync(path.join(dir, '../server/api/auth/profile.put.ts'))
    expect(fileExists).toBe(true)
  })
})

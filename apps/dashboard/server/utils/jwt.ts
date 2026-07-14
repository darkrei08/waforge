import { SignJWT, jwtVerify } from 'jose'

const getSecret = () => new TextEncoder().encode(process.env.APP_SECRET || 'fallback-secret-min-32-chars-long-please-change')

export async function signJWT(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch (err) {
    return null
  }
}

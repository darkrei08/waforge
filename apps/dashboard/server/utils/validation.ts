/**
 * Validation helpers for Nitro/H3 event handlers.
 * Wraps Zod schemas to produce H3-compatible errors.
 */

import { z } from 'zod'
import { readBody, getQuery, createError } from 'h3'
import type { H3Event } from 'h3'

/**
 * Read and validate the request body against a Zod schema.
 * Throws H3 createError on validation failure.
 */
export async function zodReadBody<T extends z.ZodType>(
  event: H3Event,
  schema: T
): Promise<z.infer<T>> {
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation Error',
      data: {
        error: 'Validation Error',
        details: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    })
  }
  return result.data
}

/**
 * Read and validate query parameters against a Zod schema.
 * Throws H3 createError on validation failure.
 */
export function zodReadQuery<T extends z.ZodType>(
  event: H3Event,
  schema: T
): z.infer<T> {
  const query = getQuery(event)
  const result = schema.safeParse(query)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation Error',
      data: {
        error: 'Validation Error',
        details: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    })
  }
  return result.data
}

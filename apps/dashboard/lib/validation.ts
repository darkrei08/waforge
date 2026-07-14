/**
 * Secure Input Validation Library — OWASP A03
 * Uses Zod for schema-first validation on ALL incoming data.
 * Never trust user input — validate server-side always.
 *
 * Adapted for Nuxt 3 / Nitro (H3) — no Next.js dependencies.
 */

import { z } from 'zod'
import { createError, type H3Event, setResponseStatus } from 'h3'

// ── Common validators ─────────────────────────────────────────────────────────

/** Sanitize string: trim, strip HTML tags (anti-XSS) */
const safeString = (maxLen = 255) =>
  z
    .string()
    .trim()
    .max(maxLen, `Max ${maxLen} characters`)
    .transform(s => s.replace(/<[^>]*>/g, ''))  // strip HTML tags (OWASP A03)

/** Phone: only digits, 5–15 chars (E.164 compliant) */
const phoneNumber = z
  .string()
  .trim()
  .transform(s => s.replace(/\D/g, ''))          // digits only
  .refine(s => s.length >= 5 && s.length <= 15, 'Invalid phone number')

/** Phone prefix: +NN format */
const phonePrefix = z
  .string()
  .trim()
  .regex(/^\+\d{1,4}$/, 'Prefix must be +1 to +9999')
  .default('+39')

/** Safe email */
const safeEmail = z.string().trim().email().max(320).toLowerCase().optional()

// ── Contact schemas (OWASP A03 — Input Validation) ───────────────────────────

export const CreateContactSchema = z.object({
  name:    safeString(100),
  prefix:  phonePrefix,
  phone:   phoneNumber,
  email:   safeEmail,
  company: safeString(100).optional(),
  notes:   safeString(500).optional(),
  customFields: z.record(safeString(200)).optional(),
  groupIds: z.array(z.string().min(1)).optional(),
  consentStatus: z.enum(['PENDING', 'GRANTED', 'DENIED']).optional(),
  source: safeString(50).optional(),
  labels: z.array(z.string()).optional(),
  secondaryPhones: z.array(z.string()).optional(),
  pec: z.string().trim().email().max(320).toLowerCase().optional().or(z.literal('')),
  declarantName: safeString(100).optional(),
  declarantPhone: z.string().trim().optional(),
})

export const UpdateContactSchema = CreateContactSchema.partial()

export const BulkImportSchema = z.object({
  csv: z
    .string()
    .max(5_000_000, 'CSV file too large (max 5MB)')  // prevent DoS
    .min(1, 'Empty CSV'),
  groupId: z.string().min(1).optional().or(z.literal('')),
})

// ── Template schemas ──────────────────────────────────────────────────────────

export const CreateTemplateSchema = z.object({
  name:        safeString(100),
  body:        z
    .string()
    .trim()
    .min(1, 'Template body required')
    .max(4096, 'Max 4096 characters')
    // Prevent SSTI (Server-Side Template Injection): only allow {{word}} placeholders
    .refine(
      s => !/\{%|<%|#{|@{/.test(s),
      'Invalid template syntax — use {{variable}} format only'
    ),
  description: safeString(255).optional(),
  mediaUrl:    z.union([z.string().url('Invalid URL'), z.string().startsWith('/'), z.literal('')]).optional().nullable(),
  mediaType:   z.enum(['text', 'image', 'video', 'document', 'audio']).default('text'),
})

export const UpdateTemplateSchema = CreateTemplateSchema.partial()

// ── Campaign schemas ──────────────────────────────────────────────────────────

export const CreateCampaignSchema = z.object({
  name:       safeString(100),
  templateId: z.string().min(1, 'Invalid template ID'),
  contactIds: z.union([
    z.literal('ALL'),
    z.array(z.string().min(1, 'Invalid ID format')).min(1, 'Select at least 1 contact').max(10000),
  ]).default('ALL'),
  delayMin: z.number().int().min(5).max(300).default(15),   // min 5s anti-ban
  delayMax: z.number().int().min(10).max(600).default(45),
  includeGdprDisclaimer: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional().nullable(),
}).refine(d => d.delayMin < d.delayMax, 'delayMin must be less than delayMax')

// ── Pagination schema ─────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(50000).default(50),
  search: z.string().trim().max(100).optional(),
  groupId: z.string().min(1).optional().or(z.literal('')),
})

// ── Bulk delete schema ────────────────────────────────────────────────────────

export const BulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(1000, 'Max 1000 IDs per request'),
})

// ── Settings schema ───────────────────────────────────────────────────────────

export const UpdateSettingsSchema = z.object({
  delayMin:           z.number().int().min(5).max(300).optional(),
  delayMax:           z.number().int().min(10).max(600).optional(),
  maxMessagesPerHour: z.number().int().min(1).max(1000).optional(),
  spintaxEnabled:     z.boolean().optional(),
  whatsappEngine:     z.enum(['wuzapi', 'gowa', 'openwa', 'hybrid']).optional(),
})

// ── Response helpers (H3/Nitro native) ────────────────────────────────────────

export type ApiError = { error: string; details?: unknown; requestId?: string }

/**
 * Throw a validation error as an H3 createError (Nitro-compatible).
 * Use in event handlers: `throw validationError(result.error.issues)`
 */
export function validationError(issues: z.ZodIssue[], statusCode = 422) {
  return createError({
    statusCode,
    statusMessage: 'Validation Error',
    data: {
      error: 'Validation Error',
      details: issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    },
  })
}

/**
 * Parse and validate request body against a Zod schema.
 * Returns typed data or throws H3 error.
 */
export function parseBody<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw validationError(result.error.issues)
  }
  return result.data
}

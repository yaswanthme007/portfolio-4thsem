import { z } from 'zod'

export const INQUIRY_TYPES = [
  'Product build',
  'Portfolio or marketing site',
  'Frontend system',
  'Backend or API work',
  'Technical consulting',
  'Other',
] as const

export const TIMELINE_OPTIONS = [
  'ASAP',
  '2 to 4 weeks',
  '1 to 2 months',
  'Flexible',
] as const

/* ── Schema ── */
export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  company: z.string().trim().optional().transform(value => value || ''),
  inquiryType: z.enum(INQUIRY_TYPES, { message: 'Select an inquiry type' }),
  timeline: z.enum(TIMELINE_OPTIONS, { message: 'Select a timeline' }),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
})
export type ContactData = z.infer<typeof ContactSchema>

export type ActionResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> }

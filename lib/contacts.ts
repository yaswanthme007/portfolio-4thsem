import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import { hasRedisUrl, getRedisClient } from './redis'

export const ContactSubmissionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string(),
  inquiryType: z.string().min(1),
  timeline: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(20),
  createdAt: z.string(),
})

export const ContactInputSchema = ContactSubmissionSchema.omit({
  id: true,
  createdAt: true,
})

export type ContactSubmission = z.infer<typeof ContactSubmissionSchema>
export type ContactInput = z.infer<typeof ContactInputSchema>

const CONTACTS_KEY = 'portfolio:contacts:v1'
const FALLBACK_FILE = path.join(process.cwd(), 'data', 'contacts.json')

export async function saveContactSubmission(submission: ContactSubmission) {
  if (hasRedisUrl()) {
    const client = await getRedisClient()
    if (client) {
      await client.lPush(CONTACTS_KEY, JSON.stringify(submission))
      await client.lTrim(CONTACTS_KEY, 0, 49)
      return submission
    }
  }

  await fs.mkdir(path.dirname(FALLBACK_FILE), { recursive: true })
  let contacts: ContactSubmission[] = []

  try {
    contacts = JSON.parse(await fs.readFile(FALLBACK_FILE, 'utf8')) as ContactSubmission[]
  } catch {
    // first entry
  }

  contacts.unshift(submission)
  await fs.writeFile(FALLBACK_FILE, JSON.stringify(contacts, null, 2), 'utf8')
  return submission
}

export async function getRecentContacts(limit = 10) {
  if (hasRedisUrl()) {
    const client = await getRedisClient()
    if (client) {
      const raw = await client.lRange(CONTACTS_KEY, 0, Math.max(0, limit - 1))
      return raw
        .map(item => {
          try {
            return ContactSubmissionSchema.parse(JSON.parse(item))
          } catch {
            return null
          }
        })
        .filter((item): item is ContactSubmission => Boolean(item))
    }
  }

  try {
    const raw = await fs.readFile(FALLBACK_FILE, 'utf8')
    const parsed = JSON.parse(raw) as ContactSubmission[]
    return parsed.slice(0, limit)
  } catch {
    return []
  }
}

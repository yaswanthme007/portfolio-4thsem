import { z } from 'zod'
import { randomUUID } from 'crypto'
import { hasRedisUrl, getRedisClient } from './redis'
import { HACKATHONS as SEED_HACKATHONS } from '@/data/hackathons'

export const HackathonImageSchema = z.object({
  url: z.string(),
  name: z.string().optional(),
})

export const HackathonSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  index: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  images: z.array(HackathonImageSchema),
  tags: z.array(z.string()),
  year: z.string().min(4),
  liveUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  createdAt: z.string(),
})

export const HackathonInputSchema = HackathonSchema.omit({
  id: true, createdAt: true, index: true,
})

export type HackathonImage = z.infer<typeof HackathonImageSchema>
export type Hackathon = z.infer<typeof HackathonSchema>
export type HackathonInput = z.infer<typeof HackathonInputSchema>

const HACKATHONS_KEY = 'portfolio:hackathons:v1'

function computeIndex(i: number) {
  return String(i + 1).padStart(2, '0')
}

export async function getHackathons(): Promise<Hackathon[]> {
  if (hasRedisUrl()) {
    try {
      const client = await getRedisClient()
      if (client) {
        const raw = await client.get(HACKATHONS_KEY)
        if (raw) {
          try {
            const parsed = z.array(HackathonSchema).safeParse(JSON.parse(raw))
            if (parsed.success) return parsed.data.map((h, i) => ({ ...h, index: computeIndex(i) }))
          } catch {}
        }
        // Seed Redis with static data on first visit
        const seeded = SEED_HACKATHONS.map((h, i) => ({
          ...h,
          createdAt: new Date().toISOString(),
          index: computeIndex(i),
        }))
        await client.set(HACKATHONS_KEY, JSON.stringify(seeded))
        return seeded
      }
    } catch {
      // Fall through to static data if Redis is temporarily unavailable.
    }
  }

  // Fallback: static data
  return SEED_HACKATHONS.map((h, i) => ({
    ...h,
    createdAt: new Date().toISOString(),
    index: computeIndex(i),
  }))
}

export async function createHackathon(input: HackathonInput): Promise<Hackathon> {
  const hackathons = await getHackathons()
  const newHackathon: Hackathon = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    index: computeIndex(hackathons.length),
  }
  const updated = [newHackathon, ...hackathons].map((h, i) => ({ ...h, index: computeIndex(i) }))
  await saveHackathons(updated)
  return newHackathon
}

export async function updateHackathon(id: string, input: Partial<HackathonInput>): Promise<Hackathon | null> {
  const hackathons = await getHackathons()
  const idx = hackathons.findIndex(h => h.id === id)
  if (idx === -1) return null

  const updated = hackathons.map((h, i) =>
    h.id === id ? { ...h, ...input, index: computeIndex(i) } : h
  )
  await saveHackathons(updated)
  return updated[idx]
}

export async function deleteHackathon(id: string): Promise<boolean> {
  const hackathons = await getHackathons()
  const filtered = hackathons.filter(h => h.id !== id).map((h, i) => ({ ...h, index: computeIndex(i) }))
  if (filtered.length === hackathons.length) return false
  await saveHackathons(filtered)
  return true
}

export async function reorderHackathons(orderedIds: string[]): Promise<Hackathon[]> {
  const hackathons = await getHackathons()
  const map = new Map(hackathons.map(h => [h.id, h]))
  const reordered = orderedIds.map(id => map.get(id)).filter(Boolean) as Hackathon[]
  const seen = new Set(orderedIds)
  hackathons.filter(h => !seen.has(h.id)).forEach(h => reordered.push(h))
  const indexed = reordered.map((h, i) => ({ ...h, index: computeIndex(i) }))
  await saveHackathons(indexed)
  return indexed
}

async function saveHackathons(hackathons: Hackathon[]) {
  const client = await getRedisClient()
  if (client) {
    await client.set(HACKATHONS_KEY, JSON.stringify(hackathons))
  }
}

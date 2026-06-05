import { z } from 'zod'
import { randomUUID } from 'crypto'
import { hasRedisUrl, getRedisClient } from './redis'
import { PROJECTS as SEED_PROJECTS } from '@/data/projects'

export const FeatureSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
})

export const ProjectSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  index: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()),
  year: z.string().min(4),
  features: z.array(FeatureSchema),
  liveUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  createdAt: z.string(),
})

export const ProjectInputSchema = ProjectSchema.omit({ id: true, createdAt: true, index: true })

export type AdminProject = z.infer<typeof ProjectSchema>
export type ProjectInput = z.infer<typeof ProjectInputSchema>

const PROJECTS_KEY = 'portfolio:projects:v1'

function computeIndex(i: number) {
  return String(i + 1).padStart(2, '0')
}

export async function getProjects(): Promise<AdminProject[]> {
  if (hasRedisUrl()) {
    try {
      const client = await getRedisClient()
      if (client) {
        const raw = await client.get(PROJECTS_KEY)
        if (raw) {
          try {
            const parsed = z.array(ProjectSchema).safeParse(JSON.parse(raw))
            if (parsed.success) return parsed.data.map((p, i) => ({ ...p, index: computeIndex(i) }))
          } catch {}
        }
        // Seed Redis with static data on first visit
        const seeded = SEED_PROJECTS.map((p, i) => ({
          ...p,
          createdAt: new Date().toISOString(),
          index: computeIndex(i),
        }))
        await client.set(PROJECTS_KEY, JSON.stringify(seeded))
        return seeded
      }
    } catch {
      // Fall through to static data if Redis is temporarily unavailable.
    }
  }

  // Fallback: static data
  return SEED_PROJECTS.map((p, i) => ({
    ...p,
    createdAt: new Date().toISOString(),
    index: computeIndex(i),
  }))
}

export async function getProjectBySlug(slug: string): Promise<AdminProject | null> {
  const projects = await getProjects()
  return projects.find(p => p.slug === slug) ?? null
}

export async function createProject(input: ProjectInput): Promise<AdminProject> {
  const projects = await getProjects()
  const newProject: AdminProject = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    index: computeIndex(projects.length),
  }
  const updated = [newProject, ...projects].map((p, i) => ({ ...p, index: computeIndex(i) }))
  await saveProjects(updated)
  return newProject
}

export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<AdminProject | null> {
  const projects = await getProjects()
  const idx = projects.findIndex(p => p.id === id)
  if (idx === -1) return null

  const updated = projects.map((p, i) =>
    p.id === id ? { ...p, ...input, index: computeIndex(i) } : p
  )
  await saveProjects(updated)
  return updated[idx]
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getProjects()
  const filtered = projects.filter(p => p.id !== id).map((p, i) => ({ ...p, index: computeIndex(i) }))
  if (filtered.length === projects.length) return false
  await saveProjects(filtered)
  return true
}

export async function reorderProjects(orderedIds: string[]): Promise<AdminProject[]> {
  const projects = await getProjects()
  const map = new Map(projects.map(p => [p.id, p]))
  const reordered = orderedIds.map(id => map.get(id)).filter(Boolean) as AdminProject[]
  // Append any not in the ordered list at the end
  const seen = new Set(orderedIds)
  projects.filter(p => !seen.has(p.id)).forEach(p => reordered.push(p))
  const indexed = reordered.map((p, i) => ({ ...p, index: computeIndex(i) }))
  await saveProjects(indexed)
  return indexed
}

async function saveProjects(projects: AdminProject[]) {
  const client = await getRedisClient()
  if (client) {
    await client.set(PROJECTS_KEY, JSON.stringify(projects))
  }
}

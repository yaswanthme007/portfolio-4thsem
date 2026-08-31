# Hackathons Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/hackathons` page presenting each hackathon as a full scroll-through chapter (image gallery + text) with a sticky chapter rail, blur-stagger text reveal, and image parallax — managed via a new Hackathons tab in the existing admin dashboard.

**Architecture:** New Redis-backed content type (`lib/hackathons.ts`) mirroring the existing `lib/projects.ts` CRUD pattern exactly (seed-on-first-read, static fallback when Redis is unconfigured). Admin CRUD routes and dashboard tab copy the existing Projects tab's structure, extended for multi-image upload (base64 data URIs, same technique as certificates). The public page reuses the already-built-but-unused `ChapterRail` component and the existing global scroll-reveal system (`AnimateOnScroll` + `.js-reveal-ready`/`.is-visible` CSS in `globals.css`) — no new JS observer is introduced for the reveal. Parallax is the one genuinely new piece of client JS: a small `scroll`-driven, rAF-throttled component.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod, Redis (`redis` npm package), no additional dependencies.

**Spec:** `docs/superpowers/specs/2026-08-30-hackathons-design.md`

## Global Constraints

- Redis-optional: every read path must fall back to static seed data when `REDIS_URL` is unset or Redis is unreachable — never throw from a read path (matches `lib/projects.ts` / `lib/portfolio.ts`).
- All `/api/admin/hackathons*` routes gated by `isAdminRequest()` — 401 JSON on failure, matching every existing admin route.
- Every mutation (POST/PUT/DELETE/reorder) calls `revalidatePath('/')`, `revalidatePath('/hackathons')`, `revalidatePath('/dashboard-yaswanth')` — this is the exact fix shipped in commit `93873a5` for stale admin content; hackathons must have it from the first commit, not need the bug fixed twice.
- Image uploads: base64 data URI stored directly on the entry, 4MB cap per file (matches `app/api/admin/certificates/route.ts`).
- No automated test framework exists in this repo (`package.json` only defines `typecheck`/`lint`, both running `tsc --noEmit`). Every task's verification step is `npm run typecheck` plus a manual dev-server check — this matches the spec's own Testing section and existing project convention. Do not introduce a test runner as part of this plan.
- CSS must reuse existing design tokens — `var(--fd)` (serif display font), `var(--f)` (sans body font), `var(--fm)` (mono, used for eyebrows/rail labels), `var(--ink-strong)/--ink-soft/--ink-faint`, `var(--accent)/--accent-soft`, `var(--line)/--line-strong`, `var(--r-sm)/--r-lg` radii, and the `cubic-bezier(0.22,1,0.36,1)` easing used everywhere else in `globals.css`. No new color values, no new font.
- Scope decision (deviates slightly from the spec's wording): images within one hackathon entry are **not** drag-reorderable — they render in upload order. Only entries themselves are drag-reorderable (matching the exact pattern already built for Projects). There is no existing precedent in this codebase for nested drag-reorder lists, and no existing content type supports in-place image editing (Certificates only supports add/delete). Reasoning: avoid inventing new, unvalidated interaction complexity for a feature the spec didn't call load-bearing.

---

### Task 1: Data layer — `lib/hackathons.ts` + `data/hackathons.ts`

**Files:**
- Create: `data/hackathons.ts`
- Create: `lib/hackathons.ts`

**Interfaces:**
- Consumes: `hasRedisUrl`, `getRedisClient` from `lib/redis.ts` (existing, unchanged).
- Produces: `HackathonImageSchema`, `HackathonSchema`, `HackathonInputSchema` (Zod), types `HackathonImage`, `Hackathon`, `HackathonInput`, and functions `getHackathons(): Promise<Hackathon[]>`, `createHackathon(input: HackathonInput): Promise<Hackathon>`, `updateHackathon(id: string, input: Partial<HackathonInput>): Promise<Hackathon | null>`, `deleteHackathon(id: string): Promise<boolean>`, `reorderHackathons(orderedIds: string[]): Promise<Hackathon[]>` — all consumed by Task 2 (API routes) and Task 4 (public page). No `getHackathonBySlug` — unlike Projects, this design has no per-entry detail route (everything renders on the one scrolling `/hackathons` page), so a by-slug lookup would be dead code.

- [ ] **Step 1: Create the static seed file**

`data/hackathons.ts`:

```ts
export interface HackathonImage {
  url: string
  name?: string
}

export interface Hackathon {
  id: string
  slug: string
  index: string
  title: string
  description: string
  images: HackathonImage[]
  tags: string[]
  year: string
  liveUrl?: string
  repoUrl?: string
}

export const HACKATHONS: Hackathon[] = []
```

- [ ] **Step 2: Create the data-access module**

`lib/hackathons.ts`:

```ts
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
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors referencing `lib/hackathons.ts` or `data/hackathons.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/hackathons.ts data/hackathons.ts
git commit -m "feat: add hackathons data layer (Redis-backed, static fallback)"
```

---

### Task 2: Admin API routes

**Files:**
- Create: `app/api/admin/hackathons/route.ts`
- Create: `app/api/admin/hackathons/reorder/route.ts`

**Interfaces:**
- Consumes: `isAdminRequest` (`lib/admin-auth.ts`), `getHackathons`, `createHackathon`, `updateHackathon`, `deleteHackathon`, `reorderHackathons`, `HackathonInputSchema`, `HackathonImage` (all from Task 1's `lib/hackathons.ts`).
- Produces: `GET/POST/PUT/DELETE /api/admin/hackathons`, `POST /api/admin/hackathons/reorder` — consumed by Task 3 (admin dashboard UI).

- [ ] **Step 1: Create the CRUD route**

`app/api/admin/hackathons/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminRequest } from '@/lib/admin-auth'
import {
  getHackathons,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  HackathonInputSchema,
  type HackathonImage,
} from '@/lib/hackathons'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

async function encodeImages(formData: FormData): Promise<{ images: HackathonImage[]; error?: string }> {
  const files = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)
  const images: HackathonImage[] = []
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { images: [], error: `"${file.name}" is too large (max 4MB per image)` }
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    images.push({ url: `data:${file.type};base64,${buffer.toString('base64')}`, name: file.name })
  }
  return { images }
}

function slugify(title: string) {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const hackathons = await getHackathons()
  return NextResponse.json({ hackathons })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const { images, error: imageError } = await encodeImages(formData)
  if (imageError) return NextResponse.json({ error: imageError }, { status: 400 })

  const title = String(formData.get('title') ?? '').trim()
  const body = {
    title,
    slug: String(formData.get('slug') ?? '').trim() || slugify(title),
    description: String(formData.get('description') ?? '').trim(),
    year: String(formData.get('year') ?? '').trim(),
    tags: String(formData.get('tags') ?? '').split(',').map(t => t.trim()).filter(Boolean),
    repoUrl: String(formData.get('repoUrl') ?? '').trim() || undefined,
    liveUrl: String(formData.get('liveUrl') ?? '').trim() || undefined,
    images,
  }

  const parsed = HackathonInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const hackathon = await createHackathon(parsed.data)

  revalidatePath('/')
  revalidatePath('/hackathons')
  revalidatePath('/dashboard-yaswanth')

  return NextResponse.json({ ok: true, hackathon })
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const formData = await request.formData()
  const { images: newImages, error: imageError } = await encodeImages(formData)
  if (imageError) return NextResponse.json({ error: imageError }, { status: 400 })

  const existingImagesRaw = formData.get('existingImages')
  let images: HackathonImage[] | undefined
  if (typeof existingImagesRaw === 'string') {
    try {
      images = [...(JSON.parse(existingImagesRaw) as HackathonImage[]), ...newImages]
    } catch {
      return NextResponse.json({ error: 'Invalid existingImages payload' }, { status: 400 })
    }
  }

  const patch: Record<string, unknown> = {}
  for (const key of ['title', 'slug', 'description', 'year', 'repoUrl', 'liveUrl'] as const) {
    const value = formData.get(key)
    if (typeof value === 'string' && value.trim()) patch[key] = value.trim()
  }
  const tagsRaw = formData.get('tags')
  if (typeof tagsRaw === 'string') {
    patch.tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
  }
  if (images) patch.images = images

  const parsed = HackathonInputSchema.partial().safeParse(patch)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const hackathon = await updateHackathon(id, parsed.data)
  if (!hackathon) return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 })

  revalidatePath('/')
  revalidatePath('/hackathons')
  revalidatePath('/dashboard-yaswanth')

  return NextResponse.json({ ok: true, hackathon })
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const ok = await deleteHackathon(id)
  if (!ok) return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 })

  revalidatePath('/')
  revalidatePath('/hackathons')
  revalidatePath('/dashboard-yaswanth')

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create the reorder route**

`app/api/admin/hackathons/reorder/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminRequest } from '@/lib/admin-auth'
import { reorderHackathons } from '@/lib/hackathons'

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const ids: string[] = body?.ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }

  const hackathons = await reorderHackathons(ids)

  revalidatePath('/')
  revalidatePath('/hackathons')

  return NextResponse.json({ ok: true, hackathons })
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, then in another terminal (replace `<cookie>` with the value of the `yaswanth_admin_session` cookie after logging into `/dashboard-yaswanth/login` in a browser):

```bash
curl -s http://localhost:3000/api/admin/hackathons -H "Cookie: yaswanth_admin_session=<cookie>"
```

Expected: `{"hackathons":[]}` (empty, since the seed is empty). A request without the cookie must return `{"error":"Unauthorized"}` with a 401.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/hackathons/route.ts app/api/admin/hackathons/reorder/route.ts
git commit -m "feat: add admin CRUD routes for hackathons"
```

---

### Task 3: Admin dashboard UI — Hackathons tab

**Files:**
- Modify: `app/dashboard-yaswanth/page.tsx` (fetch hackathons, pass as prop)
- Modify: `components/AdminDashboard.tsx` (new tab, state, handlers, JSX)

**Interfaces:**
- Consumes: `getHackathons` (`lib/hackathons.ts`), `Hackathon`/`HackathonImage` types (`lib/hackathons.ts`), the four admin API endpoints from Task 2.
- Produces: `AdminDashboardProps.initialHackathons: Hackathon[]` — an addition to the existing prop shape, required at every call site (there is only one: `app/dashboard-yaswanth/page.tsx`).

- [ ] **Step 1: Wire the data fetch**

In `app/dashboard-yaswanth/page.tsx`, replace the full file with:

```tsx
import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/AdminDashboard'
import { getPortfolioData } from '@/lib/portfolio'
import { getProjects } from '@/lib/projects'
import { getHackathons } from '@/lib/hackathons'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Yaswanth',
  description: 'Portfolio admin console for profile, resume, certificates, projects, hackathons and management.',
}

export default async function AdminPage() {
  const [content, projects, hackathons] = await Promise.all([
    getPortfolioData(),
    getProjects(),
    getHackathons(),
  ])

  return (
    <section className="page admin-page">
      <AdminDashboard initialContent={content} initialProjects={projects} initialHackathons={hackathons} />
    </section>
  )
}
```

- [ ] **Step 2: Extend the props type and imports**

In `components/AdminDashboard.tsx`, change:

```ts
import type { Certificate, PortfolioData, ProfileUpdateInput, ResumeAsset, ExperienceItem, EducationItem } from '@/lib/portfolio'
import type { AdminProject } from '@/lib/projects'
import type { GitHubRepo } from '@/app/api/admin/github-repos/route'

type AdminDashboardProps = {
  initialContent: PortfolioData
  initialProjects: AdminProject[]
}

type TabKey = 'overview' | 'projects' | 'profile' | 'resume' | 'certificates' | 'timeline'
```

to:

```ts
import type { Certificate, PortfolioData, ProfileUpdateInput, ResumeAsset, ExperienceItem, EducationItem } from '@/lib/portfolio'
import type { AdminProject } from '@/lib/projects'
import type { Hackathon, HackathonImage } from '@/lib/hackathons'
import type { GitHubRepo } from '@/app/api/admin/github-repos/route'

type AdminDashboardProps = {
  initialContent: PortfolioData
  initialProjects: AdminProject[]
  initialHackathons: Hackathon[]
}

type TabKey = 'overview' | 'projects' | 'hackathons' | 'profile' | 'resume' | 'certificates' | 'timeline'
```

- [ ] **Step 3: Update the component signature and add state**

Change:

```ts
export function AdminDashboard({ initialContent, initialProjects }: AdminDashboardProps) {
```

to:

```ts
export function AdminDashboard({ initialContent, initialProjects, initialHackathons }: AdminDashboardProps) {
```

Immediately after the existing `dragIndex`/`dragOverIndex` state declarations (`const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)`), add:

```ts
  // Hackathons state
  const [hackathons, setHackathons] = useState<Hackathon[]>(initialHackathons)
  const [hackathonStatus, setHackathonStatus] = useState<{ msg: string; error?: boolean } | null>(null)
  const [editingHackathon, setEditingHackathon] = useState<Hackathon | null>(null)
  const [hackathonForm, setHackathonForm] = useState({
    title: '', slug: '', description: '', year: String(new Date().getFullYear()),
    tags: '', repoUrl: '', liveUrl: '',
  })
  const [hackathonImages, setHackathonImages] = useState<HackathonImage[]>([])
  const hackathonFormRef = useRef<HTMLFormElement>(null)
  const [hackathonDragIndex, setHackathonDragIndex] = useState<number | null>(null)
  const [hackathonDragOverIndex, setHackathonDragOverIndex] = useState<number | null>(null)
```

- [ ] **Step 4: Add the handlers**

Immediately after the existing `/* ── Drag-and-drop reorder ── */` block's `handleDrop` function (right before `/* ── GitHub import ── */`), add:

```ts
  /* ── Hackathons ── */
  function startEditHackathon(h: Hackathon) {
    setEditingHackathon(h)
    setHackathonForm({
      title: h.title, slug: h.slug, description: h.description, year: h.year,
      tags: h.tags.join(', '), repoUrl: h.repoUrl ?? '', liveUrl: h.liveUrl ?? '',
    })
    setHackathonImages(h.images)
  }

  function clearHackathonForm() {
    setEditingHackathon(null)
    setHackathonForm({
      title: '', slug: '', description: '', year: String(new Date().getFullYear()),
      tags: '', repoUrl: '', liveUrl: '',
    })
    setHackathonImages([])
    hackathonFormRef.current?.reset()
  }

  function removeHackathonImage(idx: number) {
    setHackathonImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleHackathonDrop(toIndex: number) {
    if (hackathonDragIndex === null || hackathonDragIndex === toIndex) {
      setHackathonDragIndex(null); setHackathonDragOverIndex(null); return
    }
    const reordered = [...hackathons]
    const [moved] = reordered.splice(hackathonDragIndex, 1)
    reordered.splice(toIndex, 0, moved)
    setHackathons(reordered)
    setHackathonDragIndex(null); setHackathonDragOverIndex(null)
    const ids = reordered.map(h => h.id)
    await fetch('/api/admin/hackathons/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
  }

  async function saveHackathon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHackathonStatus({ msg: editingHackathon ? 'Updating hackathon…' : 'Creating hackathon…' })
    const body = new FormData(event.currentTarget)
    if (editingHackathon) {
      body.append('existingImages', JSON.stringify(hackathonImages))
    }
    const url = editingHackathon
      ? `/api/admin/hackathons?id=${encodeURIComponent(editingHackathon.id)}`
      : '/api/admin/hackathons'
    const response = await fetch(url, { method: editingHackathon ? 'PUT' : 'POST', body })
    let data: any
    try { data = await response.json() } catch { data = { error: 'Invalid response' } }
    if (!response.ok) {
      setHackathonStatus({ msg: data?.error || (response.status === 413 ? 'Images too large.' : 'Unable to save hackathon.'), error: true })
      return
    }
    if (editingHackathon) {
      setHackathons(prev => prev.map(h => h.id === editingHackathon.id ? data.hackathon : h))
      setHackathonStatus({ msg: 'Hackathon updated' })
    } else {
      setHackathons(prev => [data.hackathon, ...prev])
      setHackathonStatus({ msg: 'Hackathon created' })
    }
    clearHackathonForm()
  }

  async function deleteHackathonById(id: string) {
    setHackathonStatus({ msg: 'Deleting…' })
    const response = await fetch(`/api/admin/hackathons?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    let data: any
    try { data = await response.json() } catch { data = { error: 'Invalid response' } }
    if (!response.ok) { setHackathonStatus({ msg: data?.error || 'Unable to delete.', error: true }); return }
    setHackathons(prev => prev.filter(h => h.id !== id))
    setHackathonStatus({ msg: 'Hackathon deleted' })
  }
```

- [ ] **Step 5: Register the tab**

Change:

```ts
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview',     label: 'Overview' },
    { key: 'projects',     label: 'Projects',     count: projects.length },
    { key: 'profile',      label: 'Profile' },
    { key: 'resume',       label: 'Resume' },
    { key: 'certificates', label: 'Certificates', count: certificates.length },
    { key: 'timeline',     label: 'Timeline',     count: experience.length + education.length },
  ]
```

to:

```ts
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview',     label: 'Overview' },
    { key: 'projects',     label: 'Projects',     count: projects.length },
    { key: 'hackathons',   label: 'Hackathons',   count: hackathons.length },
    { key: 'profile',      label: 'Profile' },
    { key: 'resume',       label: 'Resume' },
    { key: 'certificates', label: 'Certificates', count: certificates.length },
    { key: 'timeline',     label: 'Timeline',     count: experience.length + education.length },
  ]
```

- [ ] **Step 6: Add the tab panel JSX**

Immediately after the closing `)}` of the `{/* ── PROJECTS ── */}` block (right before `{/* ── PROFILE ── */}`), add:

```tsx
      {/* ── HACKATHONS ── */}
      {tab === 'hackathons' && (
        <LiquidGlass className="admin-card" interactive>
          <div className="card-topline">
            <div>
              <p className="sec-label">Hackathons</p>
              <h2 className="admin-card-title">{editingHackathon ? `Editing: ${editingHackathon.title}` : 'Add a hackathon'}</h2>
            </div>
            <span className="admin-card-badge">{hackathons.length} live</span>
          </div>

          <form ref={hackathonFormRef} className="admin-form" onSubmit={saveHackathon}>
            <div className="form-grid">
              <label className="field-label">Title
                <input className="field-input" name="title" required value={hackathonForm.title}
                  onChange={e => setHackathonForm(p => ({ ...p, title: e.target.value }))} />
              </label>
              <label className="field-label">Slug (auto-generated)
                <input className="field-input" name="slug" placeholder="my-hackathon" value={hackathonForm.slug}
                  onChange={e => setHackathonForm(p => ({ ...p, slug: e.target.value }))} />
              </label>
              <label className="field-label">Year
                <input className="field-input" name="year" required value={hackathonForm.year}
                  onChange={e => setHackathonForm(p => ({ ...p, year: e.target.value }))} />
              </label>
              <label className="field-label">Tags (comma separated)
                <input className="field-input" name="tags" placeholder="AI, Hackathon, 24hr" value={hackathonForm.tags}
                  onChange={e => setHackathonForm(p => ({ ...p, tags: e.target.value }))} />
              </label>
              <label className="field-label">GitHub URL
                <input className="field-input" name="repoUrl" type="url" value={hackathonForm.repoUrl}
                  onChange={e => setHackathonForm(p => ({ ...p, repoUrl: e.target.value }))} />
              </label>
              <label className="field-label">Live URL
                <input className="field-input" name="liveUrl" type="url" value={hackathonForm.liveUrl}
                  onChange={e => setHackathonForm(p => ({ ...p, liveUrl: e.target.value }))} />
              </label>
            </div>
            <label className="field-label">Description
              <textarea required className="field-input field-textarea" name="description" value={hackathonForm.description}
                onChange={e => setHackathonForm(p => ({ ...p, description: e.target.value }))} />
            </label>

            {hackathonImages.length > 0 && (
              <div className="hackathon-image-preview-row">
                {hackathonImages.map((img, i) => (
                  <div key={img.url + i} className="hackathon-image-preview">
                    <img src={img.url} alt={img.name ?? ''} />
                    <button type="button" className="hackathon-image-remove" onClick={() => removeHackathonImage(i)} aria-label="Remove image">×</button>
                  </div>
                ))}
              </div>
            )}

            <label className="field-label">
              {editingHackathon ? 'Add more images' : 'Images'}
              <input className="field-input" name="images" type="file" accept="image/*" multiple />
            </label>

            {hackathonStatus && (
              <p className={`admin-status${hackathonStatus.error ? ' admin-status--error' : ''}`}>{hackathonStatus.msg}</p>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn-submit" style={{ flex: 1 }}>
                {editingHackathon ? 'Update Hackathon' : 'Create Hackathon'}
              </button>
              {editingHackathon && (
                <button type="button" className="btn-ghost" style={{ minWidth: 110 }} onClick={clearHackathonForm}>Cancel</button>
              )}
            </div>
          </form>

          <p className="admin-empty" style={{ fontSize: 11, padding: '6px 0 0', color: 'var(--ink-faint)' }}>
            Drag ⠿ to reorder — order controls the scroll sequence on the public page.
          </p>
          <div className="admin-list">
            {hackathons.length === 0 && <p className="admin-empty">No hackathons yet.</p>}
            {hackathons.map((h, i) => (
              <article
                key={h.id}
                className={`admin-list-item admin-drag-item${hackathonDragOverIndex === i ? ' admin-drag-over' : ''}`}
                draggable
                onDragStart={() => setHackathonDragIndex(i)}
                onDragOver={e => { e.preventDefault(); setHackathonDragOverIndex(i) }}
                onDragLeave={() => setHackathonDragOverIndex(null)}
                onDrop={() => handleHackathonDrop(i)}
                onDragEnd={() => { setHackathonDragIndex(null); setHackathonDragOverIndex(null) }}
              >
                <span className="admin-drag-handle" aria-hidden="true">⠿</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span className="admin-preview-label">{h.index} · {h.year} · {h.images.length} image{h.images.length === 1 ? '' : 's'}</span>
                  <h3>{h.title}</h3>
                  <p>{h.description.slice(0, 110)}{h.description.length > 110 ? '…' : ''}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {h.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
                  </div>
                </div>
                <div className="admin-row-actions">
                  <button type="button" className="admin-btn-sm" onClick={() => startEditHackathon(h)}>Edit</button>
                  <button type="button" className="admin-btn-sm admin-btn-sm--danger" onClick={() => deleteHackathonById(h.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </LiquidGlass>
      )}
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Manual verification**

Run `npm run dev`, log into `/dashboard-yaswanth/login`, open the dashboard, click the new "Hackathons" tab. Create a hackathon with 2 images, confirm it appears in the list immediately with a working Edit (loads back into the form with existing thumbnails) and Delete. Confirm drag-reordering two entries persists after a page refresh. Note: thumbnails and layout will look unstyled/plain until Task 6 (CSS) — that's expected at this point.

- [ ] **Step 9: Commit**

```bash
git add app/dashboard-yaswanth/page.tsx components/AdminDashboard.tsx
git commit -m "feat: add Hackathons tab to admin dashboard"
```

---

### Task 4: Public `/hackathons` page + parallax component

**Files:**
- Create: `app/hackathons/page.tsx`
- Create: `components/HackathonParallax.tsx`

**Interfaces:**
- Consumes: `getHackathons` (`lib/hackathons.ts`), `ChapterRail` (`components/ChapterRail.tsx`, existing/unmodified — takes `chapters: { id: string; num: string; label: string }[]`).
- Produces: the `/hackathons` route. `HackathonParallax` is a self-contained client component with no props and no exports consumed elsewhere.

- [ ] **Step 1: Create the parallax component**

`components/HackathonParallax.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

/**
 * HackathonParallax — drifts each .hackathon-image slower than scroll by
 * writing a --parallax-y CSS var consumed in globals.css. rAF-throttled,
 * transform-only (no layout thrash), same passive-listener lifecycle
 * shape as ChapterRail's IntersectionObserver.
 */
export function HackathonParallax() {
  useEffect(() => {
    const images = Array.from(document.querySelectorAll<HTMLElement>('.hackathon-image'))
    if (images.length === 0) return

    let ticking = false

    function update() {
      const viewportCenter = window.innerHeight / 2
      images.forEach(img => {
        const rect = img.getBoundingClientRect()
        const imageCenter = rect.top + rect.height / 2
        const offset = viewportCenter - imageCenter
        img.style.setProperty('--parallax-y', `${offset * 0.15}px`)
      })
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
```

- [ ] **Step 2: Create the public page**

`app/hackathons/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { getHackathons } from '@/lib/hackathons'
import { ChapterRail } from '@/components/ChapterRail'
import { HackathonParallax } from '@/components/HackathonParallax'

export const metadata: Metadata = {
  title: 'Hackathons — Yaswanth',
  description: 'A scroll through the hackathons Yaswanth K B has shipped in.',
}

export default async function HackathonsPage() {
  const hackathons = await getHackathons()

  return (
    <section className="page hackathons-page">
      <header className="hackathons-hero">
        <h1 className="hackathons-hero-title">
          Hackathons <em>&amp; sprints</em>
        </h1>
        <p className="hackathons-hero-lede">
          Scroll through what got built under a countdown clock — the idea,
          the build, and what shipped by the deadline.
        </p>
      </header>

      {hackathons.length > 0 && (
        <ChapterRail
          chapters={hackathons.map(h => ({ id: h.slug, num: h.index, label: h.title }))}
        />
      )}

      <div className="hackathon-chapters">
        {hackathons.length === 0 && (
          <p className="admin-empty">No hackathons posted yet — check back soon.</p>
        )}
        {hackathons.map(h => (
          <section key={h.id} id={h.slug} className="hackathon-chapter home-section">
            <div className="hackathon-gallery">
              {h.images.map((img, i) => (
                <img
                  key={img.url + i}
                  src={img.url}
                  alt={img.name ?? h.title}
                  className="hackathon-image"
                />
              ))}
            </div>
            <div className="hackathon-copy">
              <p className="hackathon-eyebrow">{h.year} · №&nbsp;{h.index}</p>
              <h2 className="hackathon-title">{h.title}</h2>
              <p className="hackathon-desc">{h.description}</p>
              <div className="hackathon-tags">
                {h.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
              </div>
              {(h.repoUrl || h.liveUrl) && (
                <div className="hackathon-links">
                  {h.repoUrl && (
                    <a href={h.repoUrl} target="_blank" rel="noreferrer" className="project-link">
                      GitHub →
                    </a>
                  )}
                  {h.liveUrl && (
                    <a href={h.liveUrl} target="_blank" rel="noreferrer" className="project-link">
                      Live →
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <HackathonParallax />
    </section>
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors. `typedRoutes: true` in `next.config.ts` means `/hackathons` becomes a valid `Route` only after this file exists and `next typegen` runs (part of the typecheck script) — if Task 5's `Link href="/hackathons"` was written before this step, it would fail typecheck; the task order here avoids that.

- [ ] **Step 4: Manual verification**

Run `npm run dev`, visit `http://localhost:3000/hackathons` directly. With zero hackathons created yet, expect the empty-state message and no chapter rail (guarded by `hackathons.length > 0`). After creating hackathons via the admin dashboard (Task 3), refresh and confirm each one renders as a section with its images and text (unstyled until Task 6).

- [ ] **Step 5: Commit**

```bash
git add app/hackathons/page.tsx components/HackathonParallax.tsx
git commit -m "feat: add public /hackathons scroll-through page"
```

---

### Task 5: Navigation links

**Files:**
- Modify: `components/Nav.tsx`
- Modify: `app/layout.tsx` (footer nav)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed elsewhere — purely a UI addition.

- [ ] **Step 1: Add the primary nav link**

In `components/Nav.tsx`, change:

```ts
const LINKS: { href: Route; label: string }[] = [
  { href: '/',         label: 'Home' },
  { href: '/work',     label: 'Work' },
  { href: '/about',    label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/contact',  label: 'Contact' },
]
```

to:

```ts
const LINKS: { href: Route; label: string }[] = [
  { href: '/',           label: 'Home' },
  { href: '/work',       label: 'Work' },
  { href: '/hackathons', label: 'Hackathons' },
  { href: '/about',      label: 'About' },
  { href: '/services',   label: 'Services' },
  { href: '/contact',    label: 'Contact' },
]
```

- [ ] **Step 2: Add the footer link**

In `app/layout.tsx`, change:

```tsx
              <nav className="footer-nav" aria-label="Footer">
                <a href="/work"     className="footer-link">Work</a>
                <a href="/about"    className="footer-link">About</a>
                <a href="/services" className="footer-link">Services</a>
                <a href="/contact"  className="footer-link">Contact</a>
              </nav>
```

to:

```tsx
              <nav className="footer-nav" aria-label="Footer">
                <a href="/work"       className="footer-link">Work</a>
                <a href="/hackathons" className="footer-link">Hackathons</a>
                <a href="/about"      className="footer-link">About</a>
                <a href="/services"   className="footer-link">Services</a>
                <a href="/contact"    className="footer-link">Contact</a>
              </nav>
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors (the `/hackathons` route already exists from Task 4, so `typedRoutes` accepts it in `Nav.tsx`'s `LINKS` array).

- [ ] **Step 4: Manual verification**

Run `npm run dev`, confirm "Hackathons" appears in the top nav and the footer on every page, and that it highlights active (`nav-link--active`) when on `/hackathons`.

- [ ] **Step 5: Commit**

```bash
git add components/Nav.tsx app/layout.tsx
git commit -m "feat: add Hackathons link to nav and footer"
```

---

### Task 6: CSS — layout, blur-stagger reveal, parallax, admin thumbnails

**Files:**
- Modify: `app/globals.css` (append new rules at end of file; no existing rules are removed)

**Interfaces:**
- Consumes: existing tokens (`--fd`, `--f`, `--fm`, `--ink-strong`, `--ink-soft`, `--ink-faint`, `--accent`, `--accent-soft`, `--line`, `--line-strong`, `--r-sm`, `--r-lg`) and the existing `.js-reveal-ready`/`.is-visible` class-toggle mechanism from `AnimateOnScroll` (unmodified).
- Produces: `.hackathons-page`, `.hackathons-hero`, `.hackathons-hero-title`, `.hackathons-hero-lede`, `.hackathon-chapters`, `.hackathon-chapter`, `.hackathon-gallery`, `.hackathon-image`, `.hackathon-copy`, `.hackathon-eyebrow`, `.hackathon-title`, `.hackathon-desc`, `.hackathon-tags`, `.hackathon-links`, `.hackathon-image-preview-row`, `.hackathon-image-preview`, `.hackathon-image-remove` — all consumed by Task 3's and Task 4's JSX (already written, using these exact class names).

- [ ] **Step 1: Append the page + chapter + reveal + parallax CSS**

Add to the end of `app/globals.css`:

```css
/* ════════════════════════════════════════════════════════════════
   HACKATHONS PAGE — scroll-through chapters
   ════════════════════════════════════════════════════════════════ */
.hackathons-page {
  padding: 116px 48px 80px;
}
.hackathons-hero {
  max-width: 760px;
  margin: 0 0 44px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line-strong);
  animation: rise 0.9s ease both;
}
.hackathons-hero-title {
  font-family: var(--fd);
  font-weight: 400;
  font-size: clamp(40px, 5.6vw, 72px);
  line-height: 1.04;
  letter-spacing: -0.022em;
  color: var(--ink-strong);
}
.hackathons-hero-title em {
  font-style: normal;
  color: var(--accent);
  font-weight: 400;
}
.hackathons-hero-lede {
  font-family: var(--fd);
  font-size: clamp(17px, 1.5vw, 20px);
  line-height: 1.6;
  color: var(--ink-soft);
  margin-top: 16px;
  max-width: 560px;
}

.hackathon-chapters {
  display: flex;
  flex-direction: column;
}
.hackathon-chapter {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 56px;
  align-items: center;
  min-height: 72vh;
  padding: 64px 0;
  border-bottom: 1px solid var(--line);
}
.hackathon-chapter:last-child { border-bottom: none; }

.hackathon-gallery {
  display: grid;
  gap: 14px;
}
.hackathon-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--r-lg);
  border: 1px solid var(--line);
  transform: translateY(var(--parallax-y, 0px));
  will-change: transform;
}

.hackathon-eyebrow {
  font-family: var(--fm);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent-soft);
  margin-bottom: 14px;
}
.hackathon-title {
  font-family: var(--fd);
  font-weight: 400;
  font-size: clamp(30px, 3.4vw, 44px);
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: var(--ink-strong);
  margin-bottom: 16px;
}
.hackathon-desc {
  font-family: var(--fd);
  font-size: clamp(16px, 1.3vw, 18px);
  line-height: 1.6;
  color: var(--ink-soft);
  margin-bottom: 20px;
}
.hackathon-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.hackathon-links {
  display: flex;
  gap: 18px;
}

/* Per-chapter reveal: children blur-stagger in individually instead of
   the whole section fading as one block. Neutralizes the generic
   .home-section reveal for .hackathon-chapter (it would otherwise also
   fade/blur the section wrapper itself, double-applying the effect),
   then drives opacity/transform/blur per child off the same .is-visible
   class the existing IntersectionObserver already toggles. */
.js-reveal-ready .hackathon-chapter:not(.is-visible) {
  opacity: 1 !important;
  transform: none !important;
  filter: none !important;
}
.hackathon-chapter .hackathon-gallery,
.hackathon-chapter .hackathon-eyebrow,
.hackathon-chapter .hackathon-title,
.hackathon-chapter .hackathon-desc,
.hackathon-chapter .hackathon-tags,
.hackathon-chapter .hackathon-links {
  opacity: 0;
  transform: translateY(20px);
  filter: blur(6px);
  transition: opacity 0.6s ease,
              transform 0.6s cubic-bezier(0.22,1,0.36,1),
              filter 0.5s ease;
}
.hackathon-chapter.is-visible .hackathon-gallery { opacity: 1; transform: none; filter: blur(0); transition-delay: 0s; }
.hackathon-chapter.is-visible .hackathon-eyebrow { opacity: 1; transform: none; filter: blur(0); transition-delay: 0.09s; }
.hackathon-chapter.is-visible .hackathon-title   { opacity: 1; transform: none; filter: blur(0); transition-delay: 0.18s; }
.hackathon-chapter.is-visible .hackathon-desc    { opacity: 1; transform: none; filter: blur(0); transition-delay: 0.27s; }
.hackathon-chapter.is-visible .hackathon-tags    { opacity: 1; transform: none; filter: blur(0); transition-delay: 0.36s; }
.hackathon-chapter.is-visible .hackathon-links   { opacity: 1; transform: none; filter: blur(0); transition-delay: 0.42s; }

@media (max-width: 860px) {
  .hackathon-chapter {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 48px 0;
    gap: 28px;
  }
}
@media (max-width: 440px) {
  .hackathons-page       { padding: 92px 16px 56px; }
  .hackathons-hero-title { font-size: clamp(26px, 9vw, 34px); }
}

/* ── Admin: hackathon image thumbnails ── */
.hackathon-image-preview-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 4px 0 6px;
}
.hackathon-image-preview {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: var(--r-sm);
  overflow: hidden;
  border: 1px solid var(--line);
}
.hackathon-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.hackathon-image-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors (CSS is not type-checked, but this confirms the preceding tasks' TSX still compiles once wired against real class names).

- [ ] **Step 3: Manual verification**

Run `npm run dev`:
1. Visit `/hackathons` with at least 2 hackathon entries (create via `/dashboard-yaswanth` if needed) and at least 2 images on one entry. Confirm: two-column layout (gallery left, copy right) on desktop, stacking on narrow viewports (≤860px).
2. Scroll slowly — confirm each chapter's image, eyebrow, title, description, and tags blur-in with a visible stagger (image first, tags last) as the chapter enters the viewport, and that this matches the feel of the existing homepage section reveal (same blur/ease character, not visually distinct).
3. Confirm images drift (parallax) as you scroll past — slower than the page scroll, both directions.
4. Confirm the chapter rail appears fixed on the right edge on desktop, its active dot tracks which chapter is in view, and clicking a rail item smooth-scrolls to that chapter.
5. Resize below 860px and below 440px — confirm no horizontal overflow and the rail disappears (existing `@media (max-width: ...) { .chapter-rail { display: none; } }` rule already handles this).
6. Open `/dashboard-yaswanth` → Hackathons tab — confirm image thumbnails render as a tidy 72×72 row with working × remove buttons.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: hackathons page layout, blur-stagger reveal, and parallax"
```

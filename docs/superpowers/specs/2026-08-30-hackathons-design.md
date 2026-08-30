# Hackathons Section — Design Spec

Date: 2026-08-30

## Overview

Add a new "Hackathons" content type to the portfolio: a dedicated
`/hackathons` page presenting each hackathon as a full scroll-through
"chapter" — title, description, tags, and an image gallery — with a
sticky side rail for navigation and a scroll-driven reveal animation
(text blur-stagger + image parallax) matching the site's existing
glass/motion vibe. Content is managed through the existing admin
dashboard, following the same Redis-backed CRUD pattern already used
for Projects and Certificates.

## Goals

- New `/hackathons` route, linked from `Nav`.
- Admin can create/edit/delete/reorder hackathon entries, each with
  multiple images, from `/dashboard-yaswanth`.
- Scroll-through reading experience: sticky chapter rail (reused
  `ChapterRail` component) + per-chapter reveal animation (blur-in
  staggered text, parallax image drift).
- Persists via Redis when configured; falls back to static seed data
  otherwise (matches every other content type in this app).

## Non-goals

- No image hosting/CDN integration — images stored as base64 data URIs
  in Redis, same as certificates (4MB/file cap).
- No linking hackathon entries to existing `Project` records (decided:
  hackathons are standalone entries, not references to `data/projects.ts`).
- No public submission/voting/comments — content is admin-authored only.

## Data model

New file `lib/hackathons.ts`, mirroring `lib/projects.ts` structure:

```ts
export const HackathonImageSchema = z.object({
  url: z.string(),       // data: URI
  name: z.string().optional(),
})

export const HackathonSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  index: z.string(),           // computed "01", "02", ... like AdminProject
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

export type Hackathon = z.infer<typeof HackathonSchema>
export type HackathonInput = z.infer<typeof HackathonInputSchema>
```

Redis key: `portfolio:hackathons:v1`. Same functions as `lib/projects.ts`:
`getHackathons`, `getHackathonBySlug`, `createHackathon`,
`updateHackathon`, `deleteHackathon`, `reorderHackathons`,
`saveHackathons` (private). Seeds from `data/hackathons.ts` on first
Redis read, same as projects seed from `data/projects.ts`. Falls back
to the static seed array directly when Redis is unavailable
(`hasRedisUrl()` false or connect fails) — identical fallback shape to
`getProjects()`.

New file `data/hackathons.ts` — static seed array, same role as
`data/projects.ts`. Can start with 1–2 real entries or empty array;
user supplies real content via admin UI after ship.

## API routes

New `app/api/admin/hackathons/route.ts` — GET/POST/PUT/DELETE, copied
wiring from `app/api/admin/projects/route.ts`:
- All methods gated by `isAdminRequest()` (401 if not admin).
- POST accepts `multipart/form-data` (title, description, tags,
  year, liveUrl, repoUrl, plus one or more `images` files) — same
  base64-encode-on-upload approach as
  `app/api/admin/certificates/route.ts`, 4MB per-file cap enforced
  per image.
- PUT/DELETE take `id` (JSON body / query param, matching the
  projects route's existing convention).
- Every mutation calls `revalidatePath('/')`, `revalidatePath('/hackathons')`,
  `revalidatePath('/dashboard-yaswanth')` — this is the exact fix
  applied in commit `93873a5` for projects; hackathons must ship with
  it from day one, not need the same bug fixed twice.

New `app/api/admin/hackathons/reorder/route.ts` — POST, copied from
`app/api/admin/projects/reorder/route.ts` (ordered id list →
`reorderHackathons`).

No public API route needed — the `/hackathons` page reads directly via
`lib/hackathons.ts` as a server component (same as `/work` reads
`lib/projects.ts`).

## Admin UI

`components/AdminDashboard.tsx` gains a "Hackathons" tab alongside the
existing Projects/Certificates/Experience tabs:
- Form fields: title, description, tags (comma or chip input, matching
  existing tag input pattern), year, liveUrl, repoUrl, and a
  multi-image picker (drag-drop reorder for images within one entry,
  reusing the drag-drop mechanics already built for project reordering
  per commit `6e117b8`).
- List view with drag-drop reorder across hackathon entries (same
  pattern as project reorder), calling the new
  `/api/admin/hackathons/reorder` endpoint.
- Delete confirmation follows existing certificate/project delete UX.

## Public page

`app/hackathons/page.tsx` — server component:
- Fetches `getHackathons()` from `lib/hackathons.ts`.
- Renders `ChapterRail` (existing, currently-unused component) with one
  chapter entry per hackathon (`{ id: hackathon.slug, num: hackathon.index, label: hackathon.title }`).
- Renders one `<section id={hackathon.slug} className="hackathon-chapter home-section">`
  per hackathon, containing: image gallery, title, description, tags,
  links.
- `Nav` gets a new "Hackathons" link.

No separate client component split is needed beyond what `ChapterRail`
already requires (`'use client'` — already marked); the page itself
can stay a server component since chapter content is static per
request.

## Animation

Two independent effects layered on each `.hackathon-chapter`:

**1. Text blur-stagger reveal** — reuses the existing
`AnimateOnScroll` `IntersectionObserver` + `.js-reveal-ready` /
`.is-visible` CSS pattern already in `globals.css` (fade + rise +
`blur(2px)→0`, `cubic-bezier(0.22,1,0.36,1)`). Extension: instead of
revealing the whole `.home-section` as one block, child elements
(image wrapper, title, description, tags) get individual
`transition-delay` steps (~90ms apart) via CSS nth-child or explicit
child classes, so they blur-in in sequence as the chapter enters
view. No new JS — `AnimateOnScroll` already toggles `.is-visible` on
`.home-section`; the stagger is pure CSS off that existing class.

**2. Image parallax** — new, small addition:
- One `scroll` event listener (passive, `requestAnimationFrame`-throttled)
  added by a new client component `HackathonParallax` (or inlined into
  a client wrapper for the image gallery), mounted once on
  `/hackathons`.
- On each scroll frame, for every chapter image currently in/near the
  viewport, compute `offset = (viewportCenter - imageCenter)`, apply
  `transform: translateY(${offset * 0.15}px)` via
  `style.setProperty('--parallax-y', ...)` consumed by a CSS
  `transform: translateY(var(--parallax-y, 0px))` rule — transform-only,
  no layout thrash.
- Listener attaches on mount, detaches on unmount — same lifecycle
  shape as `ChapterRail`'s `IntersectionObserver` cleanup.
- Only images inside `.hackathon-chapter` are queried
  (`querySelectorAll` scoped to the page), so this doesn't affect
  scroll performance on other routes.

## Error handling

- Same as existing content types: `getHackathons()` never throws —
  Redis errors are caught and logged, falls back to static seed
  (matches `getPortfolioData()` / `getProjects()` error handling).
- Image upload validates file size (4MB) and rejects oversized files
  with a 400, matching `app/api/admin/certificates/route.ts`.
- Empty hackathons list renders the page with just the empty state
  (no chapters, no rail items) rather than erroring — mirrors how
  `/work` and `/certificates` handle an empty list today.

## Testing

- `npm run typecheck` — Zod schema + route handler types.
- Manual verification in dev (`npm run dev`):
  1. Create a hackathon via admin dashboard with 2+ images, confirm it
     appears on `/hackathons` immediately (no stale-cache repeat of
     `93873a5`'s bug) and on the admin list.
  2. Reorder hackathons in admin, confirm order persists and reflects
     on the public page.
  3. Scroll `/hackathons` — confirm chapter rail active-dot tracks
     scroll position, text blur-staggers in per chapter, images
     parallax-drift, and it degrades gracefully with Redis
     unconfigured (static seed only, no crash).
  4. Delete a hackathon, confirm it disappears from both admin and
     public page without a redeploy.
- No automated test suite exists in this repo currently (README/
  package.json confirm only `typecheck`) — this feature follows that
  existing convention rather than introducing a new one.

## Files touched (new)

- `lib/hackathons.ts`
- `data/hackathons.ts`
- `app/api/admin/hackathons/route.ts`
- `app/api/admin/hackathons/reorder/route.ts`
- `app/hackathons/page.tsx`
- `components/HackathonParallax.tsx` (or equivalent client wrapper)

## Files touched (modified)

- `components/AdminDashboard.tsx` — new Hackathons tab
- `components/Nav.tsx` — new nav link
- `app/globals.css` — chapter-stagger CSS, parallax CSS var rule,
  `.hackathon-chapter` layout styles

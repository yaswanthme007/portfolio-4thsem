# Thamo Portfolio
### Next.js 15 · React 19 · Apple Liquid Glass · TypeScript

---

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:3000
npm run build
npm run start
```

---

## Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Server | Minimal hero — typewriter, CTA, skills |
| `/services` | Server | Services & expertise grid |
| `/work` | Server + Client island | Projects + live tag filter |
| `/work/[slug]` | Server (SSG) | Project detail with features |
| `/about` | Server | Profile summary + stats |
| `/certificates` | Server | Uploaded certificates |
| `/contact` | Server + Client | Glass form with Redis inbox |
| `/admin` | Server + Client | Protected admin console |

---

## Architecture

```
next-portfolio/
├── app/
│   ├── layout.tsx          # Root — Nav, fonts
│   ├── globals.css          # Full Liquid Glass design system
│   ├── page.tsx             # Hero
│   ├── services/page.tsx    # Services
│   ├── work/
│   │   ├── page.tsx         # Server shell
│   │   ├── WorkClient.tsx   # 'use client' island — filter state
│   │   └── [slug]/page.tsx  # SSG detail pages
│   ├── about/page.tsx       # About
│   ├── contact/page.tsx     # Contact (uses ContactForm)
│   └── api/resume/route.ts   # PDF download endpoint
│
├── components/
│   ├── LiquidGlass.tsx      # Polymorphic glass — mouse shimmer
│   ├── Nav.tsx              # Active-link nav (usePathname)
│   ├── Typewriter.tsx       # Animated role typewriter
│   └── ContactForm.tsx      # useActionState form
│
├── lib/
│   ├── portfolio.ts         # Redis-backed profile/resume/certificates data
│   ├── contacts.ts          # Redis inbox for contact form submissions
│   ├── github.ts           # GitHub streak stats
│   └── admin-session.ts    # Signed admin session cookies
│
├── data/
│   ├── projects.ts          # All project data
│   └── services.ts          # Services data
│
└── app/
    ├── admin/               # Protected dashboard + login
    ├── api/admin/           # Login/logout/content/upload routes
    └── certificates/        # Certificate gallery
```

---

## Apple Liquid Glass — Physics

Five layers stacked in CSS:

```
① backdrop-filter: blur(60px) saturate(200%) brightness(1.18)
   → Frosted translucent base

② background: rgba(255,255,255, 0.068)
   → Glass body tint

③ border-top:  1px solid rgba(255,255,255, 0.34)   ← bright (lit face)
   border-bottom: 1px solid rgba(255,255,255, 0.05) ← dark (shadow face)
   → Directional specular borders

④ box-shadow: [8 layers]
   inset 0 1.5px 0 rgba(255,255,255, 0.44)  ← top specular rim
   inset 0 -1.5px 0 rgba(0,0,0, 0.30)       ← gravity shadow
   0 24px 64px rgba(0,0,0, 0.68)             ← outer depth
   → Multi-layer specular system

⑤ ::before { radial-gradient at var(--mx) var(--my) }
   LiquidGlass.tsx updates --mx/--my on mousemove
   → Real-time caustic shimmer (the key effect)

⑥ ::after { SVG feTurbulence grain }
   → Surface micro-texture
```

---

## Backend — Redis Content Store

The site now stores profile, resume, certificates, and contact submissions in Redis:

1. `lib/portfolio.ts` loads and saves the editable site content
2. `lib/contacts.ts` stores inbox submissions
3. Admin routes are protected by signed cookies in `proxy.ts`
4. The contact form still uses a Server Action, but persistence is Redis-backed

```bash
# .env.local
REDIS_URL=redis://default:...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
ADMIN_SESSION_SECRET=long-random-string
GITHUB_USERNAME=thamothara7
GITHUB_TOKEN=github_pat_...
```

---

## Customise

| What | Where |
|------|-------|
| Projects | `data/projects.ts` |
| Services | `data/services.ts` |
| Timeline / stats | `app/about/page.tsx` |
| Contact links | `app/contact/page.tsx` |
| Glass intensity | `<LiquidGlass intensity="low|medium|high">` |
| Skills list | `app/page.tsx` |


# Portfolio

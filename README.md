# Yaswanth Portfolio

A professional portfolio application built with Next.js App Router to showcase projects, services, certificates, resume content, and contact information. The project also includes a protected admin dashboard for updating portfolio content and storing submissions with Redis when available.

## Features

- Responsive portfolio experience with custom animated UI and reusable React components
- Project showcase with dynamic work detail pages
- Dedicated pages for services, about, certificates, contact, and resume
- Protected admin dashboard for managing profile content, projects, certificates, experience, education, and resume assets
- Contact form persistence with Redis support, local fallback storage, and optional email notifications
- GitHub activity and repository data integrations for richer portfolio content

## Tech Stack

- Framework: Next.js 16 with the App Router
- UI: React 19, TypeScript, and custom global CSS
- Data and validation: Redis, Zod
- Integrations: GitHub API, Nodemailer
- Tooling: npm, TypeScript compiler

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app runs locally at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

## Environment Variables

Create a `.env.local` file in the project root and configure the variables you need:

```bash
REDIS_URL=redis://default:password@host:port
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
ADMIN_SESSION_SECRET=replace-with-a-long-random-string
GITHUB_USERNAME=yaswanthme007
GITHUB_TOKEN=github_pat_xxx
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@example.com
SMTP_PASS=app-password
NOTIFY_EMAIL=you@example.com
```

Notes:

- `REDIS_URL` enables persistent portfolio content and contact submission storage.
- `ADMIN_*` variables protect the dashboard at `/dashboard-yaswanth`.
- `GITHUB_*` variables support GitHub activity and repository data features.
- `SMTP_*` and `NOTIFY_EMAIL` enable contact form email notifications.

## Application Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page with hero content, highlights, and GitHub integrations |
| `/services` | Services and expertise overview |
| `/work` | Portfolio projects listing |
| `/work/[slug]` | Individual project details |
| `/about` | Profile summary and background |
| `/certificates` | Certificates gallery |
| `/contact` | Contact form and social links |
| `/resume` | Browser-friendly resume page |
| `/api/resume` | Resume download endpoint |
| `/dashboard-yaswanth` | Protected admin dashboard |
| `/dashboard-yaswanth/login` | Admin authentication page |

## Project Structure

```text
portfolio-4thsem/
|-- app/
|   |-- about/                  # About page
|   |-- api/                    # Route handlers for admin, GitHub, certificates, and resume
|   |-- certificates/           # Certificates page
|   |-- contact/                # Contact page
|   |-- dashboard-yaswanth/     # Admin dashboard and login
|   |-- resume/                 # Resume experience
|   |-- services/               # Services page
|   |-- work/                   # Project listing and dynamic project routes
|   |-- globals.css             # Global styles and design system
|   |-- layout.tsx              # Root layout
|   `-- page.tsx                # Home page
|-- components/                 # Reusable UI and dashboard components
|-- data/                       # Static seed data for projects and services
|-- lib/                        # Server utilities, data access, validation, and integrations
|-- public/                     # Static assets
|-- dist/                       # Generated build artifacts currently present in the repository
|-- next.config.ts              # Next.js configuration
|-- proxy.ts                    # Admin session protection
|-- tsconfig.json               # TypeScript configuration
`-- vercel.json                 # Deployment configuration
```

## Development Notes

- The application falls back to static or local storage when Redis is unavailable.
- Admin updates are designed to refresh public-facing content without changing application code.
- The repository currently includes generated `dist/` assets; the source application lives in the Next.js project structure above.

## Contributing

- Create a feature branch from `main` before making changes.
- Keep commits focused and open a pull request for review before merging.
- Run `npm run typecheck` before submitting documentation or code updates.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Generate Next.js types and run TypeScript checks |
| `npm run typecheck` | Generate Next.js types and run TypeScript checks |

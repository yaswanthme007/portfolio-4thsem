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

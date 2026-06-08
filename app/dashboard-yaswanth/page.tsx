import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/AdminDashboard'
import { getPortfolioData } from '@/lib/portfolio'
import { getProjects } from '@/lib/projects'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Yaswanth',
  description: 'Portfolio admin console for profile, resume, certificates, projects and management.',
}

export default async function AdminPage() {
  const [content, projects] = await Promise.all([
    getPortfolioData(),
    getProjects(),
  ])

  return (
    <section className="page admin-page">
      <AdminDashboard initialContent={content} initialProjects={projects} />
    </section>
  )
}

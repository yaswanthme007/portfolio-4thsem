import type { Metadata } from 'next'
import { WorkClient }    from './WorkClient'
import { getProjects }   from '@/lib/projects'

export const metadata: Metadata = {
  title: 'Work — Yaswanth',
  description: 'An index of selected projects by Yaswanth K B.',
}

export default async function WorkPage() {
  const projects = await getProjects()
  return <WorkClient projects={projects} />
}

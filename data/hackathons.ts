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

import { z } from 'zod'
import { hasRedisUrl, getRedisClient } from './redis'

/* ── Schemas ── */
export const ProfileUpdateSchema = z.object({
  heroLabel: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  headline: z.string().min(1),
  location: z.string().min(1),
  availability: z.string().min(1),
  bio: z.string().min(20),
  email: z.string().email(),
  githubUsername: z.string().min(1),
  resumeSummary: z.string().min(20),
  linkedinUrl: z.string().url(),
  githubUrl: z.string().url(),
  xUrl: z.string().url(),
  coffeeUrl: z.string().url(),
})

export const ProfileSchema = ProfileUpdateSchema.extend({
  resumeLabel: z.string().min(1),
})

export const ResumeSchema = z.object({
  fileUrl: z.string(),
  fileName: z.string(),
  uploadedAt: z.string(),
  mimeType: z.string().optional(),
})

export const CertificateSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  issuer: z.string().min(1),
  year: z.string().min(1),
  description: z.string().min(1).optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  uploadedAt: z.string(),
})

export const ExperienceItemSchema = z.object({
  id: z.string(),
  year: z.string().min(1),
  title: z.string().min(1),
  org: z.string().min(1),
  desc: z.string().optional(),
})

export const EducationItemSchema = z.object({
  id: z.string(),
  year: z.string().min(1),
  title: z.string().min(1),
  org: z.string().min(1),
  desc: z.string().optional(),
})

export const PortfolioSchema = z.object({
  profile: ProfileSchema,
  resume: ResumeSchema,
  certificates: z.array(CertificateSchema),
  experience: z.array(ExperienceItemSchema),
  education: z.array(EducationItemSchema),
})

export type Profile = z.infer<typeof ProfileSchema>
export type PortfolioData = z.infer<typeof PortfolioSchema>
export type Certificate = z.infer<typeof CertificateSchema>
export type ResumeAsset = z.infer<typeof ResumeSchema>
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>
export type EducationItem = z.infer<typeof EducationItemSchema>

export const DEFAULT_PORTFOLIO: PortfolioData = {
  profile: {
    heroLabel: `Available for internships — ${new Date().getFullYear()}`,
    name: 'Yaswanth',
    role: 'IT Undergraduate & Developer',
    headline: 'Developer',
    location: 'Chennai, India 🇮🇳',
    availability: 'Seeking internship opportunities — open to frontend, full-stack, and GenAI roles.',
    bio: 'Motivated IT undergraduate building real-world React applications, AI-powered systems, and admin dashboards. Every line of code purposeful, every interface deliberate.',
    email: 'kbyaswanth2907@gmail.com',
    githubUsername: 'yaswanthme007',
    resumeSummary: 'Information Technology undergraduate skilled in React.js, Python, and AI tooling — with hands-on internship experience in GenAI (RAG pipelines) and web development (e-commerce systems).',
    linkedinUrl: 'https://www.linkedin.com/in/kbyaswanth',
    githubUrl: 'https://github.com/yaswanthme007',
    xUrl: 'https://x.com/kbyaswanth',
    coffeeUrl: 'https://buymeacoffee.com/kbyaswanth',
    resumeLabel: 'Resume',
  },
  resume: { fileUrl: '', fileName: '', uploadedAt: '', mimeType: '' },
  certificates: [
    {
      id: 'cisco-cybersecurity',
      title: 'Introduction to Cybersecurity',
      issuer: 'Cisco Networking Academy',
      year: '2024',
      description: 'Fundamentals of cybersecurity concepts and best practices.',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'cisco-iot',
      title: 'Introduction to IoT and Digital Transformation',
      issuer: 'Cisco Networking Academy',
      year: '2024',
      description: 'IoT concepts and digital transformation strategies.',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'cisco-ai',
      title: 'Introduction to Modern AI',
      issuer: 'Cisco Networking Academy',
      year: '2024',
      description: 'Foundations of modern artificial intelligence.',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'aicte-cloud',
      title: 'Cloud Engineer Virtual Internship (AWS Skill Builder)',
      issuer: 'AICTE–EduSkills',
      year: '2024',
      description: 'Hands-on cloud engineering with AWS tools and services.',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'nptel-iot',
      title: 'Introduction to Internet of Things',
      issuer: 'NPTEL',
      year: '2024',
      description: 'In-depth study of IoT architecture and applications.',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'nptel-softskills',
      title: 'Developing Soft Skills and Personality',
      issuer: 'NPTEL',
      year: '2024',
      description: 'Communication, teamwork, and professional development.',
      uploadedAt: new Date().toISOString(),
    },
  ],
  experience: [
    {
      id: 'alkj-webdev',
      year: 'Nov 2025 – Jan 2026',
      title: 'Web Development Intern',
      org: 'ALKJ Technologies',
      desc: 'Built responsive web pages and reusable UI components. Implemented product listing, search, and cart features for an e-commerce application using Git for version control.',
    },
    {
      id: 'evolve-genai',
      year: 'Jun 2025 – Jul 2025',
      title: 'GenAI Intern',
      org: 'Evolve Robot Lab',
      desc: 'Developed an AI chatbot using Groq API (LLaMA-3) with a RAG pipeline via LangChain and FAISS. Enabled PDF-based Q&A with semantic search and a custom Streamlit interface.',
    },
  ],
  education: [
    {
      id: 'cit-btech',
      year: '2024 – 2028',
      title: 'B.Tech in Information Technology',
      org: 'Chennai Institute of Technology',
      desc: 'CGPA: 8.3 — Pursuing foundations in programming, data structures, and software engineering.',
    },
  ],
}

const PORTFOLIO_KEY = 'portfolio:content:v1'

function mergePortfolio(value: Partial<PortfolioData> | null | undefined): PortfolioData {
  const profile = {
    ...DEFAULT_PORTFOLIO.profile,
    ...(value?.profile ?? {}),
  }

  if (/ambassador/i.test(profile.headline)) {
    profile.headline = 'Developer'
  }

  return {
    profile,
    resume: { ...DEFAULT_PORTFOLIO.resume, ...(value?.resume ?? {}) },
    certificates: value?.certificates ?? DEFAULT_PORTFOLIO.certificates,
    experience: value?.experience ?? DEFAULT_PORTFOLIO.experience,
    education: value?.education ?? DEFAULT_PORTFOLIO.education,
  }
}

export async function getPortfolioData(): Promise<PortfolioData> {
  if (!hasRedisUrl()) return DEFAULT_PORTFOLIO

  try {
    const client = await getRedisClient()
    if (!client) return DEFAULT_PORTFOLIO

    const raw = await client.get(PORTFOLIO_KEY)
    if (!raw) {
      await client.set(PORTFOLIO_KEY, JSON.stringify(DEFAULT_PORTFOLIO))
      return DEFAULT_PORTFOLIO
    }

    const parsed = PortfolioSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      // Merge partial data gracefully
      try {
        const partial = JSON.parse(raw) as Partial<PortfolioData>
        return mergePortfolio(partial)
      } catch {
        await client.set(PORTFOLIO_KEY, JSON.stringify(DEFAULT_PORTFOLIO))
        return DEFAULT_PORTFOLIO
      }
    }

    return mergePortfolio(parsed.data)
  } catch (error) {
    console.error('Failed to read portfolio data', error)
    return DEFAULT_PORTFOLIO
  }
}

export async function savePortfolioData(data: PortfolioData) {
  const client = await getRedisClient()
  if (!client) {
    throw new Error('Redis is not configured. Set REDIS_URL to persist portfolio edits.')
  }
  await client.set(PORTFOLIO_KEY, JSON.stringify(data))
  return data
}

export async function updateProfile(input: ProfileUpdateInput) {
  const profile = ProfileUpdateSchema.parse(input)
  const current = await getPortfolioData()
  return savePortfolioData({
    ...current,
    profile: { ...current.profile, ...profile, resumeLabel: current.profile.resumeLabel },
  })
}

export async function updateResume(resume: ResumeAsset) {
  const current = await getPortfolioData()
  return savePortfolioData({ ...current, resume })
}

export async function addCertificate(certificate: Certificate) {
  const current = await getPortfolioData()
  return savePortfolioData({ ...current, certificates: [certificate, ...current.certificates] })
}

export async function removeCertificate(id: string) {
  const current = await getPortfolioData()
  return savePortfolioData({ ...current, certificates: current.certificates.filter(c => c.id !== id) })
}

export async function updateExperience(experience: ExperienceItem[]) {
  const current = await getPortfolioData()
  return savePortfolioData({ ...current, experience })
}

export async function updateEducation(education: EducationItem[]) {
  const current = await getPortfolioData()
  return savePortfolioData({ ...current, education })
}

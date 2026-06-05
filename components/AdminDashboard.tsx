'use client'

import { useState, useRef, type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { LiquidGlass } from './LiquidGlass'
import type { Certificate, PortfolioData, ProfileUpdateInput, ResumeAsset, ExperienceItem, EducationItem } from '@/lib/portfolio'
import type { AdminProject } from '@/lib/projects'
import type { GitHubRepo } from '@/app/api/admin/github-repos/route'

type AdminDashboardProps = {
  initialContent: PortfolioData
  initialProjects: AdminProject[]
}

type TabKey = 'overview' | 'projects' | 'profile' | 'resume' | 'certificates' | 'timeline'

function toProfileForm(profile: PortfolioData['profile']): ProfileUpdateInput {
  return {
    heroLabel: profile.heroLabel, name: profile.name, role: profile.role,
    headline: profile.headline, location: profile.location, availability: profile.availability,
    bio: profile.bio, email: profile.email, githubUsername: profile.githubUsername,
    resumeSummary: profile.resumeSummary, linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl, xUrl: profile.xUrl, coffeeUrl: profile.coffeeUrl,
  }
}

type TimelineItem = { id: string; year: string; title: string; org: string; desc?: string }
const EMPTY_TIMELINE = { year: '', title: '', org: '', desc: '' }

function formatDate(value: string) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
}

function fieldStateSetter(
  setProfile: Dispatch<SetStateAction<ProfileUpdateInput>>,
  key: keyof ProfileUpdateInput,
) {
  return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.currentTarget.value
    setProfile(prev => ({ ...prev, [key]: value }))
  }
}

/* ── Timeline admin (Experience + Education) ── */
function TimelineAdmin({
  label, endpoint, items, setItems,
}: {
  label: string
  endpoint: string
  items: TimelineItem[]
  setItems: (items: TimelineItem[]) => void
}) {
  const [form, setForm] = useState(EMPTY_TIMELINE)
  const [editing, setEditing] = useState<string | null>(null)
  const [status, setStatus] = useState<{ msg: string; error?: boolean } | null>(null)

  function startEdit(item: TimelineItem) {
    setEditing(item.id)
    setForm({ year: item.year, title: item.title, org: item.org, desc: item.desc ?? '' })
  }

  function reset() {
    setEditing(null)
    setForm(EMPTY_TIMELINE)
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus({ msg: editing ? 'Updating…' : 'Adding…' })
    const url = editing ? `${endpoint}?id=${editing}` : endpoint
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    let data: any
    try { data = await res.json() } catch { data = { error: 'Invalid response from server' } }
    if (!res.ok) { setStatus({ msg: data?.error || 'Error', error: true }); return }
    const key = label === 'Experience' ? 'experience' : 'education'
    setItems(data[key])
    setStatus({ msg: editing ? 'Updated' : 'Added' })
    reset()
  }

  async function handleDelete(id: string) {
    setStatus({ msg: 'Deleting…' })
    const res = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' })
    let data: any
    try { data = await res.json() } catch { data = { error: 'Invalid response from server' } }
    if (!res.ok) { setStatus({ msg: data?.error || 'Error', error: true }); return }
    const key = label === 'Experience' ? 'experience' : 'education'
    setItems(data[key])
    setStatus({ msg: 'Deleted' })
  }

  return (
    <LiquidGlass className="admin-card" interactive>
      <div className="card-topline">
        <div>
          <p className="sec-label">{label}</p>
          <h2 className="admin-card-title">{editing ? 'Editing entry' : `Add ${label.toLowerCase()}`}</h2>
        </div>
        <span className="admin-card-badge">{items.length}</span>
      </div>

      <form className="admin-form" onSubmit={handleSave}>
        <div className="form-grid">
          <label className="field-label">Period
            <input className="field-input" required placeholder="2025 – Present" value={form.year}
              onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
          </label>
          <label className="field-label">Title
            <input className="field-input" required placeholder="Role or degree" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </label>
        </div>
        <label className="field-label">Organisation
          <input className="field-input" required placeholder="Company or institution" value={form.org}
            onChange={e => setForm(p => ({ ...p, org: e.target.value }))} />
        </label>
        <label className="field-label">Description
          <textarea className="field-input field-textarea" value={form.desc}
            onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
        </label>
        {status && (
          <p className={`admin-status${status.error ? ' admin-status--error' : ''}`}>{status.msg}</p>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="submit" className="btn-submit" style={{ flex: 1 }}>
            {editing ? `Update ${label}` : `Add ${label}`}
          </button>
          {editing && <button type="button" className="btn-ghost" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <div className="admin-list">
        {items.length === 0 && <p className="admin-empty">No entries yet.</p>}
        {items.map(item => (
          <article key={item.id} className="admin-list-item">
            <div style={{ minWidth: 0, flex: 1 }}>
              <span className="admin-preview-label">{item.year}</span>
              <h3>{item.title}</h3>
              <p>{item.org}</p>
              {item.desc && <p className="admin-list-desc">{item.desc}</p>}
            </div>
            <div className="admin-row-actions">
              <button type="button" className="admin-btn-sm" onClick={() => startEdit(item)}>Edit</button>
              <button type="button" className="admin-btn-sm admin-btn-sm--danger" onClick={() => handleDelete(item.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </LiquidGlass>
  )
}

/* ══════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
   ══════════════════════════════════════════════ */
export function AdminDashboard({ initialContent, initialProjects }: AdminDashboardProps) {
  const [tab, setTab] = useState<TabKey>('overview')
  const [profile, setProfile] = useState<ProfileUpdateInput>(() => toProfileForm(initialContent.profile))
  const [resume, setResume] = useState<ResumeAsset>(initialContent.resume)
  const [certificates, setCertificates] = useState<Certificate[]>(initialContent.certificates)
  const [experience, setExperience] = useState<ExperienceItem[]>(initialContent.experience)
  const [education, setEducation] = useState<EducationItem[]>(initialContent.education)
  const [profileStatus, setProfileStatus] = useState<{ msg: string; error?: boolean } | null>(null)
  const [resumeStatus, setResumeStatus] = useState<{ msg: string; error?: boolean } | null>(null)
  const [certificateStatus, setCertificateStatus] = useState<{ msg: string; error?: boolean } | null>(null)
  const [projects, setProjects] = useState<AdminProject[]>(initialProjects)
  const [projectStatus, setProjectStatus] = useState<{ msg: string; error?: boolean } | null>(null)
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null)
  const [projectForm, setProjectForm] = useState({
    title: '', slug: '', description: '', year: String(new Date().getFullYear()),
    tags: '', repoUrl: '', liveUrl: '',
    feature1Title: '', feature1Desc: '',
    feature2Title: '', feature2Desc: '',
    feature3Title: '', feature3Desc: '',
    feature4Title: '', feature4Desc: '',
  })
  const projectFormRef = useRef<HTMLFormElement>(null)
  // GitHub import state
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([])
  const [showGithubPanel, setShowGithubPanel] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubError, setGithubError] = useState<string | null>(null)
  // Drag-and-drop reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  /* ── Profile ── */
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileStatus({ msg: 'Saving profile…' })
    const response = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    let data: any
    try { data = await response.json() } catch { data = { error: 'Invalid response' } }
    if (!response.ok) { setProfileStatus({ msg: data?.error || 'Unable to save.', error: true }); return }
    setProfileStatus({ msg: 'Profile saved' })
  }

  /* ── Resume ── */
  async function uploadResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formEl = event.currentTarget
    setResumeStatus({ msg: 'Uploading resume…' })
    const body = new FormData(formEl)
    const response = await fetch('/api/admin/resume', { method: 'POST', body })
    let data: any
    try { data = await response.json() } catch { data = null }
    if (!response.ok) {
      setResumeStatus({ msg: data?.error || (response.status === 413 ? 'File too large.' : 'Upload failed.'), error: true })
      return
    }
    setResume(data.resume)
    setResumeStatus({ msg: 'Resume uploaded' })
    formEl.reset()
  }

  async function removeResume() {
    setResumeStatus({ msg: 'Removing resume…' })
    const response = await fetch('/api/admin/resume', { method: 'DELETE' })
    let data: any
    try { data = await response.json() } catch { data = { error: 'Invalid response' } }
    if (!response.ok) { setResumeStatus({ msg: data?.error || 'Failed to remove.', error: true }); return }
    setResume(data.resume)
    setResumeStatus({ msg: 'Resume removed' })
  }

  /* ── Certificates ── */
  async function uploadCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formEl = event.currentTarget
    setCertificateStatus({ msg: 'Uploading certificate…' })
    const body = new FormData(formEl)
    const response = await fetch('/api/admin/certificates', { method: 'POST', body })
    let data: any
    try { data = await response.json() } catch { data = null }
    if (!response.ok) {
      setCertificateStatus({ msg: data?.error || (response.status === 413 ? 'File too large (limit ~4MB).' : 'Upload failed.'), error: true })
      return
    }
    setCertificates(prev => [data.certificate, ...prev])
    setCertificateStatus({ msg: 'Certificate added' })
    formEl.reset()
  }

  async function deleteCertificate(id: string) {
    setCertificateStatus({ msg: 'Removing certificate…' })
    const response = await fetch(`/api/admin/certificates?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    let data: any
    try { data = await response.json() } catch { data = { error: 'Invalid response' } }
    if (!response.ok) { setCertificateStatus({ msg: data?.error || 'Unable to delete.', error: true }); return }
    setCertificates(prev => prev.filter(item => item.id !== id))
    setCertificateStatus({ msg: 'Certificate removed' })
  }

  /* ── Projects ── */
  function startEditProject(p: AdminProject) {
    setEditingProject(p)
    setProjectForm({
      title: p.title, slug: p.slug, description: p.description, year: p.year,
      tags: p.tags.join(', '), repoUrl: p.repoUrl ?? '', liveUrl: p.liveUrl ?? '',
      feature1Title: p.features[0]?.title ?? '', feature1Desc: p.features[0]?.description ?? '',
      feature2Title: p.features[1]?.title ?? '', feature2Desc: p.features[1]?.description ?? '',
      feature3Title: p.features[2]?.title ?? '', feature3Desc: p.features[2]?.description ?? '',
      feature4Title: p.features[3]?.title ?? '', feature4Desc: p.features[3]?.description ?? '',
    })
  }

  function clearProjectForm() {
    setEditingProject(null)
    setProjectForm({
      title: '', slug: '', description: '', year: String(new Date().getFullYear()),
      tags: '', repoUrl: '', liveUrl: '',
      feature1Title: '', feature1Desc: '',
      feature2Title: '', feature2Desc: '',
      feature3Title: '', feature3Desc: '',
      feature4Title: '', feature4Desc: '',
    })
    projectFormRef.current?.reset()
  }

  /* ── Drag-and-drop reorder ── */
  async function handleDrop(toIndex: number) {
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null); setDragOverIndex(null); return
    }
    const reordered = [...projects]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(toIndex, 0, moved)
    setProjects(reordered)
    setDragIndex(null); setDragOverIndex(null)
    // Persist new order
    const ids = reordered.map(p => p.id)
    await fetch('/api/admin/projects/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
  }

  /* ── GitHub import ── */
  async function loadGithubRepos() {
    setGithubLoading(true)
    setGithubError(null)
    try {
      const res = await fetch('/api/admin/github-repos')
      const data = await res.json()
      if (!res.ok) { setGithubError(data.error || 'Failed to load repos'); return }
      setGithubRepos(data.repos ?? [])
      setShowGithubPanel(true)
    } catch {
      setGithubError('Network error — could not load repos')
    } finally {
      setGithubLoading(false)
    }
  }

  function importFromRepo(repo: GitHubRepo) {
    const year = repo.pushedAt
      ? new Date(repo.pushedAt).getFullYear().toString()
      : new Date().getFullYear().toString()
    const tags = [
      repo.language,
      ...repo.topics.slice(0, 4),
    ].filter(Boolean).join(', ')
    setProjectForm(prev => ({
      ...prev,
      title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      slug: repo.name,
      description: repo.description ?? '',
      year,
      tags,
      repoUrl: repo.htmlUrl,
      liveUrl: '',
    }))
    setShowGithubPanel(false)
    projectFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProjectStatus({ msg: editingProject ? 'Updating project…' : 'Creating project…' })
    const features = [
      projectForm.feature1Title && { title: projectForm.feature1Title, description: projectForm.feature1Desc },
      projectForm.feature2Title && { title: projectForm.feature2Title, description: projectForm.feature2Desc },
      projectForm.feature3Title && { title: projectForm.feature3Title, description: projectForm.feature3Desc },
      projectForm.feature4Title && { title: projectForm.feature4Title, description: projectForm.feature4Desc },
    ].filter(Boolean)
    const body = {
      title: projectForm.title,
      slug: projectForm.slug || projectForm.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: projectForm.description, year: projectForm.year,
      tags: projectForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      repoUrl: projectForm.repoUrl || undefined,
      liveUrl: projectForm.liveUrl || undefined,
      features,
    }
    const url = editingProject ? `/api/admin/projects?id=${encodeURIComponent(editingProject.id)}` : '/api/admin/projects'
    const response = await fetch(url, {
      method: editingProject ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    let data: any
    try { data = await response.json() } catch { data = { error: 'Invalid response' } }
    if (!response.ok) { setProjectStatus({ msg: data?.error || 'Unable to save project.', error: true }); return }
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? data.project : p))
      setProjectStatus({ msg: 'Project updated' })
    } else {
      setProjects(prev => [data.project, ...prev])
      setProjectStatus({ msg: 'Project created' })
    }
    clearProjectForm()
  }

  async function deleteProjectById(id: string) {
    setProjectStatus({ msg: 'Deleting…' })
    const response = await fetch(`/api/admin/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    let data: any
    try { data = await response.json() } catch { data = { error: 'Invalid response' } }
    if (!response.ok) { setProjectStatus({ msg: data?.error || 'Unable to delete.', error: true }); return }
    setProjects(prev => prev.filter(p => p.id !== id))
    setProjectStatus({ msg: 'Project deleted' })
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview',     label: 'Overview' },
    { key: 'projects',     label: 'Projects',     count: projects.length },
    { key: 'profile',      label: 'Profile' },
    { key: 'resume',       label: 'Resume' },
    { key: 'certificates', label: 'Certificates', count: certificates.length },
    { key: 'timeline',     label: 'Timeline',     count: experience.length + education.length },
  ]

  return (
    <div className="admin-shell">
      <header className="admin-hero">
        <div className="admin-hero-copy">
          <p className="sec-label">Admin Console</p>
          <h1 className="contact-heading">Edit your <em>portfolio</em></h1>
          <p className="contact-sub">
            All changes are persisted to Redis immediately. The public site re-reads on every visit.
          </p>
        </div>
        <div className="admin-actions">
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="btn-ghost admin-logout">Sign out</button>
          </form>
        </div>
      </header>

      <div className="admin-tabs" role="tablist">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`admin-tab${tab === t.key ? ' admin-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count !== undefined && <span className="admin-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="admin-stats">
          <LiquidGlass className="admin-stat" interactive>
            <span className="admin-stat-label">Profile</span>
            <strong className="admin-stat-value">Live</strong>
            <span className="admin-stat-meta">Pulled from Redis on every visit</span>
          </LiquidGlass>
          <LiquidGlass className="admin-stat" interactive>
            <span className="admin-stat-label">Resume</span>
            <strong className="admin-stat-value">{resume.fileUrl ? 'Live' : 'Pending'}</strong>
            <span className="admin-stat-meta">{resume.fileName || 'Upload your latest PDF'}</span>
          </LiquidGlass>
          <LiquidGlass className="admin-stat" interactive>
            <span className="admin-stat-label">Projects</span>
            <strong className="admin-stat-value">{projects.length}</strong>
            <span className="admin-stat-meta">Live on the public work page</span>
          </LiquidGlass>
          <LiquidGlass className="admin-stat" interactive>
            <span className="admin-stat-label">Certificates</span>
            <strong className="admin-stat-value">{certificates.length}</strong>
            <span className="admin-stat-meta">Public, with optional file preview</span>
          </LiquidGlass>
          <LiquidGlass className="admin-stat" interactive>
            <span className="admin-stat-label">Experience</span>
            <strong className="admin-stat-value">{experience.length}</strong>
            <span className="admin-stat-meta">Timeline on the about page</span>
          </LiquidGlass>
        </div>
      )}

      {/* ── PROJECTS ── */}
      {tab === 'projects' && (
        <LiquidGlass className="admin-card" interactive>
          <div className="card-topline">
            <div>
              <p className="sec-label">Projects</p>
              <h2 className="admin-card-title">{editingProject ? `Editing: ${editingProject.title}` : 'Add a project'}</h2>
            </div>
            <span className="admin-card-badge">{projects.length} live</span>
          </div>

          {/* GitHub import panel */}
          <div className="github-import-bar">
            <button
              type="button"
              className={`btn-ghost${githubLoading ? '' : ''}`}
              style={{ fontSize: 12, padding: '7px 16px' }}
              onClick={showGithubPanel ? () => setShowGithubPanel(false) : loadGithubRepos}
              disabled={githubLoading}
            >
              {githubLoading ? 'Loading repos…' : showGithubPanel ? '↑ Hide repos' : '↓ Import from GitHub'}
            </button>
            {githubError && <span className="admin-status admin-status--error" style={{ fontSize: 12 }}>{githubError}</span>}
          </div>

          {showGithubPanel && (
            <div className="github-repo-list">
              {githubRepos.length === 0 && (
                <p className="admin-empty">No public repos found.</p>
              )}
              {githubRepos.map(repo => (
                <button
                  key={repo.fullName}
                  type="button"
                  className="github-repo-row"
                  onClick={() => importFromRepo(repo)}
                >
                  <span className="github-repo-name">{repo.name}</span>
                  {repo.description && (
                    <span className="github-repo-desc">{repo.description.slice(0, 80)}{repo.description.length > 80 ? '…' : ''}</span>
                  )}
                  <span className="github-repo-meta">
                    {repo.language && <span>{repo.language}</span>}
                    {repo.stars > 0 && <span>★ {repo.stars}</span>}
                    {repo.pushedAt && (
                      <span>{new Date(repo.pushedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          <form ref={projectFormRef} className="admin-form" onSubmit={saveProject}>
            <div className="form-grid">
              <label className="field-label">Title
                <input className="field-input" required value={projectForm.title}
                  onChange={e => setProjectForm(p => ({ ...p, title: e.target.value }))} />
              </label>
              <label className="field-label">Slug (auto-generated)
                <input className="field-input" placeholder="my-project" value={projectForm.slug}
                  onChange={e => setProjectForm(p => ({ ...p, slug: e.target.value }))} />
              </label>
              <label className="field-label">Year
                <input className="field-input" required value={projectForm.year}
                  onChange={e => setProjectForm(p => ({ ...p, year: e.target.value }))} />
              </label>
              <label className="field-label">Tags (comma separated)
                <input className="field-input" placeholder="React, Node, AI" value={projectForm.tags}
                  onChange={e => setProjectForm(p => ({ ...p, tags: e.target.value }))} />
              </label>
              <label className="field-label">GitHub URL
                <input className="field-input" type="url" value={projectForm.repoUrl}
                  onChange={e => setProjectForm(p => ({ ...p, repoUrl: e.target.value }))} />
              </label>
              <label className="field-label">Live URL
                <input className="field-input" type="url" value={projectForm.liveUrl}
                  onChange={e => setProjectForm(p => ({ ...p, liveUrl: e.target.value }))} />
              </label>
            </div>
            <label className="field-label">Description
              <textarea required className="field-input field-textarea" value={projectForm.description}
                onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} />
            </label>
            <p className="sec-label" style={{ marginTop: 4 }}>Features (up to 4)</p>
            <div className="form-grid">
              {([1,2,3,4] as const).map(n => (
                <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="field-input" placeholder={`Feature ${n} title`}
                    value={projectForm[`feature${n}Title` as keyof typeof projectForm]}
                    onChange={e => setProjectForm(p => ({ ...p, [`feature${n}Title`]: e.target.value }))} />
                  <input className="field-input" placeholder="Description"
                    value={projectForm[`feature${n}Desc` as keyof typeof projectForm]}
                    onChange={e => setProjectForm(p => ({ ...p, [`feature${n}Desc`]: e.target.value }))} />
                </div>
              ))}
            </div>
            {projectStatus && (
              <p className={`admin-status${projectStatus.error ? ' admin-status--error' : ''}`}>{projectStatus.msg}</p>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn-submit" style={{ flex: 1 }}>
                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
              {editingProject && (
                <button type="button" className="btn-ghost" style={{ minWidth: 110 }} onClick={clearProjectForm}>Cancel</button>
              )}
            </div>
          </form>

          <p className="admin-empty" style={{ fontSize: 11, padding: '6px 0 0', color: 'var(--ink-faint)' }}>
            Drag ⠿ to reorder — first project shows as featured on home page.
          </p>
          <div className="admin-list">
            {projects.length === 0 && <p className="admin-empty">No projects yet.</p>}
            {projects.map((p, i) => (
              <article
                key={p.id}
                className={`admin-list-item admin-drag-item${dragOverIndex === i ? ' admin-drag-over' : ''}`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={e => { e.preventDefault(); setDragOverIndex(i) }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
              >
                <span className="admin-drag-handle" aria-hidden="true">⠿</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span className="admin-preview-label">{p.index} · {p.year}</span>
                  <h3>{p.title}</h3>
                  <p>{p.description.slice(0, 110)}{p.description.length > 110 ? '…' : ''}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {p.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
                  </div>
                </div>
                <div className="admin-row-actions">
                  <button type="button" className="admin-btn-sm" onClick={() => startEditProject(p)}>Edit</button>
                  <button type="button" className="admin-btn-sm admin-btn-sm--danger" onClick={() => deleteProjectById(p.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </LiquidGlass>
      )}

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <LiquidGlass className="admin-card" interactive>
          <div className="card-topline">
            <div>
              <p className="sec-label">Public Profile</p>
              <h2 className="admin-card-title">Identity &amp; links</h2>
            </div>
            <span className="admin-card-badge">Redis</span>
          </div>

          <form className="admin-form" onSubmit={saveProfile}>
            <div className="form-grid">
              <label className="field-label">Hero label
                <input className="field-input" name="heroLabel" value={profile.heroLabel} onChange={fieldStateSetter(setProfile, 'heroLabel')} />
              </label>
              <label className="field-label">Name
                <input className="field-input" name="name" value={profile.name} onChange={fieldStateSetter(setProfile, 'name')} />
              </label>
              <label className="field-label">Role
                <input className="field-input" name="role" value={profile.role} onChange={fieldStateSetter(setProfile, 'role')} />
              </label>
              <label className="field-label">Headline
                <input className="field-input" name="headline" value={profile.headline} onChange={fieldStateSetter(setProfile, 'headline')} />
              </label>
              <label className="field-label">Location
                <input className="field-input" name="location" value={profile.location} onChange={fieldStateSetter(setProfile, 'location')} />
              </label>
              <label className="field-label">Availability
                <input className="field-input" name="availability" value={profile.availability} onChange={fieldStateSetter(setProfile, 'availability')} />
              </label>
              <label className="field-label">Email
                <input className="field-input" name="email" type="email" value={profile.email} onChange={fieldStateSetter(setProfile, 'email')} />
              </label>
              <label className="field-label">GitHub username
                <input className="field-input" name="githubUsername" value={profile.githubUsername} onChange={fieldStateSetter(setProfile, 'githubUsername')} />
              </label>
            </div>
            <label className="field-label">Bio
              <textarea className="field-input field-textarea" name="bio" value={profile.bio} onChange={fieldStateSetter(setProfile, 'bio')} />
            </label>
            <label className="field-label">Resume summary
              <textarea className="field-input field-textarea" name="resumeSummary" value={profile.resumeSummary} onChange={fieldStateSetter(setProfile, 'resumeSummary')} />
            </label>
            <div className="form-grid">
              <label className="field-label">LinkedIn
                <input className="field-input" name="linkedinUrl" value={profile.linkedinUrl} onChange={fieldStateSetter(setProfile, 'linkedinUrl')} />
              </label>
              <label className="field-label">GitHub
                <input className="field-input" name="githubUrl" value={profile.githubUrl} onChange={fieldStateSetter(setProfile, 'githubUrl')} />
              </label>
              <label className="field-label">X / Twitter
                <input className="field-input" name="xUrl" value={profile.xUrl} onChange={fieldStateSetter(setProfile, 'xUrl')} />
              </label>
              <label className="field-label">Buy me a coffee
                <input className="field-input" name="coffeeUrl" value={profile.coffeeUrl} onChange={fieldStateSetter(setProfile, 'coffeeUrl')} />
              </label>
            </div>
            {profileStatus && (
              <p className={`admin-status${profileStatus.error ? ' admin-status--error' : ''}`}>{profileStatus.msg}</p>
            )}
            <button type="submit" className="btn-submit">Save Profile</button>
          </form>
        </LiquidGlass>
      )}

      {/* ── RESUME ── */}
      {tab === 'resume' && (
        <LiquidGlass className="admin-card" interactive>
          <div className="card-topline">
            <div>
              <p className="sec-label">Resume</p>
              <h2 className="admin-card-title">Upload your PDF</h2>
            </div>
            <span className="admin-card-badge">Public</span>
          </div>

          <p className="admin-copy">
            The public resume route embeds the latest PDF automatically. Replace at any time.
          </p>

          <div className="admin-preview">
            <span className="admin-preview-label">Current file</span>
            <strong>{resume.fileName || 'No resume uploaded yet'}</strong>
            <span>{resume.uploadedAt ? formatDate(resume.uploadedAt) : 'Waiting for upload'}</span>
            {resume.fileUrl && (
              <a href={resume.fileUrl} target="_blank" rel="noreferrer" className="project-link" style={{ marginTop: 6 }}>
                Open resume →
              </a>
            )}
          </div>

          <form className="admin-form" onSubmit={uploadResume}>
            <label className="field-label">Resume PDF
              <input className="field-input" name="resume" type="file" accept="application/pdf" />
            </label>
            {resumeStatus && (
              <p className={`admin-status${resumeStatus.error ? ' admin-status--error' : ''}`}>{resumeStatus.msg}</p>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn-submit" style={{ flex: 1 }}>Upload Resume</button>
              {resume.fileUrl && (
                <button type="button" className="btn-ghost" onClick={removeResume}>
                  Remove
                </button>
              )}
            </div>
          </form>
        </LiquidGlass>
      )}

      {/* ── CERTIFICATES ── */}
      {tab === 'certificates' && (
        <LiquidGlass className="admin-card" interactive>
          <div className="card-topline">
            <div>
              <p className="sec-label">Certificates</p>
              <h2 className="admin-card-title">Upload proof of skill</h2>
            </div>
            <span className="admin-card-badge">{certificates.length} live</span>
          </div>

          <form className="admin-form" onSubmit={uploadCertificate}>
            <div className="form-grid">
              <label className="field-label">Title
                <input className="field-input" name="title" placeholder="Certificate title" required />
              </label>
              <label className="field-label">Issuer
                <input className="field-input" name="issuer" placeholder="Issuing platform" required />
              </label>
              <label className="field-label">Year
                <input className="field-input" name="year" placeholder="2026" required />
              </label>
              <label className="field-label">Type
                <select className="field-input" name="certType">
                  <option value="certification">Certification</option>
                  <option value="internship">Internship Certificate</option>
                </select>
              </label>
              <label className="field-label">File (optional)
                <input className="field-input" name="file" type="file" accept="application/pdf,image/*" />
              </label>
            </div>
            <label className="field-label">Description
              <textarea className="field-input field-textarea" name="description" placeholder="Short note about this certificate." />
            </label>
            {certificateStatus && (
              <p className={`admin-status${certificateStatus.error ? ' admin-status--error' : ''}`}>{certificateStatus.msg}</p>
            )}
            <button type="submit" className="btn-submit">Add Certificate</button>
          </form>

          <div className="admin-list">
            {certificates.length ? certificates.map(cert => (
              <article key={cert.id} className="admin-list-item">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span className="admin-preview-label">{cert.year} · {cert.certType === 'internship' ? 'Internship' : 'Certification'}</span>
                  <h3>{cert.title}</h3>
                  <p>{cert.issuer}</p>
                  {cert.description && <p className="admin-list-desc">{cert.description}</p>}
                  {cert.fileUrl && (
                    <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="project-link" style={{ marginTop: 8 }}>View file →</a>
                  )}
                </div>
                <button type="button" className="admin-btn-sm admin-btn-sm--danger" onClick={() => deleteCertificate(cert.id)}>Delete</button>
              </article>
            )) : (
              <p className="admin-empty">No certificates uploaded yet.</p>
            )}
          </div>
        </LiquidGlass>
      )}

      {/* ── TIMELINE: Experience + Education side-by-side ── */}
      {tab === 'timeline' && (
        <div className="admin-grid">
          <TimelineAdmin
            label="Experience"
            endpoint="/api/admin/experience"
            items={experience}
            setItems={items => setExperience(items as ExperienceItem[])}
          />
          <TimelineAdmin
            label="Education"
            endpoint="/api/admin/education"
            items={education}
            setItems={items => setEducation(items as EducationItem[])}
          />
        </div>
      )}
    </div>
  )
}

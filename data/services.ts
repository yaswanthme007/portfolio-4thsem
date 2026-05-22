export interface Service {
  id: string; glyph: string; name: string; description: string; items: string[]
}
export const SERVICES: Service[] = [
  {
    id:'design-engineering', glyph:'◎', name:'Design Engineering',
    description:'Translating designs into pixel-perfect, performant interfaces with meticulous attention to every detail.',
    items:['Component Architecture','Animation & Motion','Design Systems','Accessibility (WCAG 2.1)'],
  },
  {
    id:'fullstack', glyph:'⬡', name:'Full Stack Development',
    description:'End-to-end product engineering from database schema to deployed application, with emphasis on developer experience.',
    items:['Next.js / React','Node.js & PostgreSQL','REST & GraphQL APIs','CI/CD & DevOps'],
  },
  {
    id:'consulting', glyph:'◌', name:'Technical Consulting',
    description:'Helping teams make better architectural decisions, adopt modern tooling, and ship with more confidence.',
    items:['Architecture Reviews','Performance Audits','Tech Stack Planning','Team Mentorship'],
  },
]

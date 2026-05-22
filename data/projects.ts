export interface Feature { title: string; description: string }

export interface Project {
  id:          string
  slug:        string
  index:       string
  title:       string
  description: string
  tags:        string[]
  year:        string
  features:    Feature[]
  liveUrl?:    string
  repoUrl?:    string
}

export const PROJECTS: Project[] = [
  {
    id: 'ecommerce-admin',
    slug: 'ecommerce-admin',
    index: '01',
    title: 'E-Commerce Admin & Storefront',
    year: '2025',
    description: 'A complete e-commerce system with an admin dashboard and customer storefront — product management, real-time sync, cart, and category filtering built in React.',
    tags: ['React', 'Tailwind CSS', 'Local Storage', 'React Router'],
    repoUrl: 'https://github.com/yaswanthme007',
    features: [
      { title: 'Admin Dashboard', description: 'Full CRUD product management using Local Storage as a data layer with real-time sync to the storefront.' },
      { title: 'Storefront', description: 'Dynamic product listings with category filtering, search, sorting, and cart functionality.' },
      { title: 'Reusable Components', description: 'Modular React components following best frontend practices for maintainability.' },
      { title: 'Cart System', description: 'Add, remove, and update quantity logic with persistent cart state.' },
    ],
  },
  {
    id: 'groq-rag-chatbot',
    slug: 'groq-rag-chatbot',
    index: '02',
    title: 'Groq RAG Chatbot',
    year: '2025',
    description: 'An AI-powered chatbot using Groq API (LLaMA-3) with a RAG pipeline — users upload PDFs and query content using natural language via semantic search.',
    tags: ['Python', 'Streamlit', 'Groq API', 'LangChain', 'FAISS'],
    repoUrl: 'https://github.com/yaswanthme007',
    features: [
      { title: 'RAG Pipeline', description: 'Retrieval-Augmented Generation using LangChain and FAISS for accurate document-based answers.' },
      { title: 'PDF Q&A', description: 'Upload any PDF and ask questions in natural language — answers grounded in your document.' },
      { title: 'Groq Inference', description: 'High-performance inference powered by Groq API running LLaMA-3.' },
      { title: 'Semantic Search', description: 'HuggingFace embeddings for accurate semantic similarity and retrieval.' },
    ],
  },
  {
    id: 'todo-app',
    slug: 'todo-app',
    index: '03',
    title: 'To-Do List Application',
    year: '2024',
    description: 'A responsive task management app with persistent storage — task creation, deletion, and completion tracking built with React state management.',
    tags: ['React', 'HTML', 'CSS'],
    repoUrl: 'https://github.com/yaswanthme007',
    features: [
      { title: 'Persistent Storage', description: 'Tasks persist across sessions using browser storage.' },
      { title: 'Task Management', description: 'Create, delete, and mark tasks complete with smooth state updates.' },
      { title: 'Responsive UI', description: 'Clean, mobile-friendly interface built without any UI libraries.' },
    ],
  },
]

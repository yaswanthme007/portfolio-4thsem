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
    id: 'notesroom',
    slug: 'notesroom',
    index: '01',
    title: 'NotesRoom',
    year: '2025',
    description: 'Full-stack collaborative notes platform — create rooms, share PDFs/images/docs, and chat with a per-room AI assistant (Llama 3 via Groq) that answers questions grounded in your uploaded content.',
    tags: ['Next.js', 'Node.js', 'MongoDB', 'Firebase', 'Groq API', 'TypeScript'],
    repoUrl: 'https://github.com/yaswanthme007/notesroom',
    liveUrl: 'https://notesroom.vercel.app',
    features: [
      {
        title: 'Room Collaboration',
        description: 'Create rooms with unique 6-character codes. Role-based access: Admin (full control), Editor (add/edit), and Viewer (read-only).',
      },
      {
        title: 'File Management',
        description: 'Upload and preview PDFs, images, Word, and PowerPoint files in-browser via Firebase Storage with folder organisation.',
      },
      {
        title: 'AI Chatbot',
        description: 'Per-room Llama 3 assistant (Groq API) that extracts, chunks, and embeds documents for grounded, accurate answers.',
      },
      {
        title: 'Semantic Search',
        description: 'Vector embeddings with in-memory cosine similarity and MongoDB for fast, relevant document retrieval.',
      },
    ],
  },
  {
    id: 'groq-rag-chatbot',
    slug: 'groq-rag-chatbot',
    index: '02',
    title: 'Groq RAG Chatbot',
    year: '2025',
    description: 'AI-powered PDF Q&A chatbot using Groq API (LLaMA-3) with a RAG pipeline — upload any PDF and query its content with natural language via semantic search.',
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
    description: 'Responsive task management app with persistent storage — task creation, deletion, and completion tracking built with clean React state management.',
    tags: ['React', 'HTML', 'CSS'],
    repoUrl: 'https://github.com/yaswanthme007',
    features: [
      { title: 'Persistent Storage', description: 'Tasks persist across sessions using browser storage.' },
      { title: 'Task Management', description: 'Create, delete, and mark tasks complete with smooth state updates.' },
      { title: 'Responsive UI', description: 'Clean, mobile-friendly interface built without any UI libraries.' },
    ],
  },
]

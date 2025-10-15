import { Project, Flashcard } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const projectsApi = {
  async getAll(): Promise<Project[]> {
    // Replace with your actual API endpoint
    const response = await fetch(`${API_BASE_URL}/api/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  async getById(id: string): Promise<Project> {
    // Replace with your actual API endpoint
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  },

  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    // Replace with your actual API endpoint
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },
};

export const flashcardsApi = {
  async getByProjectId(projectId: string): Promise<Flashcard[]> {
    // Replace with your actual API endpoint
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/flashcards`);
    if (!response.ok) throw new Error('Failed to fetch flashcards');
    return response.json();
  },

  async create(flashcard: Omit<Flashcard, 'id' | 'createdAt'>): Promise<Flashcard> {
    // Replace with your actual API endpoint
    const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flashcard),
    });
    if (!response.ok) throw new Error('Failed to create flashcard');
    return response.json();
  },
};

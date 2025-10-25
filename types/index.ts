export type ProjectType = 'Study' | 'Flash Cards' | 'Exam Papers';

export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  icon?: string;
  color?: string;
}

export interface Flashcard {
  id: string;
  projectId: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  filename?: string;
  size?: number;
  uploadDate: string;
  userId: string;
}

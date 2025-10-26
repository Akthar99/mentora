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
  documents?: Document[]; // Array of documents in this project
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
  docId?: string; // Document ID from AI server (doc_user123_default_1234567890)
  selected?: boolean; // Whether document is selected for AI operations
}

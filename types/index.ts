export type ProjectType = 'Study' | 'Flash Cards' | 'Exam Papers';

export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  createdAt: string;
  icon: string;
  color: string;
}

export interface Flashcard {
  id: string;
  projectId: string;
  question: string;
  answer: string;
  createdAt: string;
}

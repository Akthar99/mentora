'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectType } from '@/types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('Study');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setProjectType(typeParam as ProjectType);
    }
  }, [searchParams]);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user || !title.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      console.log('Creating project with data:', {
        title: title.trim(),
        description: description.trim(),
        type: projectType,
        userId: user.uid,
      });

      const projectsRef = collection(db, 'projects');
      const newProject = {
        title: title.trim(),
        description: description.trim(),
        type: projectType,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };

      console.log('Attempting to add document to Firestore...');
      const docRef = await addDoc(projectsRef, newProject);
      console.log('Project created successfully with ID:', docRef.id);
      
      // Redirect to project page based on type
      router.push(`/dashboard/projects/${docRef.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to create project. ';
      if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Please check Firestore security rules (see FIRESTORE_RULES.md).';
      } else if (error.code === 'unavailable') {
        errorMessage += 'Firestore is currently unavailable. Please try again later.';
      } else if (error.code === 'unauthenticated') {
        errorMessage += 'You must be logged in to create projects.';
        router.push('/login');
        return;
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const getTypeColor = (type: ProjectType) => {
    switch (type) {
      case 'Study':
        return 'blue';
      case 'Exam Papers':
        return 'orange';
      case 'Flash Cards':
        return 'green';
      default:
        return 'blue';
    }
  };

  const color = getTypeColor(projectType);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-2xl p-8">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-700 mb-4`}>
          {projectType}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
        <p className="text-gray-600 mb-8">
          {projectType === 'Study' && 'Study with your chat-bot to learn faster than ever.'}
          {projectType === 'Exam Papers' && 'Generate MCQ questions and mark exam papers with AI.'}
          {projectType === 'Flash Cards' && 'Create flashcards to help with memorizing information.'}
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-3 text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="e.g., Biology Notes, Math Final Prep"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Brief description of what this project is about..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

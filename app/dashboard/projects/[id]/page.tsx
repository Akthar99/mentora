'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
    }
  }, [user, projectId]);

  const fetchProject = async () => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const projectData = {
          id: projectSnap.id,
          ...projectSnap.data()
        } as Project;

        // Check if user owns this project
        if (projectData.userId !== user?.uid) {
          router.push('/dashboard');
          return;
        }

        // Check premium status for Exam Papers
        if (projectData.type === 'Exam Papers' && !userData?.isPremium) {
          router.push('/upgrade');
          return;
        }

        setProject(projectData);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Render different content based on project type
  const renderProjectContent = () => {
    switch (project.type) {
      case 'Study':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href={`/dashboard/upload?projectId=${project.id}`}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border-2 border-gray-200"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
              </div>
              <p className="text-gray-600">Add study materials to this project</p>
            </Link>

            <Link
              href={`/dashboard/chat?projectId=${project.id}`}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border-2 border-gray-200"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Study Chat</h3>
              </div>
              <p className="text-gray-600">Chat with AI about your documents</p>
            </Link>
          </div>
        );

      case 'Flash Cards':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href={`/dashboard/upload?projectId=${project.id}`}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border-2 border-gray-200"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
              </div>
              <p className="text-gray-600">Add materials to generate flashcards from</p>
            </Link>

            <Link
              href={`/dashboard/flashcards?projectId=${project.id}`}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border-2 border-gray-200"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Generate Flashcards</h3>
              </div>
              <p className="text-gray-600">Create AI-powered flashcards</p>
            </Link>
          </div>
        );

      case 'Exam Papers':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href={`/dashboard/upload?projectId=${project.id}`}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border-2 border-gray-200"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
              </div>
              <p className="text-gray-600">Add exam materials and papers</p>
            </Link>

            <Link
              href={`/dashboard/generate-paper?projectId=${project.id}`}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Generate Exam Paper</h3>
              </div>
              <p className="text-gray-600">Create AI-powered exam questions with editing</p>
            </Link>

            <Link
              href={`/dashboard/papers?projectId=${project.id}`}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Saved Exam Papers</h3>
              </div>
              <p className="text-gray-600">View and manage your saved exam papers</p>
            </Link>

            <Link
              href={`/dashboard/questions?projectId=${project.id}`}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border-2 border-gray-200"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Question Bank</h3>
              </div>
              <p className="text-gray-600">View all generated questions</p>
            </Link>

            <Link
              href={`/dashboard/grade?projectId=${project.id}`}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border-2 border-gray-200"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Grade Papers</h3>
              </div>
              <p className="text-gray-600">AI-powered paper grading</p>
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
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

  const color = getTypeColor(project.type);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Projects</span>
        </Link>
      </div>

      <div className="mb-8">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-700 mb-4`}>
          {project.type}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
        {project.description && (
          <p className="text-gray-600">{project.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          Created on {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>

      {renderProjectContent()}
    </div>
  );
}

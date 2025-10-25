'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Header from '@/components/Header';
import FlashcardView from '@/components/FlashcardView';
import { Flashcard, Project } from '@/types';
import { flashcardsApi, projectsApi } from '@/services/api';

export default function FlashcardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projectData, flashcardsData] = await Promise.all([
        projectsApi.getById(projectId),
        flashcardsApi.getByProjectId(projectId),
      ]);
      setProject(projectData);
      setFlashcards(flashcardsData);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      setFlashcards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Projects</span>
        </button>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-80 bg-gray-200 rounded-2xl"></div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project?.title || 'Flashcards'}
              </h1>
              <p className="text-gray-600">{project?.description || 'Study your flashcards'}</p>
            </div>

            {flashcards.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No flashcards yet</h3>
                <p className="text-gray-600 mb-6">Create your first flashcard to get started</p>
                <button className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition">
                  <Plus className="w-5 h-5" />
                  <span>Add Flashcard</span>
                </button>
              </div>
            ) : (
              <>
                <FlashcardView flashcard={flashcards[currentIndex]} />

                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="flex items-center space-x-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous</span>
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Card {currentIndex + 1} of {flashcards.length}
                    </p>
                    <div className="flex space-x-1 mt-2">
                      {flashcards.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentIndex
                              ? 'w-8 bg-blue-600'
                              : 'w-1.5 bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === flashcards.length - 1}
                    className="flex items-center space-x-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

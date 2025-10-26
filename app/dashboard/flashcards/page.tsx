'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import FlashcardView from '@/components/FlashcardView';
import DocumentSelector from '@/components/DocumentSelector';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';
import { Document } from '@/types';

interface Flashcard {
  question: string;
  hint: string;
  answer: string;
  concept: string;
}

export default function Flashcards() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [generating, setGenerating] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    if (user && projectId) {
      fetchProjectDocuments();
    }
  }, [user, projectId]);

  const fetchProjectDocuments = async () => {
    try {
      const projectRef = doc(db, 'projects', projectId!);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        setDocuments(projectData.documents || []);
      }
    } catch (error) {
      console.error('Error fetching project documents:', error);
    }
  };

  const generateFlashcards = async () => {
    if (!subject || !user || selectedDocumentIds.length === 0) return;

    if (!projectId) {
      alert('Project ID is required. Please access this page from a project.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/api/generate-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          session_id: 'default',
          num_flashcards: 10,
          project_id: projectId,
          document_ids: selectedDocumentIds
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFlashcards(result.flashcards || []);
          setCurrentCard(0);
        } else {
          throw new Error(result.message || 'Failed to generate flashcards');
        }
      } else {
        throw new Error('HTTP error: ' + response.status);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Error generating flashcards. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleDocumentSelectionChange = (selectedIds: string[]) => {
    setSelectedDocumentIds(selectedIds);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 font-medium text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back
        </button>

        <DocumentSelector 
          documents={documents}
          onSelectionChange={handleDocumentSelectionChange}
          className="mb-6 sm:mb-8"
        />
        
        <div className="bg-white shadow rounded-lg mb-6 sm:mb-8">
          <div className="px-4 py-4 sm:p-6">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-4 sm:mb-6">Generate Flashcards</h3>
            
            {selectedDocumentIds.length > 0 && (
              <div className="mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-700">
                  Using <span className="font-medium">{selectedDocumentIds.length} selected document(s)</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Subject/Topic</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                  placeholder="e.g., Computer Science, Biology, History"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This helps AI generate more relevant flashcards
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <button
                onClick={generateFlashcards}
                disabled={generating || selectedDocumentIds.length === 0 || !subject}
                className="w-full inline-flex justify-center py-2 sm:py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Flashcards...
                  </>
                ) : (
                  'Generate Flashcards'
                )}
              </button>
            </div>
          </div>
        </div>

        {flashcards.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Your Flashcards</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Card {currentCard + 1} of {flashcards.length}
                </p>
              </div>

              <div className="max-w-lg mx-auto">
                <FlashcardView flashcard={flashcards[currentCard]} />

                <div className="flex items-center justify-between mt-6 sm:mt-8 gap-2">
                  <button
                    onClick={prevCard}
                    disabled={flashcards.length <= 1}
                    className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 text-sm sm:text-base"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>

                  <div className="text-center hidden sm:block">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Card {currentCard + 1} of {flashcards.length}
                    </p>
                    <div className="flex space-x-1 mt-2">
                        {flashcards.map((_, index) => (
                          <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all ${
                              index === currentCard ? 'bg-indigo-500' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                  </div>

                  <button
                    onClick={nextCard}
                    disabled={flashcards.length <= 1}
                    className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

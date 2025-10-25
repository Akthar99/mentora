'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

interface Flashcard {
  question: string;
  hint: string;
  answer: string;
  concept: string;
}

export default function Flashcards() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [subject, setSubject] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [generating, setGenerating] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const { user } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // Check for documentId in URL params
  useEffect(() => {
    const documentId = searchParams.get('documentId');
    if (documentId && documents.length > 0) {
      const document = documents.find(doc => doc.id === documentId);
      if (document) {
        setSelectedDocument(documentId);
        // Safe document name handling
        const docName = document.name || document.filename || 'Document';
        setSubject(docName.split('.')[0]); // Use document name as subject
      }
    }
  }, [searchParams, documents]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/dashboard/${user?.uid}`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.dashboard.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const generateFlashcards = async () => {
    if (!selectedDocument || !subject || !user) return;

    setGenerating(true);
    try {
      // Find the selected document to get its name
      const selectedDoc = documents.find(doc => doc.id === selectedDocument);
      const documentName = selectedDoc?.name || selectedDoc?.filename || 'document';

      const response = await fetch('http://localhost:8000/api/generate-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          document_name: documentName, // Use actual document name
          subject: subject
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFlashcards(result.flashcards || []);
        } else {
          throw new Error(result.message || 'Failed to generate flashcards');
        }
      } else {
        throw new Error(`HTTP error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      // Fallback sample flashcards
      setFlashcards([
        {
          question: "What is the main topic of this document?",
          hint: "Look for recurring themes and concepts throughout the text",
          answer: "Based on the document content, the main topic appears to be related to the subject matter discussed in the text.",
          concept: "Document Analysis"
        },
        {
          question: "What are the key concepts covered in this material?",
          hint: "Identify the main ideas and important terms mentioned",
          answer: "The document covers several key concepts that form the foundation of the subject matter being discussed.",
          concept: "Key Concepts"
        }
      ]);
    } finally {
      setGenerating(false);
    }
  };

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setShowAnswer(false);
  };

  // Get the selected document name for display
  const selectedDocName = documents.find(doc => doc.id === selectedDocument)?.name || 'Selected Document';

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Generation Form */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Generate Flashcards</h3>
            
            {selectedDocument && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Selected: <span className="font-medium">{selectedDocName}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Document</label>
                <select
                  value={selectedDocument}
                  onChange={(e) => {
                    setSelectedDocument(e.target.value);
                    const selectedDoc = documents.find(doc => doc.id === e.target.value);
                    if (selectedDoc) {
                      // Safe document name handling
                      const docName = selectedDoc.name || selectedDoc.filename || 'Document';
                      setSubject(docName.split('.')[0]);
                    }
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Choose a document</option>
                  {documents.map((doc, index) => (
                    <option key={doc.id || index} value={doc.id}>
                      {doc.name || doc.filename || `Document ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject/Topic</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Computer Science, Biology, History"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This helps AI generate more relevant flashcards
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={generateFlashcards}
                disabled={generating || !selectedDocument || !subject}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Flashcards Display */}
        {flashcards.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Your Flashcards</h3>
                <p className="text-sm text-gray-500">
                  Card {currentCard + 1} of {flashcards.length} • {selectedDocName}
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div 
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-8 min-h-64 cursor-pointer transform transition-transform hover:scale-105"
                  onClick={() => setShowAnswer(!showAnswer)}
                >
                  {!showAnswer ? (
                    <div className="text-center h-full flex flex-col justify-center">
                      <h4 className="text-xl font-semibold text-gray-900 mb-4">
                        {flashcards[currentCard].question}
                      </h4>
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          💡 Hint: {flashcards[currentCard].hint}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-6">Click card to reveal answer</p>
                    </div>
                  ) : (
                    <div className="text-center h-full flex flex-col justify-center">
                      <h4 className="text-xl font-semibold text-green-600 mb-4">Answer</h4>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {flashcards[currentCard].answer}
                      </p>
                      <div className="mt-4 p-2 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Concept: {flashcards[currentCard].concept}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={prevCard}
                    disabled={flashcards.length <= 1}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {showAnswer ? 'Show Question' : 'Show Answer'}
                  </button>
                  <button
                    onClick={nextCard}
                    disabled={flashcards.length <= 1}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-6">
                <div className="flex justify-center space-x-1">
                  {flashcards.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index === currentCard ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
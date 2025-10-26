'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DocumentSelector from '@/components/DocumentSelector';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';
import { Document } from '@/types';

interface Question {
  question: string;
  type: string;
  options?: string[];
  answer: string;
}

export default function QuestionGenerator() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['MCQ', 'explanation']);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generating, setGenerating] = useState(false);
  
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

  const generateQuestions = async () => {
    if (!user || selectedDocumentIds.length === 0) return;

    if (!projectId) {
      alert('Project ID is required. Please access this page from a project.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          session_id: 'default',
          question_types: questionTypes,
          difficulty: difficulty,
          num_questions: numQuestions,
          project_id: projectId,
          document_ids: selectedDocumentIds // NEW: Send selected document IDs
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setQuestions(result.questions || []);
        }
      } else {
        throw new Error('Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleQuestionTypeChange = (type: string) => {
    setQuestionTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleDocumentSelectionChange = (selectedIds: string[]) => {
    setSelectedDocumentIds(selectedIds);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="py-4 sm:py-6">
        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 font-medium text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back
        </button>

        {/* Document Selection */}
        <DocumentSelector 
          documents={documents}
          onSelectionChange={handleDocumentSelectionChange}
          className="mb-6"
        />
        
        {/* Generation Form */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Generate Questions</h3>
            
            {selectedDocumentIds.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Using <span className="font-medium">{selectedDocumentIds.length} selected document(s)</span>
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Questions</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Types</label>
                <div className="space-y-2">
                  {['MCQ', 'explanation', 'definition', 'true_false'].map((type) => (
                    <label key={type} className="inline-flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={questionTypes.includes(type)}
                        onChange={() => handleQuestionTypeChange(type)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={generateQuestions}
                disabled={generating || selectedDocumentIds.length === 0 || questionTypes.length === 0}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating Questions...' : 'Generate Questions'}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Questions */}
        {questions.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Generated Questions</h3>
                <span className="text-sm text-gray-500">{questions.length} questions</span>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-md font-medium text-gray-900">
                        Q{index + 1}: {question.question}
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {question.type}
                      </span>
                    </div>

                    {question.options && (
                      <div className="ml-4 mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {question.options.map((option, optIndex) => (
                            <li key={optIndex}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 mb-1">Answer:</p>
                      <p className="text-sm text-green-700">{question.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
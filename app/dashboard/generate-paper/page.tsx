'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, Edit2, Save, FileText, Download, Eye, GripVertical, X, Settings } from 'lucide-react';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';
import DocumentSelector from '@/components/DocumentSelector';
import { Document } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Question {
  id: string;
  question: string;
  type: 'MCQ' | 'Yes/No' | 'Text Answer';
  options?: string[];
  answer?: string;
  marks: number;
}

interface ExamSettings {
  subject: string;
  gradeLevel: string;
  duration: number;
  totalMarks: number;
  institutionName: string;
  examType: string;
  studentName?: string;
  studentId?: string;
  batch?: string;
}

export default function GeneratePaperPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const projectId = searchParams.get('projectId');
  const paperId = searchParams.get('paperId'); // Get paperId if editing existing paper

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null); // Track which paper is being edited

  // Question generation options
  const [selectedQuestionType, setSelectedQuestionType] = useState<'MCQ' | 'Yes/No' | 'Text Answer'>('MCQ');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const [settings, setSettings] = useState<ExamSettings>({
    subject: '',
    gradeLevel: 'HND',
    duration: 2,
    totalMarks: 100,
    institutionName: 'National Institute of Business Management',
    examType: 'MCE EXAMINATION',
    studentName: '',
    studentId: '',
    batch: '',
  });

  useEffect(() => {
    if (user && projectId) {
      fetchProjectDocuments();
      
      // Load existing paper if paperId is provided
      if (paperId) {
        loadExistingPaper(paperId);
      }
    }
  }, [user, projectId, paperId]);

  const loadExistingPaper = async (id: string) => {
    setLoadingPaper(true);
    try {
      const paperRef = doc(db, 'examPapers', id);
      const paperSnap = await getDoc(paperRef);

      if (paperSnap.exists()) {
        const paperData = paperSnap.data();
        
        // Verify user owns this paper
        if (paperData.userId !== user?.uid) {
          alert('You do not have permission to edit this paper');
          router.push(`/dashboard/papers?projectId=${projectId}`);
          return;
        }

        // Load the paper data into the form
        setSettings(paperData.settings);
        setQuestions(paperData.questions || []);
        setCurrentPaperId(id);
        
        console.log('Loaded existing paper:', id);
      } else {
        alert('Exam paper not found');
        router.push(`/dashboard/papers?projectId=${projectId}`);
      }
    } catch (error) {
      console.error('Error loading paper:', error);
      alert('Error loading exam paper');
    } finally {
      setLoadingPaper(false);
    }
  };

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

  const handleDocumentSelectionChange = (selectedIds: string[]) => {
    setSelectedDocumentIds(selectedIds);
  };

  // Generate initial questions
  const handleGenerateQuestions = async () => {
    if (!projectId || !user || selectedDocumentIds.length === 0) {
      alert('Please select at least one document to generate questions');
      return;
    }

    setGenerating(true);
    try {
      // Map frontend question types to API types
      const apiQuestionType = selectedQuestionType === 'MCQ' ? 'multiple_choice' 
        : selectedQuestionType === 'Yes/No' ? 'yes_no' 
        : 'text_answer';

      console.log('Generating questions with:', {
        questionType: selectedQuestionType,
        apiQuestionType,
        difficulty,
        numQuestions,
        selectedDocuments: selectedDocumentIds.length
      });

      const response = await fetch('http://localhost:8000/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          session_id: 'default',
          question_types: [apiQuestionType],
          difficulty: difficulty,
          num_questions: numQuestions,
          project_id: projectId,
          document_ids: selectedDocumentIds,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.success && result.questions) {
          console.log('Raw questions from API:', result.questions);
          
          const formattedQuestions: Question[] = result.questions.map((q: any, idx: number) => {
            // Determine the question type - handle both API formats
            let questionType: 'MCQ' | 'Yes/No' | 'Text Answer';
            
            // Check if type is already in our format or needs mapping
            if (q.type === 'MCQ' || q.type === 'multiple_choice') {
              questionType = 'MCQ';
            } else if (q.type === 'Yes/No' || q.type === 'yes_no') {
              questionType = 'Yes/No';
            } else {
              questionType = 'Text Answer';
            }
            
            // Ensure MCQ questions have proper options
            let options: string[] | undefined = undefined;
            if (questionType === 'MCQ') {
              // If API returned options, use them; otherwise create empty ones
              if (q.options && Array.isArray(q.options) && q.options.length > 0) {
                options = q.options;
              } else {
                // Create 4 empty options if none provided
                options = ['', '', '', ''];
              }
            }
            
            console.log(`Question ${idx + 1}:`, {
              rawType: q.type,
              mappedType: questionType,
              hasOptions: !!options,
              optionsCount: options?.length,
              question: q.question?.substring(0, 50) + '...'
            });
            
            return {
              id: `q-${Date.now()}-${idx}`,
              question: q.question || '',
              type: questionType,
              options: options,
              answer: q.answer || '',
              marks: questionType === 'MCQ' ? 3 : questionType === 'Yes/No' ? 2 : 5,
            };
          });
          
          console.log('Formatted questions:', formattedQuestions);
          
          // Append new questions instead of replacing
          setQuestions(prev => [...prev, ...formattedQuestions]);
        } else {
          alert('No questions were generated. Please try again.');
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to generate questions'}`);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions');
    } finally {
      setGenerating(false);
    }
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };


  // Add new question
  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      question: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      answer: '',
      marks: 3,
    };
    setQuestions([...questions, newQuestion]);
    setEditingId(newQuestion.id);
  };

  // Update question
  const handleUpdateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  // Update option
  const handleUpdateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    if (confirm('Delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  // Add option to MCQ
  const handleAddOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  // Remove option from MCQ
  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options && q.options.length > 2) {
        const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  // Save paper to Firebase
  const handleSavePaper = async () => {
    if (!projectId || !user) {
      alert('Please ensure you are logged in and have a project selected');
      console.error('Save failed - projectId:', projectId, 'user:', user);
      return;
    }

    if (!settings.subject) {
      alert('Please set the subject in exam settings');
      return;
    }

    if (questions.length === 0) {
      alert('Please generate or add at least one question before saving');
      return;
    }

    setSaving(true);
    try {
      // Ensure all questions have required fields
      const validatedQuestions = questions.map(q => ({
        ...q,
        marks: q.marks || 0,
        question: q.question || '',
        answer: q.answer || '',
        options: q.options || [],
      }));

      const paperData = {
        projectId,
        userId: user.uid,
        settings,
        questions: validatedQuestions,
        updatedAt: new Date().toISOString(),
      };

      console.log('Attempting to save paper:', {
        userId: user.uid,
        projectId,
        questionCount: validatedQuestions.length,
        subject: settings.subject,
        isUpdate: !!currentPaperId
      });

      if (currentPaperId) {
        // Update existing paper
        const paperRef = doc(db, 'examPapers', currentPaperId);
        await updateDoc(paperRef, paperData);
        alert('Exam paper updated successfully!');
      } else {
        // Create new paper
        const newPaperData = {
          ...paperData,
          createdAt: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, 'examPapers'), newPaperData);
        setCurrentPaperId(docRef.id);
        alert('Exam paper saved successfully!');
      }
    } catch (error) {
      console.error('Error saving paper:', error);
      alert(`Error saving paper: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculate statistics
  const stats = {
    multipleChoice: questions.filter(q => q.type === 'MCQ').length,
    textAnswer: questions.filter(q => q.type === 'Text Answer').length,
    yesNo: questions.filter(q => q.type === 'Yes/No').length,
    totalMarks: questions.reduce((sum, q) => sum + (q.marks || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-700 hover:text-gray-900 mb-4 flex items-center gap-2 font-medium text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {currentPaperId ? 'Edit Exam Paper' : 'AI Question Generator'}
              </h1>
              <p className="text-sm sm:text-base text-gray-700 mt-1 font-medium">
                {currentPaperId 
                  ? 'Edit and update your saved exam paper' 
                  : 'Generate quiz questions from your syllabus content using AI'
                }
              </p>
              {loadingPaper && (
                <p className="text-blue-600 text-xs sm:text-sm mt-1 flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Loading paper...
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm sm:text-base flex-1 sm:flex-none"
              >
                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Exam Settings</span>
                <span className="sm:hidden">Settings</span>
              </button>
              <button
                onClick={handleSavePaper}
                disabled={saving || questions.length === 0}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium text-sm sm:text-base flex-1 sm:flex-none"
              >
                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {saving 
                    ? (currentPaperId ? 'Updating...' : 'Saving...') 
                    : (currentPaperId ? 'Update Paper' : 'Save Paper')
                  }
                </span>
                <span className="sm:hidden">
                  {saving ? '...' : 'Save'}
                </span>
              </button>
              <button
                onClick={() => setShowPreview(true)}
                disabled={questions.length === 0}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm sm:text-base flex-1 sm:flex-none"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Preview Exam</span>
                <span className="sm:hidden">Preview</span>
              </button>
              <button
                onClick={() => setShowAnswerSheet(true)}
                disabled={questions.length === 0}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium text-sm sm:text-base flex-1 sm:flex-none"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">View Answer Sheet</span>
                <span className="sm:hidden">Answers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Selection */}
        <div className="mb-4 sm:mb-6">
          <DocumentSelector 
            documents={documents}
            onSelectionChange={handleDocumentSelectionChange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Left Sidebar - Generator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Input Syllabus Content</h2>
              
              {selectedDocumentIds.length > 0 && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-700 font-medium">
                    Using {selectedDocumentIds.length} selected document(s)
                  </p>
                </div>
              )}
              
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                  Subject/Topic
                </label>
                <input
                  type="text"
                  value={settings.subject}
                  onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                  placeholder="e.g., Cell Biology, Photosynthesis"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 font-medium"
                />
              </div>

              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">
                  Question Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-2 sm:p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="questionType"
                      value="MCQ"
                      checked={selectedQuestionType === 'MCQ'}
                      onChange={(e) => setSelectedQuestionType(e.target.value as 'MCQ')}
                      className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-900">Multiple Choice <span className="hidden sm:inline">Questions (MCQ)</span></span>
                  </label>
                  <label className="flex items-center p-2 sm:p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="questionType"
                      value="Yes/No"
                      checked={selectedQuestionType === 'Yes/No'}
                      onChange={(e) => setSelectedQuestionType(e.target.value as 'Yes/No')}
                      className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-900">Yes/No <span className="hidden sm:inline">Questions</span></span>
                  </label>
                  <label className="flex items-center p-2 sm:p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="questionType"
                      value="Text Answer"
                      checked={selectedQuestionType === 'Text Answer'}
                      onChange={(e) => setSelectedQuestionType(e.target.value as 'Text Answer')}
                      className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-900">Text Answer <span className="hidden sm:inline">Questions</span></span>
                  </label>
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                  min="1"
                  max="50"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 font-medium"
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                  Difficulty Level
                </label>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => setDifficulty('beginner')}
                    className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium ${
                      difficulty === 'beginner'
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Beginner
                  </button>
                  <button
                    onClick={() => setDifficulty('intermediate')}
                    className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium ${
                      difficulty === 'intermediate'
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="hidden sm:inline">Intermediate</span>
                    <span className="sm:hidden">Inter</span>
                  </button>
                  <button
                    onClick={() => setDifficulty('advanced')}
                    className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium ${
                      difficulty === 'advanced'
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Advanced
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateQuestions}
                disabled={generating || selectedDocumentIds.length === 0 || !settings.subject}
                className="w-full bg-blue-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium mb-3 text-sm sm:text-base"
              >
                <Edit2 className="w-4 h-4" />
                {generating ? 'Generating...' : questions.length > 0 ? 'Generate More' : 'Generate Questions'}
              </button>

              {/* Statistics */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Question Statistics</h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium"><span className="hidden sm:inline">Multiple Choice:</span><span className="sm:hidden">MCQ:</span></span>
                    <span className="font-semibold text-gray-900">{stats.multipleChoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Text Answer:</span>
                    <span className="font-semibold text-gray-900">{stats.textAnswer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Essay:</span>
                    <span className="font-semibold text-gray-900">{stats.yesNo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Questions List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-2 gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  <span className="hidden sm:inline">Generated Questions</span>
                  <span className="sm:hidden">Questions</span>
                  {questions.length > 0 && (
                    <span className="ml-2 text-xs sm:text-sm font-normal text-green-600">
                      ● {questions.length} <span className="hidden sm:inline">questions </span>generated
                    </span>
                  )}
                </h2>
                <button
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Add New Question</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
              
              {questions.length > 0 && (
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  <span className="hidden sm:inline">Drag the grip icon to reorder questions</span>
                  <span className="sm:hidden">Drag to reorder</span>
                </p>
              )}

              {questions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    <span className="hidden sm:inline">Generate questions using AI or add them manually</span>
                    <span className="sm:hidden">Generate or add questions</span>
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={questions.map(q => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 sm:space-y-4 pl-6 sm:pl-8">
                      {questions.map((question, index) => (
                        <SortableQuestionCard
                          key={question.id}
                          question={question}
                          index={index}
                          isEditing={editingId === question.id}
                          onEdit={() => setEditingId(question.id)}
                          onSave={() => setEditingId(null)}
                          onDelete={() => handleDeleteQuestion(question.id)}
                          onUpdate={handleUpdateQuestion}
                          onUpdateOption={handleUpdateOption}
                          onAddOption={handleAddOption}
                          onRemoveOption={handleRemoveOption}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {questions.length > 0 && (
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Preview Exam</span>
                  <span className="sm:hidden">Preview</span>
                </button>
                <button
                  onClick={() => setShowAnswerSheet(true)}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 text-sm sm:text-base"
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">View Answer Sheet</span>
                  <span className="sm:hidden">Answers</span>
                </button>
                <button
                  onClick={handleGenerateQuestions}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Generate More Questions</span>
                  <span className="sm:hidden">Generate More</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exam Settings Modal */}
      {showSettings && (
        <ExamSettingsModal
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          settings={settings}
          questions={questions}
          onClose={() => setShowPreview(false)}
          onSave={handleSavePaper}
          currentPaperId={currentPaperId}
          saving={saving}
        />
      )}

      {/* Answer Sheet Modal */}
      {showAnswerSheet && (
        <AnswerSheetModal
          settings={settings}
          questions={questions}
          onClose={() => setShowAnswerSheet(false)}
        />
      )}
    </div>
  );
}

// Question Card Component
// Sortable Question Card Wrapper
function SortableQuestionCard(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-0 top-4 -ml-8 cursor-move" {...attributes} {...listeners}>
        <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
      </div>
      <QuestionCard {...props} />
    </div>
  );
}

// Question Card Component
function QuestionCard({
  question,
  index,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onUpdate,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
}: any) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs sm:text-sm">
            {index + 1}
          </div>
          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
            question.type === 'MCQ' 
              ? 'bg-blue-100 text-blue-700'
              : question.type === 'Yes/No'
              ? 'bg-green-100 text-green-700'
              : 'bg-purple-100 text-purple-700'
          }`}>
            {question.type}
          </span>
        </div>
        <div className="flex gap-1 sm:gap-2">
          {isEditing ? (
            <button
              onClick={onSave}
              className="text-green-600 hover:text-green-700 p-1"
            >
              <Save className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onEdit}
              className="text-gray-600 hover:text-gray-900 p-1"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3 sm:space-y-4">
          <textarea
            value={question.question}
            onChange={(e) => onUpdate(question.id, 'question', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900"
            rows={3}
            placeholder="Enter question..."
          />

          {question.type === 'MCQ' && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Options</label>
              {question.options?.map((option: string, idx: number) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => onUpdateOption(question.id, idx, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900"
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                  {question.options.length > 2 && (
                    <button
                      onClick={() => onRemoveOption(question.id, idx)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => onAddOption(question.id)}
                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center gap-1 mb-3"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>

              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
              <input
                type="text"
                value={question.answer || ''}
                onChange={(e) => onUpdate(question.id, 'answer', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900"
                placeholder="Enter the correct answer (e.g., A, B, C, or full option text)"
              />
            </div>
          )}

          {question.type === 'Yes/No' && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => onUpdate(question.id, 'answer', 'Yes')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-lg border-2 text-sm sm:text-base ${
                    question.answer === 'Yes'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => onUpdate(question.id, 'answer', 'No')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-lg border-2 text-sm sm:text-base ${
                    question.answer === 'No'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          )}

          {question.type === 'Text Answer' && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Expected Answer (Optional)
              </label>
              <textarea
                value={question.answer || ''}
                onChange={(e) => onUpdate(question.id, 'answer', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900"
                rows={3}
                placeholder="Expected answer..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Marks</label>
            <input
              type="number"
              value={question.marks}
              onChange={(e) => onUpdate(question.id, 'marks', parseInt(e.target.value))}
              className="w-20 sm:w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900"
              min="1"
            />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm sm:text-base text-gray-900 mb-2 sm:mb-3 font-medium">{question.question}</p>
          
          {question.type === 'MCQ' && question.options && (
            <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
              {question.options.map((option: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-gray-600 font-medium">
                    {String.fromCharCode(65 + idx)})
                  </span>
                  <span className="text-gray-700">{option}</span>
                </div>
              ))}
            </div>
          )}

          {question.type === 'Yes/No' && (
            <div className="flex gap-2 mb-2 sm:mb-3">
              <span className="px-2 sm:px-3 py-1 border border-gray-300 text-gray-700 rounded text-xs sm:text-sm">✓ Yes</span>
              <span className="px-2 sm:px-3 py-1 border border-gray-300 text-gray-700 rounded text-xs sm:text-sm">○ No</span>
            </div>
          )}

          {/* Display Answer */}
          {question.answer && (
            <div className="bg-green-50 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-green-200">
              <p className="text-xs sm:text-sm font-semibold text-green-800 mb-1">Answer:</p>
              <p className="text-xs sm:text-sm text-green-700 font-medium">{question.answer}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
            <span className="font-medium">Marks: {question.marks}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Exam Settings Modal Component
function ExamSettingsModal({ settings, onUpdate, onClose }: any) {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Exam Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1">Subject</label>
              <input
                type="text"
                value={localSettings.subject}
                onChange={(e) => setLocalSettings({ ...localSettings, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 font-medium"
                placeholder="Mathematics for Computing"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1">Grade Level</label>
              <input
                type="text"
                value={localSettings.gradeLevel}
                onChange={(e) => setLocalSettings({ ...localSettings, gradeLevel: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 font-medium"
                placeholder="HND, Degree, Masters, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1">Institution Name</label>
            <input
              type="text"
              value={localSettings.institutionName}
              onChange={(e) => setLocalSettings({ ...localSettings, institutionName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1">Exam Type</label>
            <input
              type="text"
              value={localSettings.examType}
              onChange={(e) => setLocalSettings({ ...localSettings, examType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 font-medium"
              placeholder="MCE EXAMINATION, Final Exam, Midterm, etc."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1">Duration (hours)</label>
              <input
                type="number"
                value={localSettings.duration}
                onChange={(e) => setLocalSettings({ ...localSettings, duration: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 font-medium"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1">Total Marks</label>
              <input
                type="number"
                value={localSettings.totalMarks}
                onChange={(e) => setLocalSettings({ ...localSettings, totalMarks: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 font-medium"
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onUpdate(localSettings);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// Preview Modal Component
function PreviewModal({ settings, questions, onClose, onSave, currentPaperId, saving }: any) {
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // Auto-save if not already saved
      if (!currentPaperId && onSave) {
        await onSave();
      }
      
      // Short delay to ensure state updates
      setTimeout(() => {
        window.print();
        setExporting(false);
      }, 500);
    } catch (error) {
      console.error('Error during export:', error);
      alert('Failed to save paper before export');
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #examPaper, #examPaper * {
              visibility: visible;
            }
            #examPaper {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            #examPaper, #examPaper * {
              color: #000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #examPaper .border-gray-900 {
              border-color: #000 !important;
            }
            #examPaper .border-gray-400 {
              border-color: #666 !important;
            }
          }
        `
      }} />
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Exam Paper Preview</h2>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              disabled={exporting || saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting || saving ? 'Saving & Exporting...' : 'Export as PDF'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50" id="examPaper">
          <div className="bg-white p-12 shadow-lg max-w-[210mm] mx-auto text-gray-900" style={{ minHeight: '297mm' }}>
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
              <h1 className="text-2xl font-bold mb-2 text-gray-900">{settings.institutionName}</h1>
              <h2 className="text-lg font-semibold mb-2 text-gray-900">{settings.examType}</h2>
              <h3 className="text-md font-semibold text-gray-900">{settings.subject} - Semester 1</h3>
            </div>

            {/* Exam Details */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-900">
              <div>
                <div className="mb-2"><strong className="text-gray-900">Date:</strong> _______________</div>
                <div className="mb-2"><strong className="text-gray-900">Time:</strong> {settings.duration} hours</div>
                <div className="mb-2"><strong className="text-gray-900">Total Marks:</strong> {settings.totalMarks}</div>
              </div>
              <div>
                <div className="mb-2"><strong className="text-gray-900">Student Name:</strong> _______________</div>
                <div className="mb-2"><strong className="text-gray-900">Student ID:</strong> _______________</div>
                <div className="mb-2"><strong className="text-gray-900">Batch:</strong> _______________</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold mb-2 text-gray-900">INSTRUCTIONS:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-900">
                <li>Answer ALL questions in the spaces provided</li>
                <li>Show all your working clearly</li>
                <li>Use a calculator where necessary</li>
                <li>Write all answers in pen (blue or black ink only)</li>
                <li>Read all questions carefully before answering</li>
              </ul>
            </div>

            {/* Questions by Section */}
            {['MCQ', 'Text Answer', 'Yes/No'].map((type) => {
              const sectionQuestions = questions.filter((q: Question) => q.type === type);
              if (sectionQuestions.length === 0) return null;

              const sectionMarks = sectionQuestions.reduce((sum: number, q: Question) => sum + (q.marks || 0), 0);
              const sectionTitle = 
                type === 'MCQ' ? 'MULTIPLE CHOICE QUESTIONS' :
                type === 'Yes/No' ? 'TRUE/FALSE QUESTIONS' :
                'SHORT ANSWER QUESTIONS';

              return (
                <div key={type} className="mb-8">
                  <h4 className="font-bold text-lg mb-4 text-gray-900">
                    SECTION {type === 'MCQ' ? 'A' : type === 'Text Answer' ? 'B' : 'C'}: {sectionTitle} ({sectionMarks} marks)
                  </h4>
                  <p className="text-sm mb-4 italic text-gray-900">Choose the correct answer and circle the letter</p>

                  {sectionQuestions.map((question: Question, idx: number) => (
                    <div key={question.id} className="mb-6">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="mb-3 text-gray-900">{question.question} <strong className="text-gray-900">[{question.marks} marks]</strong></p>
                          
                          {question.type === 'MCQ' && question.options && (
                            <div className="space-y-2 ml-4 text-gray-900">
                              {question.options.map((option: string, optIdx: number) => (
                                <div key={optIdx}>
                                  <strong className="text-gray-900">{String.fromCharCode(65 + optIdx)})</strong> {option}
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === 'Yes/No' && (
                            <div className="ml-4 space-x-6 text-gray-900">
                              <span>○ Yes</span>
                              <span>○ No</span>
                            </div>
                          )}

                          {question.type === 'Text Answer' && (
                            <div className="mt-2 space-y-2">
                              <div className="border-b border-gray-400 h-6"></div>
                              <div className="border-b border-gray-400 h-6"></div>
                              <div className="border-b border-gray-400 h-6"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t-2 border-gray-900 text-center text-sm text-gray-900">
              <p className="text-gray-900 font-semibold">END OF EXAMINATION</p>
              <p className="mt-2 text-gray-900">Page 1 of 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Answer Sheet Modal Component
function AnswerSheetModal({ settings, questions, onClose }: any) {
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #answerSheet, #answerSheet * {
              visibility: visible;
            }
            #answerSheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            #answerSheet, #answerSheet * {
              color: #000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #answerSheet .border-gray-900 {
              border-color: #000 !important;
            }
            #answerSheet .bg-green-50 {
              background-color: #f0fdf4 !important;
            }
            #answerSheet .border-green-600 {
              border-color: #16a34a !important;
            }
            #answerSheet .bg-yellow-50 {
              background-color: #fefce8 !important;
            }
            #answerSheet .border-yellow-400 {
              border-color: #facc15 !important;
            }
          }
        `
      }} />
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Answer Sheet Preview</h2>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export Answer Sheet
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50" id="answerSheet">
          <div className="bg-white p-12 shadow-lg max-w-[210mm] mx-auto text-gray-900" style={{ minHeight: '297mm' }}>
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
              <h1 className="text-2xl font-bold mb-2 text-gray-900">{settings.institutionName}</h1>
              <h2 className="text-lg font-semibold mb-2 text-gray-900">{settings.examType} - ANSWER SHEET</h2>
              <h3 className="text-md font-semibold text-gray-900">{settings.subject} - Semester 1</h3>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 rounded border border-yellow-400">
              <p className="text-sm font-semibold text-gray-900">⚠️ FOR EXAMINER USE ONLY</p>
              <p className="text-xs text-gray-900 mt-1">This page contains the correct answers for grading purposes.</p>
            </div>

            {/* Answers by Section */}
            {['MCQ', 'Text Answer', 'Yes/No'].map((type) => {
              const sectionQuestions = questions.filter((q: Question) => q.type === type);
              if (sectionQuestions.length === 0) return null;

              const sectionMarks = sectionQuestions.reduce((sum: number, q: Question) => sum + (q.marks || 0), 0);
              const sectionTitle = 
                type === 'MCQ' ? 'MULTIPLE CHOICE QUESTIONS' :
                type === 'Yes/No' ? 'TRUE/FALSE QUESTIONS' :
                'SHORT ANSWER QUESTIONS';

              return (
                <div key={type} className="mb-8">
                  <h4 className="font-bold text-lg mb-4 text-gray-900">
                    SECTION {type === 'MCQ' ? 'A' : type === 'Text Answer' ? 'B' : 'C'}: {sectionTitle} ({sectionMarks} marks)
                  </h4>

                  {sectionQuestions.map((question: Question, idx: number) => (
                    <div key={question.id} className="mb-4 p-4 bg-green-50 rounded border border-green-600">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="mb-2 text-gray-900 font-medium">{question.question}</p>
                          
                          {question.type === 'MCQ' && question.options && question.answer && (
                            <div className="text-gray-900">
                              <p className="font-bold text-green-700">
                                Correct Answer: {question.answer}
                              </p>
                              <div className="mt-2 text-sm space-y-1">
                                {question.options.map((option: string, optIdx: number) => {
                                  const optionLetter = String.fromCharCode(65 + optIdx);
                                  const isCorrect = question.answer?.includes(optionLetter) || question.answer === option;
                                  return (
                                    <div key={optIdx} className={isCorrect ? 'font-bold text-green-700' : ''}>
                                      {optionLetter}) {option}
                                      {isCorrect && ' ✓'}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {question.type === 'Yes/No' && (
                            <p className="font-bold text-green-700">
                              Correct Answer: {question.answer || 'N/A'}
                            </p>
                          )}

                          {question.type === 'Text Answer' && (
                            <div className="text-gray-900">
                              <p className="font-semibold mb-1">Model Answer:</p>
                              <p className="text-sm bg-white p-2 rounded border border-green-400">
                                {question.answer || 'N/A'}
                              </p>
                            </div>
                          )}

                          <p className="text-sm text-gray-600 mt-2">
                            Marks: {question.marks}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t-2 border-gray-900 text-center text-sm text-gray-900">
              <p className="text-gray-900 font-semibold">END OF ANSWER SHEET</p>
              <p className="mt-2 text-gray-900">Page 1 of 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

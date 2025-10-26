'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';
import { FileText, Eye, Trash2, Download, Calendar, BookOpen, Edit2 } from 'lucide-react';
import Link from 'next/link';

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
}

interface ExamPaper {
  id: string;
  projectId: string;
  userId: string;
  settings: ExamSettings;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export default function SavedPapersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const projectId = searchParams.get('projectId');

  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);

  useEffect(() => {
    if (user && projectId) {
      fetchPapers();
    }
  }, [user, projectId]);

  const fetchPapers = async () => {
    if (!user || !projectId) return;

    setLoading(true);
    try {
      const papersRef = collection(db, 'examPapers');
      const q = query(
        papersRef,
        where('userId', '==', user.uid),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedPapers: ExamPaper[] = [];

      querySnapshot.forEach((doc) => {
        fetchedPapers.push({
          id: doc.id,
          ...doc.data(),
        } as ExamPaper);
      });

      setPapers(fetchedPapers);
    } catch (error) {
      console.error('Error fetching papers:', error);
      alert('Error loading exam papers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this exam paper? This action cannot be undone.')) {
      return;
    }

    setDeleting(paperId);
    try {
      await deleteDoc(doc(db, 'examPapers', paperId));
      setPapers(papers.filter(p => p.id !== paperId));
      alert('Exam paper deleted successfully');
    } catch (error) {
      console.error('Error deleting paper:', error);
      alert('Error deleting exam paper');
    } finally {
      setDeleting(null);
    }
  };

  const handleView = (paperId: string) => {
    router.push(`/dashboard/papers/${paperId}`);
  };

  const handleViewAnswerSheet = (paper: ExamPaper) => {
    setSelectedPaper(paper);
    setShowAnswerSheet(true);
  };

  const calculateStats = (questions: Question[]) => {
    return {
      total: questions.length,
      mcq: questions.filter(q => q.type === 'MCQ').length,
      yesNo: questions.filter(q => q.type === 'Yes/No').length,
      textAnswer: questions.filter(q => q.type === 'Text Answer').length,
      totalMarks: questions.reduce((sum, q) => sum + (q.marks || 0), 0),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-700 hover:text-gray-900 mb-4 flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Saved Exam Papers</h1>
              <p className="text-gray-600 mt-2">View and manage your generated exam papers</p>
            </div>
            <Link
              href={`/dashboard/generate-paper?projectId=${projectId}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <FileText className="w-5 h-5" />
              Generate New Paper
            </Link>
          </div>
        </div>

        {/* Papers List */}
        {papers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exam papers yet</h3>
            <p className="text-gray-600 mb-6">
              Generate your first exam paper to get started
            </p>
            <Link
              href={`/dashboard/generate-paper?projectId=${projectId}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              <FileText className="w-5 h-5" />
              Generate Exam Paper
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {papers.map((paper) => {
              const stats = calculateStats(paper.questions);
              return (
                <div
                  key={paper.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                >
                  {/* Paper Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {paper.settings.subject}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {paper.settings.institutionName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {paper.settings.examType} • {paper.settings.gradeLevel}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(paper.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleViewAnswerSheet(paper)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="View Answer Sheet"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/generate-paper?projectId=${paper.projectId}&paperId=${paper.id}`)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(paper.id)}
                        disabled={deleting === paper.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Marks</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Duration</p>
                      <p className="text-lg font-semibold text-gray-900">{paper.settings.duration} hours</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Question Types</p>
                      <div className="flex gap-1 flex-wrap">
                        {stats.mcq > 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            MCQ: {stats.mcq}
                          </span>
                        )}
                        {stats.yesNo > 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Y/N: {stats.yesNo}
                          </span>
                        )}
                        {stats.textAnswer > 0 && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Text: {stats.textAnswer}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(paper.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <button
                      onClick={() => handleView(paper.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Answer Sheet Modal */}
      {showAnswerSheet && selectedPaper && (
        <AnswerSheetModal
          settings={selectedPaper.settings}
          questions={selectedPaper.questions}
          onClose={() => {
            setShowAnswerSheet(false);
            setSelectedPaper(null);
          }}
        />
      )}
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
              const sectionQuestions = questions.filter((q: any) => q.type === type);
              if (sectionQuestions.length === 0) return null;

              const sectionMarks = sectionQuestions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);
              const sectionTitle = 
                type === 'MCQ' ? 'MULTIPLE CHOICE QUESTIONS' :
                type === 'Yes/No' ? 'TRUE/FALSE QUESTIONS' :
                'SHORT ANSWER QUESTIONS';

              return (
                <div key={type} className="mb-8">
                  <h4 className="font-bold text-lg mb-4 text-gray-900">
                    SECTION {type === 'MCQ' ? 'A' : type === 'Text Answer' ? 'B' : 'C'}: {sectionTitle} ({sectionMarks} marks)
                  </h4>

                  {sectionQuestions.map((question: any, idx: number) => (
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

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';
import { Download, Edit2, Trash2, ArrowLeft } from 'lucide-react';

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

interface ExamPaper {
  id: string;
  projectId: string;
  userId: string;
  settings: ExamSettings;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export default function ViewPaperPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const paperId = params.id as string;

  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user && paperId) {
      fetchPaper();
    }
  }, [user, paperId]);

  const fetchPaper = async () => {
    if (!user || !paperId) return;

    setLoading(true);
    try {
      const paperRef = doc(db, 'examPapers', paperId);
      const paperSnap = await getDoc(paperRef);

      if (paperSnap.exists()) {
        const paperData = {
          id: paperSnap.id,
          ...paperSnap.data(),
        } as ExamPaper;

        // Check if user owns this paper
        if (paperData.userId !== user.uid) {
          alert('You do not have permission to view this paper');
          router.back();
          return;
        }

        setPaper(paperData);
      } else {
        alert('Exam paper not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching paper:', error);
      alert('Error loading exam paper');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (paper) {
      // Navigate back to generate-paper page with the paper data
      router.push(`/dashboard/generate-paper?projectId=${paper.projectId}`);
    }
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

  if (!paper) {
    return null;
  }

  const stats = {
    mcq: paper.questions.filter(q => q.type === 'MCQ').length,
    yesNo: paper.questions.filter(q => q.type === 'Yes/No').length,
    textAnswer: paper.questions.filter(q => q.type === 'Text Answer').length,
    totalMarks: paper.questions.reduce((sum, q) => sum + (q.marks || 0), 0),
  };

  return (
    <>
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
            .no-print {
              display: none !important;
            }
          }
        `
      }} />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header - No Print */}
          <div className="mb-6 no-print">
            <button
              onClick={() => router.back()}
              className="text-gray-700 hover:text-gray-900 mb-4 flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Saved Papers
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{paper.settings.subject}</h1>
                <p className="text-gray-600 mt-1">
                  Created on {new Date(paper.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Download className="w-5 h-5" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Stats - No Print */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900">{paper.questions.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Marks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMarks}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="text-3xl font-bold text-gray-900">{paper.settings.duration}h</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Question Types</p>
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-gray-700">MCQ: {stats.mcq}</span>
                <span className="text-gray-700">Y/N: {stats.yesNo}</span>
                <span className="text-gray-700">Text: {stats.textAnswer}</span>
              </div>
            </div>
          </div>

          {/* Exam Paper Preview */}
          <div className="bg-gray-50 p-8" id="examPaper">
            <div className="bg-white p-12 shadow-lg max-w-[210mm] mx-auto text-gray-900" style={{ minHeight: '297mm' }}>
              {/* Header */}
              <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
                <h1 className="text-2xl font-bold mb-2 text-gray-900">{paper.settings.institutionName}</h1>
                <h2 className="text-lg font-semibold mb-2 text-gray-900">{paper.settings.examType}</h2>
                <h3 className="text-md font-semibold text-gray-900">{paper.settings.subject} - Semester 1</h3>
              </div>

              {/* Exam Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-900">
                <div>
                  <div className="mb-2"><strong className="text-gray-900">Date:</strong> _______________</div>
                  <div className="mb-2"><strong className="text-gray-900">Time:</strong> {paper.settings.duration} hours</div>
                  <div className="mb-2"><strong className="text-gray-900">Total Marks:</strong> {stats.totalMarks}</div>
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
                const sectionQuestions = paper.questions.filter((q: Question) => q.type === type);
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
                    <p className="text-sm mb-4 italic text-gray-900">
                      {type === 'MCQ' && 'Choose the correct answer and circle the letter'}
                      {type === 'Yes/No' && 'Circle the correct answer'}
                      {type === 'Text Answer' && 'Answer the following questions in the space provided'}
                    </p>

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
    </>
  );
}

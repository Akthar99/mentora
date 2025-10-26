'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface GradingResult {
  scores: Record<string, { score: number; max_score: number; feedback: string }>;
  total_score: number;
  max_total_score: number;
  percentage: number;
}

export default function PaperGrader() {
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [answerKey, setAnswerKey] = useState<Record<string, string>>({});
  const [rubric, setRubric] = useState<Record<string, any>>({});
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [grading, setGrading] = useState(false);
  const router = useRouter();

  const addQuestion = () => {
    const questionId = `q${Object.keys(studentAnswers).length + 1}`;
    setStudentAnswers(prev => ({ ...prev, [questionId]: '' }));
    setAnswerKey(prev => ({ ...prev, [questionId]: '' }));
    setRubric(prev => ({
      ...prev,
      [questionId]: {
        max_score: 10,
        keywords: ['key', 'concept', 'important']
      }
    }));
  };

  const gradePaper = async () => {
    setGrading(true);
    try {
      const response = await fetch('http://localhost:8000/api/grade-paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user_123',
          student_answers: studentAnswers,
          answer_key: answerKey,
          rubric: rubric
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGradingResult(result.results);
      }
    } catch (error) {
      console.error('Error grading paper:', error);
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-gray-900 mb-6 flex items-center gap-2 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Paper Grader</h3>
              <button
                onClick={addQuestion}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add Question
              </button>
            </div>

            {/* Questions Input */}
            <div className="space-y-6">
              {Object.keys(studentAnswers).map((questionId) => (
                <div key={questionId} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">{questionId.toUpperCase()}</h4>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Student Answer</label>
                      <textarea
                        value={studentAnswers[questionId]}
                        onChange={(e) => setStudentAnswers(prev => ({
                          ...prev,
                          [questionId]: e.target.value
                        }))}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                        placeholder="Enter student's answer..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Answer Key</label>
                      <textarea
                        value={answerKey[questionId]}
                        onChange={(e) => setAnswerKey(prev => ({
                          ...prev,
                          [questionId]: e.target.value
                        }))}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                        placeholder="Enter correct answer..."
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Score</label>
                      <input
                        type="number"
                        value={rubric[questionId]?.max_score || 10}
                        onChange={(e) => setRubric(prev => ({
                          ...prev,
                          [questionId]: {
                            ...prev[questionId],
                            max_score: parseInt(e.target.value)
                          }
                        }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Keywords (comma separated)</label>
                      <input
                        type="text"
                        value={rubric[questionId]?.keywords?.join(', ') || ''}
                        onChange={(e) => setRubric(prev => ({
                          ...prev,
                          [questionId]: {
                            ...prev[questionId],
                            keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                          }
                        }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                        placeholder="key, concept, important"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grade Button */}
            {Object.keys(studentAnswers).length > 0 && (
              <div className="mt-6">
                <button
                  onClick={gradePaper}
                  disabled={grading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {grading ? 'Grading...' : 'Grade Paper'}
                </button>
              </div>
            )}

            {/* Grading Results */}
            {gradingResult && (
              <div className="mt-8 border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Grading Results</h4>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-500">Total Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {gradingResult.total_score}/{gradingResult.max_total_score}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Percentage</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {gradingResult.percentage}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Grade</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {gradingResult.percentage >= 90 ? 'A' : 
                         gradingResult.percentage >= 80 ? 'B' : 
                         gradingResult.percentage >= 70 ? 'C' : 
                         gradingResult.percentage >= 60 ? 'D' : 'F'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(gradingResult.scores).map(([questionId, score]) => (
                    <div key={questionId} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <span className="font-medium text-gray-900">{questionId.toUpperCase()}</span>
                        <p className="text-sm text-gray-500">{score.feedback}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">
                          {score.score}/{score.max_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
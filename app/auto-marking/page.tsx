'use client';

import { useState } from 'react';
import { ArrowLeft, Download, Filter, ChevronLeft, ChevronRight, Edit, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface StudentResult {
  id: string;
  name: string;
  avatar: string;
  score: number;
  total: number;
  percentage: number;
  status: 'Passed' | 'Failed';
  timeTaken: string;
}

export default function AutoMarkingPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalScore, setTotalScore] = useState(100);
  const [passingScore, setPassingScore] = useState(70);
  const [allowPartialCredit, setAllowPartialCredit] = useState(true);

  const students: StudentResult[] = [
    {
      id: '1',
      name: 'Emma Wilson',
      avatar: 'EW',
      score: 92,
      total: 100,
      percentage: 92,
      status: 'Passed',
      timeTaken: '45 min',
    },
    {
      id: '2',
      name: 'James Chen',
      avatar: 'JC',
      score: 85,
      total: 100,
      percentage: 85,
      status: 'Passed',
      timeTaken: '52 min',
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      avatar: 'SJ',
      score: 78,
      total: 100,
      percentage: 78,
      status: 'Passed',
      timeTaken: '38 min',
    },
    {
      id: '4',
      name: 'Michael Davis',
      avatar: 'MD',
      score: 65,
      total: 100,
      percentage: 65,
      status: 'Failed',
      timeTaken: '41 min',
    },
    {
      id: '5',
      name: 'Lisa Rodriguez',
      avatar: 'LR',
      score: 88,
      total: 100,
      percentage: 88,
      status: 'Passed',
      timeTaken: '47 min',
    },
    {
      id: '6',
      name: 'David Thompson',
      avatar: 'DT',
      score: 72,
      total: 100,
      percentage: 72,
      status: 'Passed',
      timeTaken: '55 min',
    },
    {
      id: '7',
      name: 'Anna Martinez',
      avatar: 'AM',
      score: 95,
      total: 100,
      percentage: 95,
      status: 'Passed',
      timeTaken: '43 min',
    },
    {
      id: '8',
      name: 'Robert Brown',
      avatar: 'RB',
      score: 68,
      total: 100,
      percentage: 68,
      status: 'Failed',
      timeTaken: '48 min',
    },
  ];

  const averageScore = students.reduce((acc, s) => acc + s.percentage, 0) / students.length;
  const passedCount = students.filter((s) => s.status === 'Passed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Auto-Marking</h1>
          <p className="text-gray-600">
            Upload student answers and automatically mark assessments
          </p>
        </div>

        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Upload Student Answers</h3>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <Download className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-2">Drop files here or click to upload</p>
                <p className="text-xs text-gray-400">Supported PDF, DOC, DOCX files</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marking Settings
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Total Score</label>
                      <input
                        type="number"
                        value={totalScore}
                        onChange={(e) => setTotalScore(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Passing Score</label>
                      <input
                        type="number"
                        value={passingScore}
                        onChange={(e) => setPassingScore(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="partialCredit"
                    checked={allowPartialCredit}
                    onChange={(e) => setAllowPartialCredit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="partialCredit" className="text-sm text-gray-700">
                    Allow partial credit
                  </label>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Edit className="w-4 h-4" />
                Auto-Mark Answers
              </button>

              <button className="w-full mt-3 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Clear All
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Marking Results</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {students.length} students processed • Average: {averageScore.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Export Results
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Time Taken
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {student.avatar}
                            </div>
                            <span className="font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {student.score}/{student.total}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{student.percentage}%</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              student.status === 'Passed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{student.timeTaken}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing page {currentPage} of 3
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    3
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
                    disabled={currentPage === 3}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

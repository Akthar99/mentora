'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  recent_chats: any[];
  documents: any[];
  flashcards: any[];
  generated_questions: any[];
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    recent_chats: [],
    documents: [],
    flashcards: [],
    generated_questions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth(); // Move useAuth to component level

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]); // Add user as dependency

  const fetchDashboardData = async () => {
    try {
      if (!user) return; // Add null check
      
      const response = await fetch(`http://localhost:8000/api/dashboard/${user.uid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.dashboard) {
        setDashboardData({
          recent_chats: Array.isArray(data.dashboard.recent_chats) ? data.dashboard.recent_chats : [],
          documents: Array.isArray(data.dashboard.documents) ? data.dashboard.documents : [],
          flashcards: Array.isArray(data.dashboard.flashcards) ? data.dashboard.flashcards : [],
          generated_questions: Array.isArray(data.dashboard.generated_questions) ? data.dashboard.generated_questions : [],
        });
      } else {
        throw new Error('Invalid dashboard data structure');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard data');
      setDashboardData({
        recent_chats: [],
        documents: [],
        flashcards: [],
        generated_questions: []
      });
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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchDashboardData}
                  className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/dashboard/upload" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Upload Document</dt>
                    <dd className="text-lg font-medium text-gray-900">New Upload</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/flashcards" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Flashcards</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.flashcards?.length || 0} sets
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/chat" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Study Chat</dt>
                    <dd className="text-lg font-medium text-gray-900">Ask Questions</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/questions" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Generate Questions</dt>
                    <dd className="text-lg font-medium text-gray-900">Exam Papers</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Documents */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Documents</h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {dashboardData.documents && dashboardData.documents.length > 0 ? (
                  dashboardData.documents.slice(0, 5).map((doc, index) => (
                    <li key={doc.id || index} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                            <div className="text-sm text-gray-500">
                              {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Unknown date'}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link 
                            href={`/dashboard/chat?documentId=${doc.id}`}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Chat
                          </Link>
                          <Link 
                            href={`/dashboard/flashcards?documentId=${doc.id}`}
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            Flashcards
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-8 sm:px-6 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2">No documents uploaded yet</p>
                    <Link href="/dashboard/upload" className="mt-2 text-indigo-600 hover:text-indigo-500">
                      Upload your first document
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Recent Chats */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Chats</h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {dashboardData.recent_chats && dashboardData.recent_chats.length > 0 ? (
                  dashboardData.recent_chats.slice(0, 5).map((chat, index) => (
                    <li key={index} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {chat.question && chat.question.length > 50 
                              ? `${chat.question.substring(0, 50)}...` 
                              : chat.question || 'No question'}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {chat.timestamp ? new Date(chat.timestamp).toLocaleString() : 'Unknown time'}
                          </div>
                        </div>
                        <Link 
                          href="/dashboard/chat"
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-8 sm:px-6 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p className="mt-2">No chat history yet</p>
                    <p className="text-sm">Start a conversation with your documents</p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
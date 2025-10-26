'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // ✅ Correct import
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DocumentChunk {
  chunk_id: string;
  content: string;
  chunk_index: number;
  filename: string;
  is_highlighted: boolean;
}

interface DocumentViewData {
  success: boolean;
  document_id: string;
  chunks: DocumentChunk[];
  total_chunks: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDocument, setViewingDocument] = useState<DocumentViewData | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const { user } = useAuth(); // ✅ Correct: at component level
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, projectId]); // ✅ Add projectId dependency

  const fetchDocuments = async () => {
    try {
      const url = projectId 
        ? `http://localhost:8000/api/dashboard/${user?.uid}?project_id=${projectId}`
        : `http://localhost:8000/api/dashboard/${user?.uid}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.dashboard.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (docId: string) => {
    try {
      setLoadingDocument(true);
      const url = projectId
        ? `http://localhost:8000/api/document-chunks/${user?.uid}/${docId}?session_id=default&project_id=${projectId}`
        : `http://localhost:8000/api/document-chunks/${user?.uid}/${docId}`;
      
      const response = await fetch(url);
      const data: DocumentViewData = await response.json();
      
      if (data.success) {
        setViewingDocument(data);
      }
    } catch (error) {
      console.error('Error fetching document chunks:', error);
      alert('Failed to load document. Please try again.');
    } finally {
      setLoadingDocument(false);
    }
  };

  const closeDocumentView = () => {
    setViewingDocument(null);
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

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Document Viewer Modal */}
        {viewingDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Document Viewer</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {viewingDocument.total_chunks} chunk{viewingDocument.total_chunks !== 1 ? 's' : ''} total
                  </p>
                </div>
                <button
                  onClick={closeDocumentView}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {viewingDocument.chunks.map((chunk, index) => (
                  <div
                    key={chunk.chunk_id}
                    className={`mb-6 p-4 rounded-lg ${
                      chunk.is_highlighted 
                        ? 'bg-yellow-50 border-2 border-yellow-300' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Chunk {chunk.chunk_index + 1} - {chunk.filename}
                      </span>
                      {chunk.is_highlighted && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                          Highlighted
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={closeDocumentView}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 font-medium text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Documents</h1>
          <Link
            href="/dashboard/upload"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium w-full sm:w-auto text-center"
          >
            Upload New Document
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 sm:p-8 text-center">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">Get started by uploading your first document.</p>
            <div className="mt-4 sm:mt-6">
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Upload Document
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {documents.map((doc, index) => (
                <li key={doc.id || index}>
                  <div className="px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{doc.name || doc.filename || `Document ${index + 1}`}</div>
                        <div className="text-xs text-gray-500">
                          {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Unknown date'}
                        </div>
                        <div className="text-xs text-gray-500 hidden sm:block">
                          Size: {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleViewDocument(doc.id)}
                        disabled={loadingDocument}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition"
                      >
                        {loadingDocument ? 'Loading...' : 'View'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DocumentSelector from '@/components/DocumentSelector';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';
import { Document } from '@/types';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: any[];
}

export default function StudyChat() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const { user } = useAuth();

  useEffect(() => {
    if (user && projectId) {
      fetchProjectDocuments();
    }
  }, [user, projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user || selectedDocumentIds.length === 0) return;

    if (!projectId) {
      alert('Project ID is required. Please access this page from a project.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          session_id: 'default',
          message: inputMessage,
          chat_history: messages.filter(m => m.type === 'user' || m.type === 'assistant')
            .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })),
          project_id: projectId,
          document_ids: selectedDocumentIds // NEW: Send selected document IDs
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.answer,
          timestamp: new Date(),
          references: result.references,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
          className="mb-4 sm:mb-6"
        />
        
        <div className="bg-white shadow rounded-lg">
          {/* Chat Header */}
          <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Study Chat</h3>
            {selectedDocumentIds.length > 0 && (
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Chatting with {selectedDocumentIds.length} selected document(s)
              </p>
            )}
          </div>

          {/* Chat Messages */}
          <div className="h-80 sm:h-96 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-12 sm:mt-16">
                <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="mt-2 text-sm sm:text-base px-4">
                  {selectedDocumentIds.length === 0 
                    ? 'Please select at least one document to start chatting!' 
                    : 'Start asking questions about your selected documents!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-xs lg:max-w-md rounded-lg px-3 py-2 sm:px-4 ${
                        message.type === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-xs sm:text-sm break-words">{message.content}</p>
                      {message.references && message.references.length > 0 && (
                        <div className="mt-2 text-xs opacity-75">
                          <p className="font-semibold">References:</p>
                          <ul className="list-disc list-inside">
                            {message.references.slice(0, 3).map((ref, idx) => (
                              <li key={idx} className="truncate">
                                {ref.filename} (Chunk {ref.chunk_index})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-xs mt-1 opacity-75">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
            <div className="flex gap-2 sm:gap-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your documents..."
                disabled={selectedDocumentIds.length === 0 || loading}
                className="flex-1 min-w-0 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={selectedDocumentIds.length === 0 || !inputMessage.trim() || loading}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <span className="hidden sm:inline">Send</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
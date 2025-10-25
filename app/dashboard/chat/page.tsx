'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: any[];
}

export default function StudyChat() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for documentId in URL params
  useEffect(() => {
    const documentId = searchParams.get('documentId');
    if (documentId && documents.length > 0) {
      setSelectedDocument(documentId);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedDocument || !user) return;

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
          document_id: selectedDocument,
          message: inputMessage,
          chat_history: messages.filter(m => m.type === 'user' || m.type === 'assistant')
            .map(m => ({ role: m.type, content: m.content }))
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

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow rounded-lg">
          {/* Document Selection */}
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document to Chat With
            </label>
            <select
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Choose a document</option>
              {documents.map((doc, index) => (
                <option key={doc.id || index} value={doc.id}>
                  {doc.name || doc.filename || `Document ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto px-4 py-4 sm:px-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-16">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="mt-2">Select a document and start asking questions!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.references && message.references.length > 0 && (
                        <div className="mt-2 text-xs opacity-75">
                          <p className="font-semibold">References:</p>
                          <ul className="list-disc list-inside">
                            {message.references.slice(0, 3).map((ref, idx) => (
                              <li key={idx}>
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
          <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your document..."
                disabled={!selectedDocument || loading}
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!selectedDocument || !inputMessage.trim() || loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
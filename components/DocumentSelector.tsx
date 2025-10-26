'use client';

import { useState, useEffect } from 'react';
import { Document } from '@/types';
import { CheckSquare, Square } from 'lucide-react';

interface DocumentSelectorProps {
  documents: Document[];
  onSelectionChange: (selectedDocIds: string[]) => void;
  className?: string;
}

export default function DocumentSelector({ 
  documents, 
  onSelectionChange,
  className = ''
}: DocumentSelectorProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Initialize with documents that have selected=true
  useEffect(() => {
    const initialSelection = documents
      .filter(doc => doc.selected !== false) // Default to selected if not specified
      .map(doc => doc.docId || doc.id);
    
    setSelectedDocs(initialSelection);
    onSelectionChange(initialSelection);
  }, [documents]);

  const toggleDocument = (docId: string) => {
    setSelectedDocs(prev => {
      const newSelection = prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId];
      
      onSelectionChange(newSelection);
      return newSelection;
    });
  };

  const selectAll = () => {
    const allDocIds = documents.map(doc => doc.docId || doc.id);
    setSelectedDocs(allDocIds);
    onSelectionChange(allDocIds);
  };

  const deselectAll = () => {
    setSelectedDocs([]);
    onSelectionChange([]);
  };

  if (documents.length === 0) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-yellow-800">
          No documents uploaded yet. Please upload documents first.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Select Documents ({selectedDocs.length}/{documents.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            >
              Deselect All
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {documents.map(doc => {
          const docId = doc.docId || doc.id;
          const isSelected = selectedDocs.includes(docId);
          
          return (
            <div
              key={docId}
              onClick={() => toggleDocument(docId)}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${
                isSelected ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.name || doc.filename || 'Unnamed Document'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.uploadDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

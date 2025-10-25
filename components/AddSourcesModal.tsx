'use client';

import { useState } from 'react';
import { X, Upload, Cloud, FileText } from 'lucide-react';
import { ProjectType } from '@/types';

interface AddSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (files: File[]) => void;
  projectType: ProjectType;
}

export default function AddSourcesModal({ isOpen, onClose, onContinue, projectType }: AddSourcesModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState('');

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleContinue = () => {
    if (uploadedFiles.length > 0 || pastedText) {
      onContinue(uploadedFiles);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Add sources</h2>
          <p className="text-gray-600">
            Upload your syllabus or study materials here to automatically generate personalized flashcards that
            support effective learning.
          </p>
        </div>

        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-blue-300 rounded-2xl p-12 mb-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-blue-50"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Cloud className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <p className="text-blue-600 font-semibold mb-2">Upload sources</p>
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop or{' '}
                <label className="text-blue-600 underline cursor-pointer hover:text-blue-700">
                  Choose file
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.txt,.md"
                    onChange={handleFileSelect}
                  />
                </label>
                {' '}to upload
              </p>
              <p className="text-xs text-gray-500">Supported file types: Pdf, txt, Markdown</p>
            </div>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mb-6 space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <FileText className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Paste text</span>
          </div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your study material here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {pastedText && (
            <p className="text-xs text-blue-600 mt-2">Copied text</p>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={uploadedFiles.length === 0 && !pastedText}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

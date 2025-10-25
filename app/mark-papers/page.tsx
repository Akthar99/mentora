'use client';

import { useState } from 'react';
import { ArrowLeft, Upload, FileText, Users, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function MarkPapersPage() {
  const router = useRouter();
  const [paperStructure, setPaperStructure] = useState<File | null>(null);
  const [answerSheets, setAnswerSheets] = useState<File[]>([]);

  const handlePaperStructureDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setPaperStructure(file);
    }
  };

  const handleAnswerSheetsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setAnswerSheets(files);
  };

  const handlePaperStructureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaperStructure(file);
    }
  };

  const handleAnswerSheetsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAnswerSheets(files);
  };

  const handleStartMarking = () => {
    router.push('/auto-marking');
  };

  const removeAnswerSheet = (index: number) => {
    setAnswerSheets(answerSheets.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Mark Papers</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Upload Exam Papers</h1>
          <p className="text-gray-600">
            Upload the blank exam paper structure and student answer sheets for marking
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Paper Structure</h2>
                <p className="text-sm text-gray-500">Upload blank exam paper template</p>
              </div>
            </div>

            <div
              onDrop={handlePaperStructureDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Upload Paper Structure</p>
                  <p className="text-xs text-gray-500 mb-3">Drag and drop your blank paper or click to browse</p>
                  <label className="inline-block">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handlePaperStructureSelect}
                    />
                    <span className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 cursor-pointer inline-block">
                      Choose File
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-400">Supported file types: PDF, DOC, DOCX</p>
              </div>
            </div>

            {paperStructure && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{paperStructure.name}</p>
                  <p className="text-xs text-gray-500">
                    {(paperStructure.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Student Answer Sheets</h2>
                <p className="text-sm text-gray-500">Upload completed exam papers</p>
              </div>
            </div>

            <div
              onDrop={handleAnswerSheetsDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Upload Answer Sheets</p>
                  <p className="text-xs text-gray-500 mb-3">Select multiple files or drag them here</p>
                  <label className="inline-block">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleAnswerSheetsSelect}
                    />
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer inline-block">
                      Select Files
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-400">Supported file types: PDF, JPG, PNG</p>
              </div>
            </div>

            {answerSheets.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {answerSheets.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button
                      onClick={() => removeAnswerSheet(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleStartMarking}
            disabled={!paperStructure || answerSheets.length === 0}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Start Marking
          </button>
        </div>
      </div>
    </div>
  );
}

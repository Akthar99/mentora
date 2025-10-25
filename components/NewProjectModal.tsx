'use client';

import { X, BookOpen, CreditCard, FileText, ChevronRight } from 'lucide-react';
import { ProjectType } from '@/types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: ProjectType) => void;
}

const projectTypes = [
  {
    type: 'Study' as ProjectType,
    title: 'Study',
    description: 'Study with your chat-bot, This will help you learn faster than ever.',
    icon: BookOpen,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  {
    type: 'Exam Papers' as ProjectType,
    title: 'Exam Papers',
    description: 'Make MCQ questions with help of AI This helps you mark your exam papers and generate questions.',
    icon: FileText,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
  },
  {
    type: 'Flash Cards' as ProjectType,
    title: 'Flash Cards',
    description: 'Helps you with memorizing information.',
    icon: CreditCard,
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
];

export default function NewProjectModal({ isOpen, onClose, onSelectType }: NewProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
              Add Sources +
            </button>
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-900">New Project</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projectTypes.map((projectType) => {
            const IconComponent = projectType.icon;
            return (
              <button
                key={projectType.type}
                onClick={() => {
                  onSelectType(projectType.type);
                  onClose();
                }}
                className={`relative p-6 rounded-2xl border-2 ${projectType.borderColor} ${projectType.bgColor} hover:shadow-lg transition-all duration-200 text-left group`}
              >
                <div className={`w-12 h-12 ${projectType.bgColor} rounded-xl flex items-center justify-center mb-4 border ${projectType.borderColor}`}>
                  <IconComponent className={`w-6 h-6 ${projectType.textColor}`} />
                </div>

                <h3 className={`text-lg font-semibold mb-2 ${projectType.textColor}`}>
                  {projectType.title}
                </h3>

                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {projectType.description}
                </p>

                <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-gray-400 group-hover:text-gray-600 transition" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

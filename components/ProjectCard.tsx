'use client';

import { ChevronRight, BookOpen, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
}

const iconMap = {
  'Study': BookOpen,
  'Flash Cards': CreditCard,
  'Exam Papers': FileText,
};

const colorMap = {
  'Study': {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  'Flash Cards': {
    bg: 'bg-green-50',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
  },
  'Exam Papers': {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
  },
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const Icon = iconMap[project.type] || BookOpen;
  const colors = colorMap[project.type] || colorMap['Study'];

  const href = project.type === 'Flash Cards'
    ? `/flashcards/${project.id}`
    : `/projects/${project.id}`;

  return (
    <Link href={href}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
            {project.type}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
          {project.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Created: {new Date(project.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}

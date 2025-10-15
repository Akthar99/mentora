'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProjectCard from '@/components/ProjectCard';
import NewProjectModal from '@/components/NewProjectModal';
import AddSourcesModal from '@/components/AddSourcesModal';
import { Project, ProjectType } from '@/types';
import { projectsApi } from '@/services/api';

const filterOptions = ['All Projects', 'Study', 'Flash Cards', 'Exam Papers'];

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All Projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSourcesOpen, setIsAddSourcesOpen] = useState(false);
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await projectsApi.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (selectedFilter === 'All Projects') return true;
    return project.type === selectedFilter;
  });

  const handleSelectProjectType = async (type: ProjectType) => {
    if (type === 'Exam Papers') {
      router.push('/upgrade');
      return;
    }
    setSelectedProjectType(type);
    setIsModalOpen(false);
    setIsAddSourcesOpen(true);
  };

  const handleSourcesUploaded = (files: File[]) => {
    if (!selectedProjectType) return;

    if (selectedProjectType === 'Study') {
      router.push('/projects/new');
    } else if (selectedProjectType === 'Flash Cards') {
      router.push('/flashcards/new');
    }

    setIsAddSourcesOpen(false);
    setSelectedProjectType(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Projects</h1>
            <p className="text-gray-600">Manage and organize your study materials</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        <div className="flex space-x-3 mb-8">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                selectedFilter === filter
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first project</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectType={handleSelectProjectType}
      />

      {selectedProjectType && (
        <AddSourcesModal
          isOpen={isAddSourcesOpen}
          onClose={() => {
            setIsAddSourcesOpen(false);
            setSelectedProjectType(null);
          }}
          onContinue={handleSourcesUploaded}
          projectType={selectedProjectType}
        />
      )}
    </div>
  );
}

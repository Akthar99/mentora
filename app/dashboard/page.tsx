'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Project, ProjectType } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';
import NewProjectModal from '@/components/NewProjectModal';
import ProjectCard from '@/components/ProjectCard';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [filter, setFilter] = useState<'All Projects' | ProjectType>('All Projects');
  
  const { user, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      if (!user) return;
      
      console.log('Fetching projects for user:', user.uid);
      
      const projectsRef = collection(db, 'projects');
      
      // Try with orderBy first
      try {
        const q = query(
          projectsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const projectsData: Project[] = [];
        
        querySnapshot.forEach((doc) => {
          projectsData.push({
            id: doc.id,
            ...doc.data()
          } as Project);
        });
        
        console.log('Projects fetched:', projectsData.length);
        setProjects(projectsData);
      } catch (indexError: any) {
        // If orderBy fails (missing index), fetch without ordering
        console.warn('orderBy failed, fetching without ordering:', indexError.message);
        
        const q = query(
          projectsRef,
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const projectsData: Project[] = [];
        
        querySnapshot.forEach((doc) => {
          projectsData.push({
            id: doc.id,
            ...doc.data()
          } as Project);
        });
        
        // Sort manually on client side
        projectsData.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log('Projects fetched (manual sort):', projectsData.length);
        setProjects(projectsData);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (type: ProjectType) => {
    // Check if user is premium for Exam Papers
    if (type === 'Exam Papers' && !userData?.isPremium) {
      router.push('/upgrade');
      return;
    }

    setShowNewProjectModal(false);
    
    // Redirect to project creation form with type
    router.push(`/dashboard/projects/new?type=${encodeURIComponent(type)}`);
  };

  const filteredProjects = filter === 'All Projects' 
    ? projects 
    : projects.filter(p => p.type === filter);

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
    <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and organize your study materials</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={fetchProjects}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition flex items-center space-x-2 text-sm sm:text-base"
              title="Refresh projects"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium shadow-md transition flex items-center space-x-2 text-sm sm:text-base flex-1 sm:flex-none justify-center"
            >
              <span className="text-xl">+</span>
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {(['All Projects', 'Study', 'Flash Cards', 'Exam Papers'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base ${
                  filter === tab
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 w-full sm:w-auto text-right">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {filter === 'All Projects' 
                ? 'Create your first project to get started'
                : `No ${filter} projects found`}
            </p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition text-sm sm:text-base"
            >
              <span className="text-xl mr-2">+</span>
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSelectType={handleCreateProject}
      />
    </div>
  );
}
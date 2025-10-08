import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';
import { PublicProjectViewer } from '../../../components/ironingBeads/PublicProjectViewer';
import { IroningBeadsErrorBoundary } from '@/components/ironingBeads/IroningBeadsPage';

const PublicProjectPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || typeof id !== 'string') return;

    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/public/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found');
          } else {
            setError('Failed to load project');
          }
          return;
        }

        const projectData = await response.json();
        
        // Transform API format to client format
        const processedProject = {
          ...projectData,
          createdAt: new Date(projectData.createdAt),
          modifiedAt: new Date(projectData.updatedAt),
          beadData: projectData.gridData,
          gridSize: { width: projectData.gridWidth, height: projectData.gridHeight },
        };

        setProject(processedProject);
      } catch (error) {
        console.error('Failed to load public project:', error);
        setError('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [id, router.isReady]);

  const handleBackToDiscover = () => {
    router.push('/ironingBeads');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <h2 className="text-xl font-semibold text-base-content mb-2">
            Loading Project...
          </h2>
          <p className="text-base-content opacity-70">
            Preparing the project view...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-base-content mb-2">
            {error}
          </h2>
          <p className="text-base-content opacity-60 mb-4">
            The project you're looking for doesn't exist or is no longer public.
          </p>
          <button
            onClick={handleBackToDiscover}
            className="btn btn-primary"
          >
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-base-content opacity-70">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <IroningBeadsErrorBoundary>
      <PublicProjectViewer 
        project={project} 
        onBackToDiscover={handleBackToDiscover} 
      />
    </IroningBeadsErrorBoundary>
  );
};

export default PublicProjectPage;
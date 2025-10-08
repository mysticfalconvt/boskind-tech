import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';
import { DesignCanvasView } from '@/components/ironingBeads/DesignCanvasView';
import { IroningBeadsErrorBoundary } from '@/components/ironingBeads/IroningBeadsPage';

const ProjectDesignPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { loadProject, currentProject, projects, isAuthenticated, checkAuth, authLoading } = useIroningBeadsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!router.isReady || authLoading) return;

    if (!isAuthenticated) {
      router.push('/ironingBeads');
      return;
    }

    if (typeof id === 'string') {
      // Check if project exists in current projects
      const project = projects.find(p => p.id === id);
      if (project) {
        loadProject(id);
        setIsLoading(false);
      } else if (projects.length > 0) {
        // Projects are loaded but project not found
        setError('Project not found');
        setIsLoading(false);
      }
      // If projects.length === 0, we're still loading projects
    }
  }, [id, router.isReady, isAuthenticated, projects, loadProject, router, authLoading]);

  const handleBackToProjects = () => {
    router.push('/ironingBeads');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <h2 className="text-xl font-semibold text-base-content mb-2">
            Loading Project...
          </h2>
          <p className="text-base-content opacity-70">
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
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
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={handleBackToProjects}
            className="btn btn-primary"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!currentProject) {
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
      <DesignCanvasView onBackToProjects={handleBackToProjects} />
    </IroningBeadsErrorBoundary>
  );
};

export default ProjectDesignPage;
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { BeadProject } from '@/types/ironingBeads';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';
import { ReadOnlyBeadGrid } from '@/components/ironingBeads/ReadOnlyBeadGrid';

interface PublicProjectViewerProps {
  project: BeadProject & { 
    username?: string; 
    viewCount?: number; 
    duplicateCount?: number; 
  };
  onBackToDiscover: () => void;
}

export const PublicProjectViewer: React.FC<PublicProjectViewerProps> = ({ 
  project, 
  onBackToDiscover 
}) => {
  const router = useRouter();
  const { duplicatePublicProject, isAuthenticated } = useIroningBeadsStore();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    if (!isAuthenticated) {
      // Could show auth modal here
      return;
    }

    setIsDuplicating(true);
    try {
      const duplicatedProject = await duplicatePublicProject(project.id);
      // Navigate to the duplicated project
      if (duplicatedProject) {
        router.push(`/ironingBeads/projects/${duplicatedProject.id}`);
      }
    } catch (error) {
      console.error('Failed to duplicate project:', error);
    } finally {
      setIsDuplicating(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };



  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToDiscover}
                className="flex items-center gap-2 text-base-content opacity-70 hover:opacity-100 transition-colors duration-200"
                aria-label="Back to discover"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
                Back to Discover
              </button>
              
              <div className="h-6 w-px bg-base-300" />
              
              <div>
                <h1 className="text-xl font-semibold text-base-content">
                  {project.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-base-content opacity-60">
                  <span>By {project.username || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{project.gridSize.width}×{project.gridSize.height} grid</span>
                  <span>•</span>
                  <span>Created {formatDate(project.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats */}
              {(project.viewCount !== undefined || project.duplicateCount !== undefined) && (
                <div className="flex items-center gap-4 text-sm text-base-content opacity-60">
                  {project.viewCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {project.viewCount} views
                    </div>
                  )}
                  {project.duplicateCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {project.duplicateCount} copies
                    </div>
                  )}
                </div>
              )}

              {/* Duplicate Button */}
              {isAuthenticated ? (
                <button
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                  className="btn btn-primary"
                >
                  {isDuplicating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Copying...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy to My Projects
                    </>
                  )}
                </button>
              ) : (
                <div className="text-sm text-base-content opacity-60">
                  Sign in to copy this project
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center">
          <div className="bg-base-100 rounded-lg shadow-lg p-6 border border-base-300">
            <ReadOnlyBeadGrid project={project} />
          </div>
        </div>
        
        {/* Project Info */}
        <div className="mt-8 bg-base-100 rounded-lg p-6 border border-base-300">
          <h2 className="text-lg font-semibold text-base-content mb-4">
            About This Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-base-content mb-2">Project Details</h3>
              <div className="space-y-2 text-sm text-base-content opacity-70">
                <div><strong>Name:</strong> {project.name}</div>
                <div><strong>Creator:</strong> {project.username || 'Anonymous'}</div>
                <div><strong>Grid Size:</strong> {project.gridSize.width}×{project.gridSize.height}</div>
                <div><strong>Created:</strong> {formatDate(project.createdAt)}</div>
                <div><strong>Last Modified:</strong> {formatDate(project.modifiedAt)}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-base-content mb-2">Usage</h3>
              <div className="space-y-2 text-sm text-base-content opacity-70">
                <div>This is a public project that you can view and copy.</div>
                {isAuthenticated ? (
                  <div>Click "Copy to My Projects" to create your own editable version.</div>
                ) : (
                  <div>Sign in to copy this project to your account.</div>
                )}
                <div>The original creator retains all rights to their design.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
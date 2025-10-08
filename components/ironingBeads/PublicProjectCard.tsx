import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { BeadProject } from '@/types/ironingBeads';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';

interface PublicProjectCardProps {
  project: BeadProject & { 
    username?: string; 
    viewCount?: number; 
    duplicateCount?: number; 
  };
  isAuthenticated: boolean;
}

export const PublicProjectCard: React.FC<PublicProjectCardProps> = ({ 
  project, 
  isAuthenticated 
}) => {
  const router = useRouter();
  const { duplicatePublicProject } = useIroningBeadsStore();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleView = () => {
    router.push(`/ironingBeads/public/${project.id}`);
  };

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Generate full resolution thumbnail from bead data
  const generateThumbnail = () => {
    const thumbnailData = [];
    
    // Use the full resolution of the project grid
    for (let y = 0; y < project.gridSize.height; y++) {
      for (let x = 0; x < project.gridSize.width; x++) {
        const cell = project.beadData[y]?.[x];
        if (cell && !cell.isEmpty) {
          thumbnailData.push(cell.color);
        } else {
          thumbnailData.push(null);
        }
      }
    }
    
    return thumbnailData;
  };

  const thumbnailData = generateThumbnail();
  const hasContent = thumbnailData.some(color => color !== null);

  return (
    <div className="bg-base-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-base-300">
      {/* Thumbnail */}
      <div 
        className="h-32 bg-base-200 cursor-pointer relative overflow-hidden rounded-t-lg flex items-center justify-center"
        onClick={handleView}
      >
        {hasContent ? (
          <div 
            className="grid gap-0 h-full max-h-28 max-w-28 p-1"
            style={{
              gridTemplateColumns: `repeat(${project.gridSize.width}, 1fr)`,
              gridTemplateRows: `repeat(${project.gridSize.height}, 1fr)`,
              aspectRatio: `${project.gridSize.width} / ${project.gridSize.height}`,
            }}
          >
            {thumbnailData.map((color, index) => (
              <div
                key={index}
                className="w-full h-full"
                style={{
                  backgroundColor: color || 'transparent',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg 
                className="w-8 h-8 text-base-content opacity-40 mx-auto mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                />
              </svg>
              <p className="text-xs text-base-content opacity-60">Empty</p>
            </div>
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
            <svg 
              className="w-8 h-8 text-white drop-shadow-lg" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="p-4">
        <h3 
          className="font-semibold text-base-content truncate cursor-pointer hover:text-primary transition-colors duration-200 mb-2"
          onClick={handleView}
          title={project.name}
        >
          {project.name}
        </h3>
        
        <div className="text-xs text-base-content opacity-60 space-y-1 mb-3">
          <div>By {project.username || 'Anonymous'}</div>
          <div>Created: {formatDate(project.createdAt)}</div>
          <div>Size: {project.gridSize.width}×{project.gridSize.height}</div>
          {(project.viewCount !== undefined || project.duplicateCount !== undefined) && (
            <div className="flex gap-4">
              {project.viewCount !== undefined && (
                <span>👁 {project.viewCount} views</span>
              )}
              {project.duplicateCount !== undefined && (
                <span>📋 {project.duplicateCount} copies</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleView}
            className="btn btn-sm btn-outline flex-1"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
          
          {isAuthenticated && (
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="btn btn-sm btn-primary"
            >
              {isDuplicating ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
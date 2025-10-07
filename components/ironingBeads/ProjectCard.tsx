import React, { useState } from 'react';
import { BeadProject } from '@/types/ironingBeads';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';

interface ProjectCardProps {
  project: BeadProject;
  onSelect: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  const { deleteProject, duplicateProject, renameProject } = useIroningBeadsStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const handleDelete = () => {
    deleteProject(project.id);
    setShowDeleteConfirm(false);
  };

  const handleDuplicate = () => {
    duplicateProject(project.id);
    setShowActions(false);
  };

  const handleRename = () => {
    setIsRenaming(true);
    setShowActions(false);
    setNewName(project.name);
  };

  const handleRenameSubmit = () => {
    if (newName.trim() && newName.trim() !== project.name) {
      renameProject(project.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setNewName(project.name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Generate a more accurate thumbnail from bead data
  const generateThumbnail = () => {
    const thumbnailSize = 16; // Increased resolution for better accuracy
    const stepX = project.gridSize.width / thumbnailSize;
    const stepY = project.gridSize.height / thumbnailSize;
    
    const thumbnailData = [];
    for (let y = 0; y < thumbnailSize; y++) {
      for (let x = 0; x < thumbnailSize; x++) {
        // Sample multiple cells and find the most common color in this region
        const regionColors: (string | null)[] = [];
        const startX = Math.floor(x * stepX);
        const endX = Math.min(Math.ceil((x + 1) * stepX), project.gridSize.width);
        const startY = Math.floor(y * stepY);
        const endY = Math.min(Math.ceil((y + 1) * stepY), project.gridSize.height);
        
        // Collect all colors in this region
        for (let regionY = startY; regionY < endY; regionY++) {
          for (let regionX = startX; regionX < endX; regionX++) {
            const cell = project.beadData[regionY]?.[regionX];
            if (cell && !cell.isEmpty) {
              regionColors.push(cell.color);
            } else {
              regionColors.push(null);
            }
          }
        }
        
        // Find the most common color in this region
        const colorCounts: { [key: string]: number } = {};
        let nullCount = 0;
        
        regionColors.forEach(color => {
          if (color === null) {
            nullCount++;
          } else {
            colorCounts[color] = (colorCounts[color] || 0) + 1;
          }
        });
        
        // Determine the representative color
        let representativeColor: string | null = null;
        let maxCount = nullCount;
        
        Object.entries(colorCounts).forEach(([color, count]) => {
          if (count > maxCount) {
            maxCount = count;
            representativeColor = color;
          }
        });
        
        thumbnailData.push(representativeColor);
      }
    }
    
    return thumbnailData;
  };

  const thumbnailData = generateThumbnail();
  const hasContent = thumbnailData.some(color => color !== null);

  return (
    <div className="bg-base-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-base-300 relative">
      {/* Thumbnail */}
      <div 
        className="h-32 bg-base-200 cursor-pointer relative overflow-hidden rounded-t-lg flex items-center justify-center"
        onClick={onSelect}
      >
        {hasContent ? (
          <div 
            className="grid gap-0 aspect-square h-full max-h-28 max-w-28 p-1"
            style={{
              gridTemplateColumns: 'repeat(16, 1fr)',
              gridTemplateRows: 'repeat(16, 1fr)',
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
        <div className="flex items-start justify-between mb-2">
          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleRenameSubmit}
              className="input input-sm input-bordered bg-base-200 text-base-content flex-1 mr-2"
              autoFocus
              maxLength={50}
            />
          ) : (
            <h3 
              className="font-semibold text-base-content truncate cursor-pointer hover:text-primary transition-colors duration-200"
              onClick={onSelect}
              title={project.name}
            >
              {project.name}
            </h3>
          )}
          
          {/* Actions Menu */}
          {!isRenaming && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 text-base-content opacity-60 hover:opacity-100 rounded transition-colors duration-200"
                aria-label="Project actions"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-8 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 min-w-32 max-w-48">
                  <button
                    onClick={handleRename}
                    className="w-full px-3 py-2 text-left text-sm text-base-content hover:bg-base-200 rounded-t-lg transition-colors duration-200"
                  >
                    Rename
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="w-full px-3 py-2 text-left text-sm text-base-content hover:bg-base-200 transition-colors duration-200"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error hover:bg-opacity-10 rounded-b-lg transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-xs text-base-content opacity-60 space-y-1">
          <div>Created: {formatDate(project.createdAt)}</div>
          <div>Modified: {formatDate(project.modifiedAt)}</div>
          <div>Size: {project.gridSize.width}×{project.gridSize.height}</div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-6 max-w-sm mx-4 border border-base-300">
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Delete Project
            </h3>
            <p className="text-base-content opacity-80 mb-4">
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-error"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close actions menu */}
      {showActions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};
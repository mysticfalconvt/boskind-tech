import React, { useState, useEffect } from 'react';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';
import { BeadGrid } from '@/components/ironingBeads/BeadGrid';
import { ColorPalette } from '@/components/ironingBeads/ColorPalette';

interface DesignCanvasViewProps {
  onBackToProjects: () => void;
}

export const DesignCanvasView: React.FC<DesignCanvasViewProps> = ({ onBackToProjects }) => {
  const { currentProject, saveProject, clearGrid, clearCurrentProject, renameProject } = useIroningBeadsStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No project selected</p>
          <button
            onClick={onBackToProjects}
            className="btn btn-primary px-4 py-2 text-white rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaveStatus('saving');
    saveProject();
    
    // Show saved status briefly
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 300);
  };

  const handleClear = () => {
    clearGrid();
    setShowClearConfirm(false);
  };

  const handleBackToProjects = () => {
    // Auto-save before leaving
    saveProject();
    // Clear the current project to prevent automatic switching back
    clearCurrentProject();
    onBackToProjects();
  };

  const handleProjectNameClick = () => {
    if (currentProject) {
      setNewProjectName(currentProject.name);
      setIsRenamingProject(true);
    }
  };

  const handleProjectRename = () => {
    if (currentProject && newProjectName.trim() && newProjectName.trim() !== currentProject.name) {
      renameProject(currentProject.id, newProjectName.trim());
    }
    setIsRenamingProject(false);
  };

  const handleProjectRenameCancel = () => {
    setIsRenamingProject(false);
    setNewProjectName('');
  };

  const handleProjectNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleProjectRename();
    } else if (e.key === 'Escape') {
      handleProjectRenameCancel();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'Backspace':
            e.preventDefault();
            setShowClearConfirm(true);
            break;
        }
      }

      if (e.key === 'Escape') {
        if (showClearConfirm) {
          setShowClearConfirm(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showClearConfirm]);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToProjects}
                className="flex items-center gap-2 text-base-content opacity-70 hover:opacity-100 transition-colors duration-200"
                aria-label="Back to projects"
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
                Back to Projects
              </button>
              
              <div className="h-6 w-px bg-base-300" />
              
              <div>
                {isRenamingProject ? (
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={handleProjectNameKeyPress}
                    onBlur={handleProjectRename}
                    className="input input-sm input-bordered bg-base-200 text-base-content"
                    autoFocus
                    maxLength={50}
                  />
                ) : (
                  <h1 
                    className="text-xl font-semibold text-base-content cursor-pointer hover:text-primary transition-colors duration-200"
                    onClick={handleProjectNameClick}
                    title="Click to rename"
                  >
                    {currentProject.name}
                  </h1>
                )}
                <p className="text-sm text-base-content opacity-60">
                  {currentProject.gridSize.width}×{currentProject.gridSize.height} grid
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`
                  btn transition-all duration-200
                  ${saveStatus === 'saved' 
                    ? 'btn-success' 
                    : 'btn-primary'
                  }
                  ${saveStatus === 'saving' ? 'loading' : ''}
                `}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                    <span className="text-xs opacity-75 ml-1">(Ctrl+S)</span>
                  </>
                )}
              </button>

              {/* Clear Button */}
              <button
                onClick={() => setShowClearConfirm(true)}
                className="btn btn-outline btn-error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-stretch">
          {/* Color Palette Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 flex justify-center lg:justify-start">
            <ColorPalette />
          </div>

          {/* Design Grid */}
          <div className="flex-1 flex justify-center">
            <BeadGrid />
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-6 max-w-sm mx-4 border border-base-300">
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Clear All Beads
            </h3>
            <p className="text-base-content opacity-80 mb-4">
              Are you sure you want to clear all beads from the grid? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="btn btn-error"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
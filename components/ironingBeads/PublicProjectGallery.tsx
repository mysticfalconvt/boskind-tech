import React, { useState, useEffect } from 'react';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';
import { PublicProjectCard } from '@/components/ironingBeads/PublicProjectCard';

export const PublicProjectGallery: React.FC = () => {
  const { 
    publicProjects, 
    searchFilters, 
    loadPublicProjects, 
    searchPublicProjects,
    isAuthenticated 
  } = useIroningBeadsStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [localFilters, setLocalFilters] = useState({
    query: '',
    creator: '',
    gridSize: '',
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        await loadPublicProjects();
      } catch (error) {
        console.error('Failed to load public projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [loadPublicProjects]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      await searchPublicProjects(localFilters);
    } catch (error) {
      console.error('Failed to search public projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setLocalFilters({ query: '', creator: '', gridSize: '' });
    setIsLoading(true);
    try {
      await loadPublicProjects();
    } catch (error) {
      console.error('Failed to load public projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p className="text-base-content opacity-70">Loading public projects...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-8 p-6 bg-base-100 rounded-lg border border-base-300">
        <h2 className="text-xl font-semibold text-base-content mb-4">
          Discover Public Projects
        </h2>
        <p className="text-base-content opacity-70 mb-4">
          Browse and duplicate amazing bead patterns created by the community
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Search projects
            </label>
            <input
              type="text"
              placeholder="Search by name..."
              value={localFilters.query}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, query: e.target.value }))}
              onKeyDown={handleKeyPress}
              className="input input-bordered w-full bg-base-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Creator
            </label>
            <input
              type="text"
              placeholder="Search by creator..."
              value={localFilters.creator}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, creator: e.target.value }))}
              onKeyDown={handleKeyPress}
              className="input input-bordered w-full bg-base-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Grid Size
            </label>
            <select
              value={localFilters.gridSize}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, gridSize: e.target.value }))}
              className="select select-bordered w-full bg-base-200"
            >
              <option value="">Any size</option>
              <option value="29x29">29×29 (Standard)</option>
              <option value="15x15">15×15 (Small)</option>
              <option value="58x58">58×58 (Large)</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
          <button
            onClick={handleClearFilters}
            className="btn btn-ghost"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results */}
      {publicProjects.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-base-content mb-4">
            {searchFilters.query || searchFilters.creator || searchFilters.gridSize 
              ? `Search Results (${publicProjects.length})` 
              : `Public Projects (${publicProjects.length})`
            }
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publicProjects.map((project) => (
              <PublicProjectCard
                key={project.id}
                project={project}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-base-content opacity-40" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-base-content opacity-80 mb-2">
            No public projects found
          </h3>
          <p className="text-base-content opacity-60">
            {searchFilters.query || searchFilters.creator || searchFilters.gridSize
              ? 'Try adjusting your search filters'
              : 'Be the first to share a public project!'
            }
          </p>
        </div>
      )}
    </div>
  );
};
import React from 'react';

interface ProjectTabsProps {
  activeTab: 'my-projects' | 'discover';
  onTabChange: (tab: 'my-projects' | 'discover') => void;
  isAuthenticated: boolean;
}

export const ProjectTabs: React.FC<ProjectTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  isAuthenticated 
}) => {
  return (
    <div className="tabs tabs-boxed bg-base-200 p-1 mb-6">
      <button
        className={`tab ${activeTab === 'my-projects' ? 'tab-active' : ''}`}
        onClick={() => onTabChange('my-projects')}
        disabled={!isAuthenticated}
      >
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
        My Projects
        {!isAuthenticated && (
          <span className="ml-1 text-xs opacity-60">(Sign in required)</span>
        )}
      </button>
      
      <button
        className={`tab ${activeTab === 'discover' ? 'tab-active' : ''}`}
        onClick={() => onTabChange('discover')}
      >
        <svg 
          className="w-4 h-4 mr-2" 
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
        Discover Public Projects
      </button>
    </div>
  );
};
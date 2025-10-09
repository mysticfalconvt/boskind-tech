import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';
import { ProjectCard } from '@/components/ironingBeads/ProjectCard';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProjectTabs } from '@/components/ironingBeads/ProjectTabs';
import { PublicProjectGallery } from '@/components/ironingBeads/PublicProjectGallery';

export const ProjectListView: React.FC = () => {
  const router = useRouter();
  const { projects, createProject, loadProject, isAuthenticated, checkAuth, authLoading } = useIroningBeadsStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [activeTab, setActiveTab] = useState<'my-projects' | 'discover'>('my-projects');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Switch to discover tab if not authenticated and trying to view my projects
  useEffect(() => {
    if (!authLoading && !isAuthenticated && activeTab === 'my-projects') {
      setActiveTab('discover');
    }
  }, [isAuthenticated, authLoading, activeTab]);

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        await createProject(newProjectName.trim());
        setNewProjectName('');
        setIsCreating(false);
      } catch (error: any) {
        if (error.message === 'Must be logged in to create projects') {
          setShowAuthModal('login');
        } else {
          console.error('Failed to create project:', error);
          // You could add a toast notification here for other errors
        }
      }
    }
  };

  const handleCancelCreate = () => {
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  };

  const handleAuthSuccess = async (user: unknown) => {
    // The store should already be updated by the AuthModal
    // After successful authentication, try creating the project again
    if (newProjectName.trim()) {
      try {
        await createProject(newProjectName.trim());
        setNewProjectName('');
        setIsCreating(false);
      } catch (error) {
        console.error('Failed to create project after authentication:', error);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-base-content opacity-70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content mb-2">
          Ironing Beads Designer
        </h1>
        <p className="text-base-content opacity-70">
          Create and manage your Perler bead patterns
        </p>
      </div>

      {/* Authentication Encouragement Banner for Unauthenticated Users */}
      {!isAuthenticated && (
        <div className="mb-8 p-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg border border-primary/30">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-base-content mb-2">
              Unlock Your Creative Potential
            </h2>
            <p className="text-base-content opacity-80 mb-4 max-w-2xl mx-auto">
              Sign up for free to create, save, and share your own Perler bead patterns.
              Join our community of creators and bring your pixel art to life!
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => setShowAuthModal('register')}
                className="btn btn-primary btn-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Get Started Free
              </button>
              <button
                onClick={() => setShowAuthModal('login')}
                className="btn btn-outline btn-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign In
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Project Tabs */}
      <ProjectTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAuthenticated={isAuthenticated}
      />

      {/* Tab Content */}
      {activeTab === 'my-projects' ? (
        <>
          {/* Create New Project Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            {!isCreating ? (
              <div className="text-center">
                <h2 className="text-xl font-semibold text-base-content mb-2">
                  Start a New Project
                </h2>
                <p className="text-base-content opacity-70 mb-4">
                  Create a new 29×29 bead pattern design
                </p>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowAuthModal('login');
                    } else {
                      setIsCreating(true);
                    }
                  }}
                  className="btn btn-primary"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create New Project
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-base-content mb-4 text-center">
                  New Project
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="project-name" className="block text-sm font-medium text-base-content mb-2">
                      Project Name
                    </label>
                    <input
                      id="project-name"
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Enter project name..."
                      className="input input-bordered w-full bg-base-100"
                      autoFocus
                      maxLength={50}
                    />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim()}
                      className="btn btn-primary"
                    >
                      Create
                    </button>
                    <button
                      onClick={handleCancelCreate}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {!isAuthenticated ? (
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-base-content opacity-80 mb-2">
                Sign in to manage your projects
              </h3>
              <p className="text-base-content opacity-60 mb-4">
                Create an account or sign in to save and manage your bead patterns
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowAuthModal('login')}
                  className="btn btn-primary"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowAuthModal('register')}
                  className="btn btn-outline"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : projects.length > 0 ? (
            <div>
              <h2 className="text-2xl font-semibold text-base-content mb-6">
                Your Projects ({projects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects
                  .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
                  .map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onSelect={() => {
                        router.push(`/ironingBeads/projects/${project.id}`);
                      }}
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-base-content opacity-80 mb-2">
                No projects yet
              </h3>
              <p className="text-base-content opacity-60">
                Create your first bead pattern to get started
              </p>
            </div>
          )}
        </>
      ) : (
        /* Discover Tab */
        <>
          <PublicProjectGallery />

          {/* Benefits Section for Unauthenticated Users */}
          {!isAuthenticated && (
            <div className="mt-12 p-8 bg-base-200 rounded-lg">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-base-content mb-2">
                  Ready to Create Your Own Patterns?
                </h2>
                <p className="text-base-content opacity-70">
                  Join thousands of creators and start designing today
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-primary/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-base-content mb-2">Create Unlimited Projects</h3>
                  <p className="text-sm text-base-content opacity-70">
                    Design as many bead patterns as you want with our intuitive editor
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-secondary/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-secondary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-base-content mb-2">Save & Sync</h3>
                  <p className="text-sm text-base-content opacity-70">
                    Your projects are automatically saved and synced across all devices
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-accent/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-base-content mb-2">Share with Community</h3>
                  <p className="text-sm text-base-content opacity-70">
                    Make your patterns public and inspire other creators
                  </p>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowAuthModal('register')}
                  className="btn btn-primary btn-lg mr-3"
                >
                  Start Creating Now
                </button>
                <button
                  onClick={() => setShowAuthModal('login')}
                  className="btn btn-ghost btn-lg"
                >
                  Already have an account?
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Authentication Modal */}
      <AuthModal
        mode={showAuthModal || 'login'}
        isOpen={!!showAuthModal}
        onClose={() => setShowAuthModal(null)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
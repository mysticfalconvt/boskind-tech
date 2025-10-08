import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export const IroningBeadsPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new route structure
    router.replace('/ironingBeads');
  }, [router]);

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p className="text-base-content opacity-70">Redirecting...</p>
      </div>
    </div>
  );
};

// Error boundary wrapper component
export class IroningBeadsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Ironing Beads Designer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Application Error
            </h2>
            <p className="text-gray-600 mb-4">
              The Ironing Beads Designer encountered an unexpected error.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="btn btn-primary px-4 py-2 text-white rounded-lg hover:shadow-md transition-all duration-200 mr-2"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-ghost px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
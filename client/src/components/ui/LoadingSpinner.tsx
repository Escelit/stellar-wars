import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

export default function LoadingSpinner({ size = 'md', className = '', fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-cosmic-950">
        <div
          className={`animate-spin rounded-full border-cosmic-600 border-t-transparent ${sizes.lg}`}
          role="status"
          aria-label="loading"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-cosmic-600 border-t-transparent ${sizes[size]}`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
}

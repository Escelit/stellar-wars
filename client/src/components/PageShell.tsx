import React from 'react';
import PageHeader from './PageHeader';

interface PageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
}

export default function PageShell({
  title,
  description,
  actions,
  children,
  isLoading = false,
}: PageShellProps) {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={title} description={description} actions={actions} />
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cosmic-600 border-t-transparent" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  footer?: React.ReactNode;
}

export default function Card({ children, title, description, className = '', footer }: CardProps) {
  return (
    <div className={`flex flex-col rounded-xl border border-stellar-700 bg-stellar-800 shadow-sm ${className}`}>
      {(title || description) && (
        <div className="flex flex-col space-y-1.5 p-6">
          {title && <h3 className="text-xl font-semibold leading-none tracking-tight text-stellar-100">{title}</h3>}
          {description && <p className="text-sm text-stellar-400">{description}</p>}
        </div>
      )}
      <div className="flex-1 p-6 pt-0">{children}</div>
      {footer && (
        <div className="flex items-center p-6 pt-0">
          {footer}
        </div>
      )}
    </div>
  );
}

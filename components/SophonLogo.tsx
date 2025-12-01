import React, { useState } from 'react';

interface SophonLogoProps {
  className?: string;
}

export const SophonLogo: React.FC<SophonLogoProps> = ({ className = "w-8 h-8" }) => {
  const [error, setError] = useState(false);

  // Fallback Cyberpunk Emblem (if image fails to load)
  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-black overflow-hidden relative group border border-current`}>
         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
         <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="currentColor" strokeWidth="6">
            <circle cx="50" cy="50" r="42" className="opacity-50" />
            <path d="M70 30 C 50 30, 30 50, 30 70" className="animate-pulse" strokeLinecap="round" />
            <path d="M30 30 C 50 30, 70 50, 70 70" strokeLinecap="round" />
            <line x1="20" y1="50" x2="80" y2="50" strokeWidth="4" className="opacity-30" />
         </svg>
      </div>
    );
  }

  return (
    <img 
      src="/logo.jpg?v=6" 
      alt="Sophon" 
      className={className}
      onError={(e) => {
          // Prevent infinite loop by setting error state
          setError(true);
      }}
    />
  );
};
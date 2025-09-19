
import React from 'react';

interface ArkivameLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ArkivameLogo({ 
  className = '', 
  variant = 'full',
  size = 'md' 
}: ArkivameLogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-12',
    xl: 'h-16'
  };
  
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl', 
    xl: 'text-4xl'
  };
  
  if (variant === 'icon') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="brand-gradient rounded-lg p-2 flex items-center justify-center">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className="w-full h-full text-white"
          >
            <path
              d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7M3 7L12 14L21 7M3 7L12 2L21 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 11L12 15L17 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </svg>
        </div>
      </div>
    );
  }
  
  if (variant === 'text') {
    return (
      <div className={`font-bold font-['Poppins'] ${textSizeClasses[size]} ${className}`}>
        <span className="text-primary">Arkiv</span>
        <span className="text-secondary">ame</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={sizeClasses[size]}>
        <div className="brand-gradient rounded-lg p-2 flex items-center justify-center arkivame-shadow">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className="w-6 h-6 text-white"
          >
            <path
              d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7M3 7L12 14L21 7M3 7L12 2L21 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 11L12 15L17 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </svg>
        </div>
      </div>
      <div className={`font-bold font-['Poppins'] ${textSizeClasses[size]}`}>
        <span className="text-primary">Arkiv</span>
        <span className="text-secondary">ame</span>
      </div>
    </div>
  );
}

export default ArkivameLogo;

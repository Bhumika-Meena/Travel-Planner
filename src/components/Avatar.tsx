'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm font-medium',
  lg: 'w-14 h-14 text-lg font-semibold',
  xl: 'w-24 h-24 text-2xl font-bold',
};

const gradients = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-blue-600',
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(name);
  const gradient = getGradient(name);
  const sizeStyle = sizeClasses[size];

  if (src && !hasError) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100 ${sizeStyle} ${className}`}
      >
        <Image
          src={src}
          alt={name || 'Avatar'}
          fill
          sizes="(max-width: 768px) 100vw, 96px"
          className="object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center text-white bg-gradient-to-br ${gradient} shadow-sm select-none ${sizeStyle} ${className}`}
      title={name}
      aria-label={name}
    >
      <span>{initials}</span>
    </div>
  );
};

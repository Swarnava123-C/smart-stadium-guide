import React from 'react';
import { cn } from '@/lib/utils';
import { CrowdDensity } from '@/types/stadium';

interface StatusBadgeProps {
  density: CrowdDensity;
  className?: string;
}

const densityConfig: Record<CrowdDensity, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-secondary/20 text-secondary border-secondary/30' },
  medium: { label: 'Medium', className: 'bg-neon-amber/20 text-neon-amber border-neon-amber/30' },
  high: { label: 'High', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export const CrowdBadge: React.FC<StatusBadgeProps> = ({ density, className }) => {
  const config = densityConfig[density];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
      role="status"
      aria-label={`Crowd density: ${config.label}`}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        density === 'low' && 'bg-secondary',
        density === 'medium' && 'bg-neon-amber',
        density === 'high' && 'bg-destructive animate-pulse',
      )} />
      {config.label}
    </span>
  );
};

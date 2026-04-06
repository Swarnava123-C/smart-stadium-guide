import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'danger' | 'success';
  className?: string;
}

const variantStyles = {
  default: 'border-border/30',
  primary: 'border-primary/30 neon-glow',
  danger: 'border-destructive/30',
  success: 'border-secondary/30',
};

export const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon, variant = 'default', className
}) => (
  <div className={cn('glass rounded-xl p-4 transition-all duration-300 hover:bg-card/80', variantStyles[variant], className)}>
    <div className="flex items-start justify-between mb-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    <p className="text-2xl font-bold font-display">{value}</p>
    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

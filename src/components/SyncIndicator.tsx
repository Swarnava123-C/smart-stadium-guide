import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  visible: boolean;
  message?: string;
}

/**
 * Non-intrusive sync indicator — shows when data is temporarily syncing.
 * Replaces error states with graceful degradation.
 */
export const SyncIndicator: React.FC<Props> = ({ visible, message }) => {
  if (!visible) return null;

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg',
      'bg-muted/90 backdrop-blur-sm border border-border/30 shadow-lg',
      'animate-in fade-in slide-in-from-bottom-2 duration-300'
    )}>
      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
      <span className="text-xs text-muted-foreground">{message || 'Live data syncing…'}</span>
    </div>
  );
};

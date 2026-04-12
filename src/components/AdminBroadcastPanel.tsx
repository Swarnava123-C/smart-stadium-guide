import React, { useState } from 'react';
import { Megaphone, Send, AlertTriangle, Info, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminBroadcastPanelProps {
  onBroadcast: (title: string, message: string, severity: 'info' | 'warning' | 'critical') => void;
}

export const AdminBroadcastPanel: React.FC<AdminBroadcastPanelProps> = ({ onBroadcast }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    onBroadcast(title.trim(), message.trim(), severity);
    setTitle('');
    setMessage('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Broadcast Alert</h3>
      </div>

      <div className="space-y-2">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Alert title..."
          className="w-full h-8 rounded-lg bg-muted/50 border border-border/50 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          maxLength={100}
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Alert message to broadcast..."
          className="w-full h-16 rounded-lg bg-muted/50 border border-border/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
          maxLength={300}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Severity:</span>
        {(['info', 'warning', 'critical'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSeverity(s)}
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors',
              severity === s ? (
                s === 'critical' ? 'bg-destructive/20 border-destructive/40 text-destructive' :
                s === 'warning' ? 'bg-neon-amber/20 border-neon-amber/40 text-neon-amber' :
                'bg-primary/20 border-primary/40 text-primary'
              ) : 'border-border/30 text-muted-foreground hover:text-foreground'
            )}
          >
            {s === 'critical' ? <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" /> :
             s === 'warning' ? <Bell className="w-2.5 h-2.5 inline mr-0.5" /> :
             <Info className="w-2.5 h-2.5 inline mr-0.5" />}
            {s}
          </button>
        ))}
      </div>

      <button
        onClick={handleSend}
        disabled={!title.trim() || !message.trim()}
        className="w-full flex items-center justify-center gap-2 h-8 rounded-lg gradient-primary text-primary-foreground text-xs font-medium disabled:opacity-40 transition-opacity"
      >
        <Send className="w-3 h-3" />
        {sent ? '✓ Sent' : 'Broadcast'}
      </button>
    </div>
  );
};

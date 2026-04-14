import React from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComplianceViolation, ComplianceMetrics } from '@/hooks/useComplianceAudit';

interface Props {
  metrics: ComplianceMetrics;
  violations: ComplianceViolation[];
  onResolve: (id: string) => void;
}

export const AdminCompliancePanel: React.FC<Props> = ({ metrics, violations, onResolve }) => {
  const checks = [
    { label: 'Max Capacity', ok: metrics.capacityCompliant },
    { label: 'Exit Width Ratio', ok: metrics.exitWidthCompliant },
    { label: 'Medical Staff', ok: metrics.medicalStaffCompliant },
    { label: 'Security Staff', ok: metrics.securityStaffCompliant },
    { label: 'Density Threshold', ok: metrics.densityCompliant },
  ];

  const scoreColor = metrics.overallScore >= 80 ? 'text-secondary' : metrics.overallScore >= 50 ? 'text-neon-amber' : 'text-destructive';
  const unresolvedCount = violations.filter(v => !v.resolved).length;

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Safety Compliance
        </h3>
        <span className={cn('text-lg font-bold font-mono', scoreColor)}>{metrics.overallScore}%</span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {checks.map(c => (
          <div key={c.label} className={cn('rounded-lg p-2 text-center text-[10px]', c.ok ? 'bg-secondary/10' : 'bg-destructive/10')}>
            {c.ok ? <CheckCircle className="w-4 h-4 text-secondary mx-auto mb-1" /> : <XCircle className="w-4 h-4 text-destructive mx-auto mb-1" />}
            <p className={cn('font-medium', c.ok ? 'text-secondary' : 'text-destructive')}>{c.label}</p>
          </div>
        ))}
      </div>

      {unresolvedCount > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Unresolved Violations ({unresolvedCount})
          </p>
          {violations.filter(v => !v.resolved).slice(0, 5).map(v => (
            <div key={v.id} className={cn(
              'flex items-center justify-between py-1.5 px-2 rounded-lg text-xs',
              v.severity === 'critical' ? 'bg-destructive/10 border border-destructive/20' : 'bg-neon-amber/10 border border-neon-amber/20'
            )}>
              <div>
                <span className={cn('font-semibold uppercase text-[10px]',
                  v.severity === 'critical' ? 'text-destructive' : 'text-neon-amber'
                )}>{v.severity}</span>
                <span className="text-muted-foreground ml-2">{v.violationType.replace(/_/g, ' ')}</span>
              </div>
              <button onClick={() => onResolve(v.id)}
                className="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[10px] hover:bg-secondary/30">
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

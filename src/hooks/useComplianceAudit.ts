import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceViolation {
  id: string;
  eventId: string;
  violationType: string;
  severity: string;
  details: string | null;
  resolved: boolean;
  createdAt: string;
}

export interface ComplianceMetrics {
  capacityCompliant: boolean;
  exitWidthCompliant: boolean;
  medicalStaffCompliant: boolean;
  securityStaffCompliant: boolean;
  densityCompliant: boolean;
  overallScore: number;
}

/**
 * Government Safety Compliance Module (GSCM)
 */
export function useComplianceAudit(eventId?: string, currentAttendance?: number, capacity?: number) {
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    capacityCompliant: true,
    exitWidthCompliant: true,
    medicalStaffCompliant: true,
    securityStaffCompliant: true,
    densityCompliant: true,
    overallScore: 100,
  });
  const [loading, setLoading] = useState(true);

  const fetchViolations = useCallback(async () => {
    if (!eventId) return;
    const { data } = await supabase
      .from('compliance_audit_log')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (data) {
      setViolations(data.map((v: any) => ({
        id: v.id,
        eventId: v.event_id,
        violationType: v.violation_type,
        severity: v.severity,
        details: v.details,
        resolved: v.resolved,
        createdAt: v.created_at,
      })));
    }
    setLoading(false);
  }, [eventId]);

  // Check compliance in real-time
  const checkCompliance = useCallback(() => {
    if (!currentAttendance || !capacity) return;

    const ratio = currentAttendance / capacity;
    const caps = ratio <= 1.0;
    const density = ratio <= 0.95;
    // Simulated checks
    const exitWidth = ratio <= 0.9 || Math.random() > 0.1;
    const medical = Math.random() > 0.05;
    const security = ratio <= 0.85 || Math.random() > 0.15;

    let score = 100;
    if (!caps) score -= 30;
    if (!density) score -= 20;
    if (!exitWidth) score -= 15;
    if (!medical) score -= 15;
    if (!security) score -= 20;

    setMetrics({
      capacityCompliant: caps,
      exitWidthCompliant: exitWidth,
      medicalStaffCompliant: medical,
      securityStaffCompliant: security,
      densityCompliant: density,
      overallScore: Math.max(0, score),
    });
  }, [currentAttendance, capacity]);

  const logViolation = useCallback(async (type: string, severity: string, details: string) => {
    if (!eventId) return;
    await supabase.from('compliance_audit_log').insert({
      event_id: eventId,
      violation_type: type,
      severity,
      details,
    } as any);
    fetchViolations();
  }, [eventId, fetchViolations]);

  const resolveViolation = useCallback(async (id: string) => {
    await supabase.from('compliance_audit_log').update({ resolved: true } as any).eq('id', id);
    fetchViolations();
  }, [fetchViolations]);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  useEffect(() => {
    checkCompliance();
    const interval = setInterval(checkCompliance, 15000);
    return () => clearInterval(interval);
  }, [checkCompliance]);

  // Auto-log violations
  useEffect(() => {
    if (!eventId || !currentAttendance || !capacity) return;
    const ratio = currentAttendance / capacity;
    if (ratio > 1.0) {
      logViolation('capacity_exceeded', 'critical', `Attendance ${currentAttendance} exceeds capacity ${capacity}`);
    } else if (ratio > 0.95) {
      logViolation('density_threshold', 'high', `Density at ${Math.round(ratio * 100)}% — approaching legal limit`);
    }
  }, [currentAttendance, capacity, eventId]); // eslint-disable-line

  return { violations, metrics, loading, logViolation, resolveViolation };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { VenueEntity } from '@/types/stadium';

export interface CameraZone {
  id: string;
  zoneName: string;
  visualDensityScore: number;
  abnormalBehaviorFlag: boolean;
  movementDirection: { x: number; y: number };
  movementEntropy: number;
  anomalyType: string | null;
  confidence: number;
}

export interface VisionAnalytics {
  zones: CameraZone[];
  globalDensity: number;
  anomalyCount: number;
  reverseFlowDetected: boolean;
  rapidMovementDetected: boolean;
  anomalyTimeline: { timestamp: Date; zone: string; type: string }[];
}

/**
 * Computer Vision Crowd Analytics Model (CVCAM)
 * Simulates AI-driven video analysis for density estimation and anomaly detection.
 */
export function useCrowdVision(entities: VenueEntity[], isLive: boolean) {
  const [analytics, setAnalytics] = useState<VisionAnalytics>({
    zones: [],
    globalDensity: 0,
    anomalyCount: 0,
    reverseFlowDetected: false,
    rapidMovementDetected: false,
    anomalyTimeline: [],
  });

  const timelineRef = useRef<{ timestamp: Date; zone: string; type: string }[]>([]);

  const simulateVision = useCallback(() => {
    if (!isLive || entities.length === 0) return;

    const gates = entities.filter(e => e.type === 'gate' || e.type === 'emergency_exit');
    const allZones = entities.filter(e => e.type !== 'seat_block');

    const zones: CameraZone[] = allZones.map(entity => {
      const densityRatio = (entity.currentOccupancy || 0) / (entity.capacity || 100);
      const baseDensity = Math.round(densityRatio * 100);
      const jitter = Math.round((Math.random() - 0.5) * 10);
      const visualDensity = Math.min(100, Math.max(0, baseDensity + jitter));

      // Movement simulation
      const dirX = (Math.random() - 0.5) * 2;
      const dirY = (Math.random() - 0.5) * 2;
      const entropy = Math.round(Math.random() * 100);

      // Anomaly detection
      const isReverseFlow = dirY < -0.7 && densityRatio > 0.6;
      const isRapidMovement = entropy > 80 && densityRatio > 0.7;
      const isAbnormal = isReverseFlow || isRapidMovement || (visualDensity > 85 && entropy > 70);

      let anomalyType: string | null = null;
      if (isReverseFlow) anomalyType = 'Reverse crowd flow';
      else if (isRapidMovement) anomalyType = 'Rapid movement surge';
      else if (isAbnormal) anomalyType = 'Overcrowding cluster';

      if (anomalyType) {
        timelineRef.current = [
          { timestamp: new Date(), zone: entity.name, type: anomalyType },
          ...timelineRef.current,
        ].slice(0, 50);
      }

      return {
        id: entity.id,
        zoneName: entity.name,
        visualDensityScore: visualDensity,
        abnormalBehaviorFlag: isAbnormal,
        movementDirection: { x: Math.round(dirX * 100) / 100, y: Math.round(dirY * 100) / 100 },
        movementEntropy: entropy,
        anomalyType,
        confidence: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
      };
    });

    const globalDensity = zones.length > 0
      ? Math.round(zones.reduce((sum, z) => sum + z.visualDensityScore, 0) / zones.length)
      : 0;

    setAnalytics({
      zones,
      globalDensity,
      anomalyCount: zones.filter(z => z.abnormalBehaviorFlag).length,
      reverseFlowDetected: zones.some(z => z.anomalyType === 'Reverse crowd flow'),
      rapidMovementDetected: zones.some(z => z.anomalyType === 'Rapid movement surge'),
      anomalyTimeline: timelineRef.current,
    });
  }, [entities, isLive]);

  useEffect(() => {
    if (!isLive) return;
    simulateVision();
    const interval = setInterval(simulateVision, 5000);
    return () => clearInterval(interval);
  }, [simulateVision, isLive]);

  return { analytics, simulateVision };
}

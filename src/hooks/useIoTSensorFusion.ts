import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IoTSensor {
  id: string;
  stadiumId: string;
  zoneId: string;
  sensorType: string;
  value: number;
  confidenceScore: number;
  timestamp: string;
}

interface FusedDensity {
  zoneId: string;
  finalScore: number;
  level: 'low' | 'medium' | 'high';
  confidence: number;
  sensorBreakdown: Record<string, number>;
}

const SENSOR_WEIGHTS = {
  infrared_people_counter: 0.4,
  wifi_density_tracker: 0.3,
  motion_velocity_sensor: 0.2,
  noise_level_sensor: 0.1,
};

/**
 * IoT Sensor Fusion Layer
 * Combines multiple sensor inputs with weighted confidence scoring
 */
export function useIoTSensorFusion(stadiumId: string | undefined) {
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [fusedDensities, setFusedDensities] = useState<FusedDensity[]>([]);
  const [sensorHealth, setSensorHealth] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchSensors = useCallback(async () => {
    if (!stadiumId) return;
    const { data } = await supabase
      .from('iot_stream')
      .select('*')
      .eq('stadium_id', stadiumId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const mapped = data.map((d: any) => ({
        id: d.id,
        stadiumId: d.stadium_id,
        zoneId: d.zone_id,
        sensorType: d.sensor_type,
        value: d.value,
        confidenceScore: d.confidence_score,
        timestamp: d.created_at,
      }));
      setSensors(mapped);
      fuseSensorData(mapped);
    }
    setLoading(false);
  }, [stadiumId]);

  const fuseSensorData = (sensorData: IoTSensor[]) => {
    // Group by zone
    const byZone: Record<string, IoTSensor[]> = {};
    sensorData.forEach(s => {
      if (!byZone[s.zoneId]) byZone[s.zoneId] = [];
      byZone[s.zoneId].push(s);
    });

    const fused: FusedDensity[] = Object.entries(byZone).map(([zoneId, zoneSensors]) => {
      const breakdown: Record<string, number> = {};
      let weightedSum = 0;
      let totalWeight = 0;
      let avgConfidence = 0;
      const health: Record<string, boolean> = {};

      zoneSensors.forEach(sensor => {
        const weight = SENSOR_WEIGHTS[sensor.sensorType as keyof typeof SENSOR_WEIGHTS] || 0.1;
        breakdown[sensor.sensorType] = sensor.value;
        weightedSum += sensor.value * weight * sensor.confidenceScore;
        totalWeight += weight;
        avgConfidence += sensor.confidenceScore;
        health[sensor.sensorType] = sensor.confidenceScore > 0.3;
      });

      const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
      const confidence = zoneSensors.length > 0 ? avgConfidence / zoneSensors.length : 0;
      const level = finalScore < 40 ? 'low' : finalScore < 70 ? 'medium' : 'high';

      setSensorHealth(prev => ({ ...prev, ...health }));

      return { zoneId, finalScore: Math.round(finalScore), level, confidence: Math.round(confidence * 100) / 100, sensorBreakdown: breakdown };
    });

    setFusedDensities(fused);
  };

  // Simulate IoT data generation
  const simulateIoTData = useCallback(async () => {
    if (!stadiumId) return;
    const zones = ['north_gate', 'south_gate', 'east_gate', 'west_gate', 'food_court_a', 'washroom_north'];
    const sensorTypes = Object.keys(SENSOR_WEIGHTS);
    
    const inserts = zones.flatMap(zone =>
      sensorTypes.map(type => ({
        stadium_id: stadiumId,
        zone_id: zone,
        sensor_type: type,
        value: Math.round(20 + Math.random() * 70),
        confidence_score: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
      }))
    );

    await supabase.from('iot_stream').insert(inserts as any);
    fetchSensors();
  }, [stadiumId, fetchSensors]);

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 15000);
    return () => clearInterval(interval);
  }, [fetchSensors]);

  return { sensors, fusedDensities, sensorHealth, loading, simulateIoTData };
}

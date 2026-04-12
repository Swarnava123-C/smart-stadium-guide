import { useState, useCallback, useEffect, useRef } from 'react';
import { VenueEntity, CrowdDensity } from '@/types/stadium';

export interface RouteSegment {
  from: { x: number; y: number };
  to: { x: number; y: number };
  crowdLevel: CrowdDensity;
}

export interface OptimizedRoute {
  destination: VenueEntity;
  segments: RouteSegment[];
  estimatedTime: number; // minutes
  crowdLevel: CrowdDensity;
  totalDistance: number; // meters
  alternateRoute?: OptimizedRoute;
  isEmergency?: boolean;
}

// User position on the SVG map (center-ish, as if seated)
const USER_POSITION = { x: 50, y: 45 };

// Density weight multiplier (higher = more avoidance)
const DENSITY_WEIGHTS: Record<CrowdDensity, number> = {
  low: 1.0,
  medium: 1.5,
  high: 2.5,
};

function euclideanDist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Determine crowd level along a path by checking nearby entities
function getPathCrowdLevel(
  from: { x: number; y: number },
  to: { x: number; y: number },
  entities: VenueEntity[],
): CrowdDensity {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  // Check entities within 15 units of the path midpoint
  const nearby = entities.filter(e => {
    const dist = euclideanDist({ x: midX, y: midY }, e.position);
    return dist < 15 && e.id !== 'user';
  });
  
  if (nearby.length === 0) return 'low';
  
  const highCount = nearby.filter(e => e.crowdDensity === 'high').length;
  const medCount = nearby.filter(e => e.crowdDensity === 'medium').length;
  
  if (highCount > 0) return 'high';
  if (medCount > nearby.length * 0.5) return 'medium';
  return 'low';
}

// Find waypoints to avoid high-density zones
function findWaypoints(
  from: { x: number; y: number },
  to: { x: number; y: number },
  entities: VenueEntity[],
): { x: number; y: number }[] {
  const directCrowd = getPathCrowdLevel(from, to, entities);
  
  if (directCrowd !== 'high') {
    return []; // Direct path is fine
  }
  
  // Try to route around high-density areas
  // Generate candidate waypoints at 90-degree offsets
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const perpX = -dy * 0.3;
  const perpY = dx * 0.3;
  
  const candidates = [
    { x: (from.x + to.x) / 2 + perpX, y: (from.y + to.y) / 2 + perpY },
    { x: (from.x + to.x) / 2 - perpX, y: (from.y + to.y) / 2 - perpY },
  ];
  
  // Pick the waypoint with lower crowd density
  let bestWaypoint = candidates[0];
  let bestScore = Infinity;
  
  for (const wp of candidates) {
    // Keep within bounds
    if (wp.x < 5 || wp.x > 95 || wp.y < 5 || wp.y > 95) continue;
    
    const crowd1 = getPathCrowdLevel(from, wp, entities);
    const crowd2 = getPathCrowdLevel(wp, to, entities);
    const score = DENSITY_WEIGHTS[crowd1] + DENSITY_WEIGHTS[crowd2];
    
    if (score < bestScore) {
      bestScore = score;
      bestWaypoint = wp;
    }
  }
  
  return [bestWaypoint];
}

function calculateRoute(
  destination: VenueEntity,
  entities: VenueEntity[],
  isEmergencyMode: boolean,
): OptimizedRoute {
  const from = USER_POSITION;
  const to = destination.position;
  
  // Find waypoints to avoid congestion
  const waypoints = isEmergencyMode ? [] : findWaypoints(from, to, entities);
  const points = [from, ...waypoints, to];
  
  const segments: RouteSegment[] = [];
  let totalDist = 0;
  let worstCrowd: CrowdDensity = 'low';
  
  for (let i = 0; i < points.length - 1; i++) {
    const segCrowd = getPathCrowdLevel(points[i], points[i + 1], entities);
    const segDist = euclideanDist(points[i], points[i + 1]);
    totalDist += segDist;
    
    if (segCrowd === 'high') worstCrowd = 'high';
    else if (segCrowd === 'medium' && worstCrowd !== 'high') worstCrowd = 'medium';
    
    segments.push({
      from: points[i],
      to: points[i + 1],
      crowdLevel: segCrowd,
    });
  }
  
  // Convert SVG distance to real-world estimate (rough: 1 SVG unit ≈ 5m)
  const realDistance = Math.round(totalDist * 5);
  // Walking speed ~80m/min, adjusted by crowd
  const crowdMultiplier = DENSITY_WEIGHTS[worstCrowd];
  const estimatedTime = Math.round((realDistance / 80) * crowdMultiplier * 10) / 10;
  
  return {
    destination,
    segments,
    estimatedTime,
    crowdLevel: worstCrowd,
    totalDistance: realDistance,
    isEmergency: isEmergencyMode,
  };
}

export function useRouteOptimizer(entities: VenueEntity[], isEmergencyMode: boolean) {
  const [activeRoute, setActiveRoute] = useState<OptimizedRoute | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<VenueEntity | null>(null);
  const recalcTimerRef = useRef<ReturnType<typeof setInterval>>();

  const calculateOptimalRoute = useCallback((destination: VenueEntity) => {
    if (isEmergencyMode) {
      // In emergency, always route to nearest exit
      const exits = entities.filter(e => e.type === 'emergency_exit' && e.isAvailable);
      if (exits.length > 0) {
        const nearest = exits.reduce((best, e) => 
          euclideanDist(USER_POSITION, e.position) < euclideanDist(USER_POSITION, best.position) ? e : best
        , exits[0]);
        const route = calculateRoute(nearest, entities, true);
        setActiveRoute(route);
        setSelectedDestination(nearest);
        return route;
      }
    }
    
    const route = calculateRoute(destination, entities, false);
    
    // Calculate alternate route (find same-type entity with lower wait)
    const alternatives = entities.filter(e => 
      e.type === destination.type && e.id !== destination.id && e.isAvailable
    );
    
    if (alternatives.length > 0) {
      const bestAlt = alternatives.reduce((best, e) => 
        e.estimatedWaitTime < best.estimatedWaitTime ? e : best
      , alternatives[0]);
      
      if (bestAlt.estimatedWaitTime < destination.estimatedWaitTime * 0.7) {
        route.alternateRoute = calculateRoute(bestAlt, entities, false);
      }
    }
    
    setActiveRoute(route);
    setSelectedDestination(destination);
    return route;
  }, [entities, isEmergencyMode]);

  // Recalculate route every 15 seconds if active
  useEffect(() => {
    if (!selectedDestination) return;
    
    recalcTimerRef.current = setInterval(() => {
      calculateOptimalRoute(selectedDestination);
    }, 15000);
    
    return () => {
      if (recalcTimerRef.current) clearInterval(recalcTimerRef.current);
    };
  }, [selectedDestination, calculateOptimalRoute]);

  // Emergency mode override
  useEffect(() => {
    if (isEmergencyMode && entities.length > 0) {
      const exits = entities.filter(e => e.type === 'emergency_exit' && e.isAvailable);
      if (exits.length > 0) {
        const nearest = exits.reduce((best, e) => 
          euclideanDist(USER_POSITION, e.position) < euclideanDist(USER_POSITION, best.position) ? e : best
        , exits[0]);
        calculateOptimalRoute(nearest);
      }
    }
  }, [isEmergencyMode, entities, calculateOptimalRoute]);

  const clearRoute = useCallback(() => {
    setActiveRoute(null);
    setSelectedDestination(null);
    if (recalcTimerRef.current) clearInterval(recalcTimerRef.current);
  }, []);

  return {
    activeRoute,
    selectedDestination,
    calculateOptimalRoute,
    clearRoute,
    userPosition: USER_POSITION,
  };
}

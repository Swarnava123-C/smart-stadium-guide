import React from 'react';
import { OptimizedRoute } from '@/hooks/useRouteOptimizer';
import { CrowdDensity } from '@/types/stadium';

const crowdColors: Record<CrowdDensity, string> = {
  low: 'hsl(160,84%,45%)',
  medium: 'hsl(38,92%,50%)',
  high: 'hsl(0,72%,51%)',
};

interface RouteOverlayProps {
  route: OptimizedRoute | null;
  userPosition: { x: number; y: number };
  showAlternate?: boolean;
}

export const RouteOverlay: React.FC<RouteOverlayProps> = ({ route, userPosition, showAlternate = false }) => {
  if (!route) return null;

  const renderPath = (segments: typeof route.segments, isAlternate: boolean) => {
    if (segments.length === 0) return null;
    
    const points = [segments[0].from, ...segments.map(s => s.to)];
    const pathD = points.map((p, i) => 
      i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    ).join(' ');

    const mainColor = isAlternate ? 'hsl(var(--muted-foreground))' : crowdColors[route.crowdLevel];
    
    return (
      <g>
        {/* Glow effect */}
        <path
          d={pathD}
          fill="none"
          stroke={mainColor}
          strokeWidth={isAlternate ? '0.8' : '1.2'}
          opacity={isAlternate ? 0.2 : 0.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#routeGlow)"
        />
        
        {/* Main path */}
        <path
          d={pathD}
          fill="none"
          stroke={mainColor}
          strokeWidth={isAlternate ? '0.5' : '0.8'}
          opacity={isAlternate ? 0.4 : 0.9}
          strokeDasharray={isAlternate ? '2 1.5' : route.isEmergency ? '1 0.5' : '2 1'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate
            attributeName="stroke-dashoffset"
            values={isAlternate ? '0;-3.5' : '0;-3'}
            dur={route.isEmergency ? '0.5s' : '1.5s'}
            repeatCount="indefinite"
          />
        </path>

        {/* Destination marker */}
        {!isAlternate && (
          <g>
            <circle
              cx={route.destination.position.x}
              cy={route.destination.position.y}
              r="3.5"
              fill={mainColor}
              opacity="0.2"
            >
              <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </g>
    );
  };

  return (
    <g>
      {/* SVG Filter for glow */}
      <defs>
        <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Alternate route (if showing) */}
      {showAlternate && route.alternateRoute && renderPath(route.alternateRoute.segments, true)}
      
      {/* Main route */}
      {renderPath(route.segments, false)}

      {/* User position marker */}
      <circle cx={userPosition.x} cy={userPosition.y} r="2" fill="hsl(var(--primary))" opacity="0.8">
        <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={userPosition.x} cy={userPosition.y} r="1" fill="hsl(var(--primary-foreground))" />
    </g>
  );
};

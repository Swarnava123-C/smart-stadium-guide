import React from 'react';
import { VenueEntity } from '@/types/stadium';
import { cn } from '@/lib/utils';

interface Props {
  entities: VenueEntity[];
  currentAttendance: number;
  capacity: number;
}

const densityColor = (ratio: number) => {
  if (ratio > 0.8) return 'bg-destructive/60 border-destructive/80';
  if (ratio > 0.5) return 'bg-neon-amber/40 border-neon-amber/60';
  return 'bg-secondary/30 border-secondary/50';
};

const densityGlow = (ratio: number) => {
  if (ratio > 0.8) return 'shadow-[0_0_12px_rgba(239,68,68,0.5)]';
  if (ratio > 0.5) return 'shadow-[0_0_8px_rgba(245,158,11,0.3)]';
  return '';
};

/**
 * Stadium Digital Twin — 2D interactive heatmap visualization
 */
export const StadiumHeatmap: React.FC<Props> = ({ entities, currentAttendance, capacity }) => {
  const gates = entities.filter(e => e.type === 'gate');
  const exits = entities.filter(e => e.type === 'emergency_exit');
  const foodStalls = entities.filter(e => e.type === 'food_stall');
  const washrooms = entities.filter(e => e.type === 'washroom');
  const seatBlocks = entities.filter(e => e.type === 'seat_block');

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <span className="w-4 h-4 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[8px] text-primary-foreground font-bold">3D</span>
        Stadium Digital Twin
      </h3>

      <div className="relative w-full aspect-[16/10] bg-muted/20 rounded-xl border border-border/30 overflow-hidden">
        {/* Stadium oval outline */}
        <div className="absolute inset-[10%] border-2 border-dashed border-border/40 rounded-[50%]" />
        <div className="absolute inset-[18%] border border-border/20 rounded-[50%]" />

        {/* Center pitch */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[30%] bg-secondary/10 border border-secondary/30 rounded-lg flex items-center justify-center">
          <span className="text-[8px] text-secondary font-mono">PITCH</span>
        </div>

        {/* Render all entities */}
        {entities.map(entity => {
          const ratio = (entity.currentOccupancy || 0) / (entity.capacity || 100);
          const size = entity.type === 'seat_block' ? 'w-8 h-6' : entity.type === 'gate' || entity.type === 'emergency_exit' ? 'w-7 h-7' : 'w-6 h-6';
          const icon = entity.type === 'gate' ? '🚪' : entity.type === 'emergency_exit' ? '🚨' : entity.type === 'food_stall' ? '🍔' : entity.type === 'washroom' ? '🚻' : '💺';

          return (
            <div
              key={entity.id}
              className={cn(
                'absolute rounded-md border flex flex-col items-center justify-center cursor-pointer transition-all duration-500 hover:scale-125 hover:z-10',
                size,
                densityColor(ratio),
                densityGlow(ratio),
              )}
              style={{
                left: `${entity.position.x}%`,
                top: `${entity.position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title={`${entity.name}\nOccupancy: ${Math.round(ratio * 100)}%\nWait: ${entity.estimatedWaitTime}m`}
            >
              <span className="text-[10px]">{icon}</span>
              <span className="text-[6px] font-mono font-bold text-foreground">{Math.round(ratio * 100)}%</span>
            </div>
          );
        })}

        {/* Flow arrows — simulated */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          {gates.map((gate, i) => {
            const cx = 50;
            const cy = 50;
            return (
              <line
                key={gate.id}
                x1={gate.position.x}
                y1={gate.position.y}
                x2={cx + (gate.position.x - cx) * 0.3}
                y2={cy + (gate.position.y - cy) * 0.3}
                stroke="hsl(var(--primary))"
                strokeWidth="0.3"
                opacity="0.4"
                strokeDasharray="1,1"
              />
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex gap-2 text-[8px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-secondary/50" /> Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-neon-amber/50" /> Med</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-destructive/50" /> High</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
        <div><p className="font-mono font-bold text-sm text-foreground">{gates.length}</p><p className="text-muted-foreground">Gates</p></div>
        <div><p className="font-mono font-bold text-sm text-foreground">{exits.length}</p><p className="text-muted-foreground">Exits</p></div>
        <div><p className="font-mono font-bold text-sm text-foreground">{foodStalls.length}</p><p className="text-muted-foreground">F&B</p></div>
        <div><p className="font-mono font-bold text-sm text-foreground">{washrooms.length}</p><p className="text-muted-foreground">WC</p></div>
      </div>
    </div>
  );
};

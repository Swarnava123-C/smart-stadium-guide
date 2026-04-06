import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { StadiumState, VenueEntity, CrowdDensity, AdminLog } from '@/types/stadium';
import { initialVenueEntities } from '@/data/venueData';

interface StadiumContextType {
  state: StadiumState;
  logs: AdminLog[];
  updateEntity: (id: string, updates: Partial<VenueEntity>) => void;
  toggleEmergencyMode: () => void;
  addLog: (action: string, details: string) => void;
  getContextForAI: () => string;
}

const StadiumContext = createContext<StadiumContextType | null>(null);

export const useStadium = () => {
  const ctx = useContext(StadiumContext);
  if (!ctx) throw new Error('useStadium must be used within StadiumProvider');
  return ctx;
};

// Simulate crowd fluctuations
function simulateCrowdChange(entities: VenueEntity[]): VenueEntity[] {
  return entities.map(entity => {
    if (entity.type === 'emergency_exit') return entity;
    
    const fluctuation = (Math.random() - 0.5) * 0.1;
    const capacity = entity.capacity || 100;
    const currentOcc = entity.currentOccupancy || 0;
    const newOcc = Math.max(0, Math.min(capacity, Math.round(currentOcc + capacity * fluctuation)));
    
    const ratio = newOcc / capacity;
    const density: CrowdDensity = ratio < 0.4 ? 'low' : ratio < 0.7 ? 'medium' : 'high';
    
    const baseWait = entity.type === 'food_stall' ? 5 : entity.type === 'washroom' ? 3 : entity.type === 'gate' ? 2 : 0;
    const waitTime = Math.round(baseWait + (ratio * baseWait * 3));
    
    return {
      ...entity,
      currentOccupancy: newOcc,
      crowdDensity: density,
      estimatedWaitTime: waitTime,
    };
  });
}

export const StadiumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StadiumState>({
    entities: initialVenueEntities,
    isEmergencyMode: false,
    eventName: 'Champions League Final 2025',
    eventStartTime: new Date(Date.now() + 45 * 60000).toISOString(),
    totalCapacity: 60000,
    currentAttendance: 42000,
    userSeatBlock: 'block-a',
    userTicketType: 'general',
  });

  const [logs, setLogs] = useState<AdminLog[]>([]);

  // Simulate crowd changes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        entities: simulateCrowdChange(prev.entities),
        currentAttendance: Math.min(prev.totalCapacity, prev.currentAttendance + Math.floor(Math.random() * 200)),
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateEntity = useCallback((id: string, updates: Partial<VenueEntity>) => {
    setState(prev => ({
      ...prev,
      entities: prev.entities.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, []);

  const toggleEmergencyMode = useCallback(() => {
    setState(prev => ({ ...prev, isEmergencyMode: !prev.isEmergencyMode }));
  }, []);

  const addLog = useCallback((action: string, details: string) => {
    setLogs(prev => [{
      id: crypto.randomUUID(),
      action,
      details,
      timestamp: new Date(),
      adminEmail: 'admin',
    }, ...prev].slice(0, 100));
  }, []);

  const getContextForAI = useCallback(() => {
    const minutesToEvent = Math.max(0, Math.round((new Date(state.eventStartTime).getTime() - Date.now()) / 60000));
    const userBlock = state.entities.find(e => e.id === state.userSeatBlock);
    
    return JSON.stringify({
      event: state.eventName,
      minutesToEventStart: minutesToEvent,
      isEmergencyMode: state.isEmergencyMode,
      totalCapacity: state.totalCapacity,
      currentAttendance: state.currentAttendance,
      occupancyPercent: Math.round((state.currentAttendance / state.totalCapacity) * 100),
      userInfo: {
        seatBlock: userBlock?.name || 'Unknown',
        ticketType: state.userTicketType,
      },
      venues: state.entities.map(e => ({
        name: e.name,
        type: e.type,
        crowdDensity: e.crowdDensity,
        estimatedWaitTime: e.estimatedWaitTime + ' min',
        distanceFromUser: e.distanceFromUser + 'm',
        isAvailable: e.isAvailable,
        occupancy: e.currentOccupancy && e.capacity ? `${e.currentOccupancy}/${e.capacity}` : undefined,
      })),
    }, null, 2);
  }, [state]);

  return (
    <StadiumContext.Provider value={{ state, logs, updateEntity, toggleEmergencyMode, addLog, getContextForAI }}>
      {children}
    </StadiumContext.Provider>
  );
};

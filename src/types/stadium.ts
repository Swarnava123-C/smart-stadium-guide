export type CrowdDensity = 'low' | 'medium' | 'high';

export type TicketType = 'vip' | 'general';

export type VenueEntityType = 'gate' | 'food_stall' | 'washroom' | 'seat_block' | 'emergency_exit';

export interface VenueEntity {
  id: string;
  name: string;
  type: VenueEntityType;
  crowdDensity: CrowdDensity;
  estimatedWaitTime: number; // minutes
  distanceFromUser: number; // meters
  isAvailable: boolean;
  position: { x: number; y: number }; // SVG coordinates (percentage)
  capacity?: number;
  currentOccupancy?: number;
}

export interface StadiumState {
  entities: VenueEntity[];
  isEmergencyMode: boolean;
  eventName: string;
  eventStartTime: string;
  totalCapacity: number;
  currentAttendance: number;
  userSeatBlock: string;
  userTicketType: TicketType;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AdminLog {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
  adminEmail: string;
}

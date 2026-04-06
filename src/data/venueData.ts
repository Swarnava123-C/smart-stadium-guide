import { VenueEntity } from '@/types/stadium';

export const initialVenueEntities: VenueEntity[] = [
  // Gates
  { id: 'gate-north', name: 'North Gate', type: 'gate', crowdDensity: 'medium', estimatedWaitTime: 8, distanceFromUser: 120, isAvailable: true, position: { x: 50, y: 5 }, capacity: 500, currentOccupancy: 280 },
  { id: 'gate-south', name: 'South Gate', type: 'gate', crowdDensity: 'high', estimatedWaitTime: 15, distanceFromUser: 200, isAvailable: true, position: { x: 50, y: 95 }, capacity: 500, currentOccupancy: 420 },
  { id: 'gate-east', name: 'East Gate', type: 'gate', crowdDensity: 'low', estimatedWaitTime: 3, distanceFromUser: 80, isAvailable: true, position: { x: 95, y: 50 }, capacity: 400, currentOccupancy: 100 },
  { id: 'gate-west', name: 'West Gate', type: 'gate', crowdDensity: 'medium', estimatedWaitTime: 10, distanceFromUser: 150, isAvailable: true, position: { x: 5, y: 50 }, capacity: 400, currentOccupancy: 250 },

  // Food Stalls
  { id: 'food-1', name: 'Main Food Court', type: 'food_stall', crowdDensity: 'high', estimatedWaitTime: 20, distanceFromUser: 60, isAvailable: true, position: { x: 30, y: 25 }, capacity: 200, currentOccupancy: 180 },
  { id: 'food-2', name: 'Quick Bites Corner', type: 'food_stall', crowdDensity: 'low', estimatedWaitTime: 5, distanceFromUser: 90, isAvailable: true, position: { x: 70, y: 25 }, capacity: 150, currentOccupancy: 40 },
  { id: 'food-3', name: 'VIP Lounge Bar', type: 'food_stall', crowdDensity: 'low', estimatedWaitTime: 2, distanceFromUser: 40, isAvailable: true, position: { x: 50, y: 35 }, capacity: 80, currentOccupancy: 20 },
  { id: 'food-4', name: 'South Stand Snacks', type: 'food_stall', crowdDensity: 'medium', estimatedWaitTime: 12, distanceFromUser: 180, isAvailable: true, position: { x: 35, y: 75 }, capacity: 120, currentOccupancy: 75 },

  // Washrooms
  { id: 'wash-1', name: 'North Washroom A', type: 'washroom', crowdDensity: 'medium', estimatedWaitTime: 7, distanceFromUser: 50, isAvailable: true, position: { x: 25, y: 15 }, capacity: 30, currentOccupancy: 18 },
  { id: 'wash-2', name: 'East Washroom B', type: 'washroom', crowdDensity: 'high', estimatedWaitTime: 14, distanceFromUser: 100, isAvailable: true, position: { x: 85, y: 40 }, capacity: 25, currentOccupancy: 23 },
  { id: 'wash-3', name: 'South Washroom C', type: 'washroom', crowdDensity: 'low', estimatedWaitTime: 2, distanceFromUser: 160, isAvailable: true, position: { x: 65, y: 80 }, capacity: 35, currentOccupancy: 8 },
  { id: 'wash-4', name: 'West Washroom D', type: 'washroom', crowdDensity: 'low', estimatedWaitTime: 3, distanceFromUser: 70, isAvailable: true, position: { x: 15, y: 60 }, capacity: 30, currentOccupancy: 10 },

  // Seat Blocks
  { id: 'block-a', name: 'Block A (North Stand)', type: 'seat_block', crowdDensity: 'medium', estimatedWaitTime: 0, distanceFromUser: 0, isAvailable: true, position: { x: 50, y: 20 }, capacity: 5000, currentOccupancy: 3200 },
  { id: 'block-b', name: 'Block B (East Stand)', type: 'seat_block', crowdDensity: 'high', estimatedWaitTime: 0, distanceFromUser: 100, isAvailable: true, position: { x: 80, y: 50 }, capacity: 4000, currentOccupancy: 3600 },
  { id: 'block-c', name: 'Block C (South Stand)', type: 'seat_block', crowdDensity: 'high', estimatedWaitTime: 0, distanceFromUser: 200, isAvailable: true, position: { x: 50, y: 80 }, capacity: 5000, currentOccupancy: 4500 },
  { id: 'block-d', name: 'Block D (West Stand)', type: 'seat_block', crowdDensity: 'low', estimatedWaitTime: 0, distanceFromUser: 150, isAvailable: true, position: { x: 20, y: 50 }, capacity: 4000, currentOccupancy: 1800 },
  { id: 'block-vip', name: 'VIP Block', type: 'seat_block', crowdDensity: 'low', estimatedWaitTime: 0, distanceFromUser: 30, isAvailable: true, position: { x: 50, y: 45 }, capacity: 1000, currentOccupancy: 400 },

  // Emergency Exits
  { id: 'exit-ne', name: 'NE Emergency Exit', type: 'emergency_exit', crowdDensity: 'low', estimatedWaitTime: 0, distanceFromUser: 90, isAvailable: true, position: { x: 80, y: 15 } },
  { id: 'exit-nw', name: 'NW Emergency Exit', type: 'emergency_exit', crowdDensity: 'low', estimatedWaitTime: 0, distanceFromUser: 110, isAvailable: true, position: { x: 20, y: 15 } },
  { id: 'exit-se', name: 'SE Emergency Exit', type: 'emergency_exit', crowdDensity: 'low', estimatedWaitTime: 0, distanceFromUser: 170, isAvailable: true, position: { x: 80, y: 85 } },
  { id: 'exit-sw', name: 'SW Emergency Exit', type: 'emergency_exit', crowdDensity: 'low', estimatedWaitTime: 0, distanceFromUser: 190, isAvailable: true, position: { x: 20, y: 85 } },
];

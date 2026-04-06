import { VenueEntity } from '@/types/stadium';

/**
 * Generate venue entities specific to a stadium based on its properties.
 * Each stadium gets a unique layout based on its capacity and name.
 */
export function generateVenueEntities(stadiumId: string, stadiumName: string, capacity: number): VenueEntity[] {
  // Use stadium ID hash to create deterministic but unique layouts
  const seed = stadiumId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const gateCount = capacity > 80000 ? 6 : capacity > 40000 ? 4 : 3;
  const foodCount = capacity > 80000 ? 6 : capacity > 40000 ? 4 : 3;
  const washroomCount = capacity > 80000 ? 6 : capacity > 40000 ? 4 : 3;
  const blockCount = capacity > 80000 ? 6 : capacity > 40000 ? 5 : 4;

  const entities: VenueEntity[] = [];

  // Gate positions distributed around the stadium perimeter
  const gatePositions = [
    { x: 50, y: 5, name: 'North Gate' },
    { x: 50, y: 95, name: 'South Gate' },
    { x: 95, y: 50, name: 'East Gate' },
    { x: 5, y: 50, name: 'West Gate' },
    { x: 80, y: 12, name: 'NE Gate' },
    { x: 20, y: 12, name: 'NW Gate' },
  ];

  for (let i = 0; i < gateCount; i++) {
    const pos = gatePositions[i];
    const gateCap = Math.round(capacity * 0.004);
    const occ = Math.round(gateCap * (0.3 + (((seed + i * 7) % 60) / 100)));
    const ratio = occ / gateCap;
    entities.push({
      id: `gate-${i}`,
      name: pos.name,
      type: 'gate',
      crowdDensity: ratio < 0.4 ? 'low' : ratio < 0.7 ? 'medium' : 'high',
      estimatedWaitTime: Math.round(2 + ratio * 15),
      distanceFromUser: 50 + ((seed + i * 13) % 200),
      isAvailable: true,
      position: { x: pos.x, y: pos.y },
      capacity: gateCap,
      currentOccupancy: occ,
    });
  }

  // Food stalls
  const foodPositions = [
    { x: 30, y: 25, name: 'Main Food Court' },
    { x: 70, y: 25, name: 'Quick Bites Corner' },
    { x: 50, y: 35, name: 'VIP Lounge Bar' },
    { x: 35, y: 75, name: 'South Stand Snacks' },
    { x: 70, y: 75, name: 'East Stand Café' },
    { x: 20, y: 50, name: 'West Wing Diner' },
  ];

  for (let i = 0; i < foodCount; i++) {
    const pos = foodPositions[i];
    const foodCap = Math.round(capacity * 0.002);
    const occ = Math.round(foodCap * (0.2 + (((seed + i * 11) % 70) / 100)));
    const ratio = occ / foodCap;
    entities.push({
      id: `food-${i}`,
      name: pos.name,
      type: 'food_stall',
      crowdDensity: ratio < 0.4 ? 'low' : ratio < 0.7 ? 'medium' : 'high',
      estimatedWaitTime: Math.round(5 + ratio * 20),
      distanceFromUser: 30 + ((seed + i * 17) % 150),
      isAvailable: true,
      position: { x: pos.x, y: pos.y },
      capacity: foodCap,
      currentOccupancy: occ,
    });
  }

  // Washrooms
  const washPositions = [
    { x: 25, y: 15, name: 'North Washroom A' },
    { x: 85, y: 40, name: 'East Washroom B' },
    { x: 65, y: 80, name: 'South Washroom C' },
    { x: 15, y: 60, name: 'West Washroom D' },
    { x: 75, y: 15, name: 'NE Washroom E' },
    { x: 25, y: 85, name: 'SW Washroom F' },
  ];

  for (let i = 0; i < washroomCount; i++) {
    const pos = washPositions[i];
    const washCap = Math.round(capacity * 0.0005);
    const occ = Math.round(washCap * (0.2 + (((seed + i * 19) % 65) / 100)));
    const ratio = occ / washCap;
    entities.push({
      id: `wash-${i}`,
      name: pos.name,
      type: 'washroom',
      crowdDensity: ratio < 0.4 ? 'low' : ratio < 0.7 ? 'medium' : 'high',
      estimatedWaitTime: Math.round(3 + ratio * 12),
      distanceFromUser: 40 + ((seed + i * 23) % 130),
      isAvailable: true,
      position: { x: pos.x, y: pos.y },
      capacity: washCap,
      currentOccupancy: occ,
    });
  }

  // Seat Blocks
  const blockPositions = [
    { x: 50, y: 20, name: 'Block A (North Stand)' },
    { x: 80, y: 50, name: 'Block B (East Stand)' },
    { x: 50, y: 80, name: 'Block C (South Stand)' },
    { x: 20, y: 50, name: 'Block D (West Stand)' },
    { x: 50, y: 45, name: 'VIP Block' },
    { x: 65, y: 30, name: 'Block E (NE Stand)' },
  ];

  for (let i = 0; i < blockCount; i++) {
    const pos = blockPositions[i];
    const blockCap = i === 4 ? Math.round(capacity * 0.05) : Math.round(capacity / blockCount);
    const occ = Math.round(blockCap * (0.3 + (((seed + i * 29) % 55) / 100)));
    const ratio = occ / blockCap;
    entities.push({
      id: `block-${i}`,
      name: pos.name,
      type: 'seat_block',
      crowdDensity: ratio < 0.4 ? 'low' : ratio < 0.7 ? 'medium' : 'high',
      estimatedWaitTime: 0,
      distanceFromUser: (i === 0 ? 0 : 50 + ((seed + i * 31) % 180)),
      isAvailable: true,
      position: { x: pos.x, y: pos.y },
      capacity: blockCap,
      currentOccupancy: occ,
    });
  }

  // Emergency Exits (always 4)
  const exitPositions = [
    { x: 80, y: 15, name: 'NE Emergency Exit' },
    { x: 20, y: 15, name: 'NW Emergency Exit' },
    { x: 80, y: 85, name: 'SE Emergency Exit' },
    { x: 20, y: 85, name: 'SW Emergency Exit' },
  ];

  exitPositions.forEach((pos, i) => {
    entities.push({
      id: `exit-${i}`,
      name: pos.name,
      type: 'emergency_exit',
      crowdDensity: 'low',
      estimatedWaitTime: 0,
      distanceFromUser: 80 + ((seed + i * 37) % 120),
      isAvailable: true,
      position: { x: pos.x, y: pos.y },
    });
  });

  return entities;
}

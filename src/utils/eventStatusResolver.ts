/**
 * Centralized Event Status Resolver
 * 
 * Status is NEVER stored statically — it is always computed
 * from real-time server timestamps.
 * 
 * All components (Public UI, Admin, AI Assistant, Smart Routing, Notifications)
 * must use this single source of truth.
 */

export type ResolvedEventStatus = 'upcoming' | 'live' | 'completed';

const EVENT_DURATION_BUFFER_MS = 30 * 60 * 1000; // 30-minute buffer for delays/ceremonies

export interface EventWithTimes {
  event_date: string;   // start time (ISO)
  end_time: string;     // end time (ISO)
  [key: string]: any;
}

export type ResolvedEvent<T extends EventWithTimes> = Omit<T, 'status'> & {
  status: ResolvedEventStatus;
};

/**
 * Resolve a single event's status from current time.
 * Uses server time if available, falls back to client time.
 */
export function resolveEventStatus(
  startTime: string,
  endTime: string,
  now?: Date
): ResolvedEventStatus {
  const currentTime = now || new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  // Add buffer to end time for delays/extra overs/ceremonies
  const bufferedEnd = new Date(end.getTime() + EVENT_DURATION_BUFFER_MS);

  if (currentTime < start) return 'upcoming';
  if (currentTime >= start && currentTime <= bufferedEnd) return 'live';
  return 'completed';
}

/**
 * Resolve status for an array of events.
 * Overwrites any stored `status` field with the computed value.
 */
export function resolveAllEvents<T extends EventWithTimes>(
  events: T[],
  now?: Date
): ResolvedEvent<T>[] {
  const currentTime = now || new Date();
  return events.map(event => ({
    ...event,
    status: resolveEventStatus(event.event_date, event.end_time, currentTime),
  }));
}

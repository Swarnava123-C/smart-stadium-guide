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
  is_paused?: boolean;
  overtime_active?: boolean;
  overtime_minutes_added?: number;
  delay_total_minutes?: number;
  is_locked?: boolean;
  [key: string]: any;
}

export type ResolvedEvent<T extends EventWithTimes> = Omit<T, 'status'> & {
  status: ResolvedEventStatus;
};

/**
 * Resolve a single event's status from current time.
 * Respects paused state, overtime extensions, and delay buffers.
 */
export function resolveEventStatus(
  startTime: string,
  endTime: string,
  now?: Date,
  options?: {
    isPaused?: boolean;
    overtimeActive?: boolean;
    overtimeMinutesAdded?: number;
    delayTotalMinutes?: number;
    isLocked?: boolean;
  }
): ResolvedEventStatus {
  // If locked, it's completed regardless
  if (options?.isLocked) return 'completed';

  const currentTime = now || new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Calculate total buffer: base + overtime + delay
  const overtimeMs = (options?.overtimeMinutesAdded || 0) * 60 * 1000;
  const delayMs = (options?.delayTotalMinutes || 0) * 60 * 1000;
  const totalBuffer = EVENT_DURATION_BUFFER_MS + overtimeMs + delayMs;
  const bufferedEnd = new Date(end.getTime() + totalBuffer);

  if (currentTime < start) return 'upcoming';
  
  // If paused or overtime active, keep as live even past buffered end
  if (options?.isPaused || options?.overtimeActive) {
    if (currentTime >= start) return 'live';
  }
  
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
    status: resolveEventStatus(event.event_date, event.end_time, currentTime, {
      isPaused: event.is_paused,
      overtimeActive: event.overtime_active,
      overtimeMinutesAdded: event.overtime_minutes_added,
      delayTotalMinutes: event.delay_total_minutes,
      isLocked: event.is_locked,
    }),
  }));
}

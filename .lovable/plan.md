
## ArenaFlow AI — Major Feature Upgrade Plan

### Phase 1: Database Schema
Create three new tables in Lovable Cloud:
- **stadiums** — name, city, capacity, lat/lng, crowd_status
- **events** — linked to stadium, event_name, date, expected_attendance, status (upcoming/live/completed)
- **attendance_logs** — linked to event, timestamp, current_attendance, avg_wait_time, entry_rate, gate_statuses

Seed with ~8-10 real Indian stadiums (Narendra Modi, Wankhede, Eden Gardens, etc.) and sample events.

### Phase 2: Interactive India Map (Home Page)
- Replace current dashboard as the landing page
- Use **Leaflet.js** with OpenStreetMap tiles (free, no API key needed)
- Plot stadiums as color-coded markers (🟢🟡🔴 by crowd status)
- Click stadium → navigate to detailed dashboard

### Phase 3: Stadium Dashboard (replaces old dashboard)
- **Route**: `/stadium/:id`
- Shows real-time KPIs for selected stadium's live event
- Past events table with attendance, peak crowd, avg wait
- Upcoming events with AI risk prediction score
- 30-minute attendance trend chart (recharts)

### Phase 4: Live Simulation Engine
- When `current_time >= event_date` and status is "upcoming" → auto-set to "Live"
- Simulate attendance growth: +50-200 people per tick
- When attendance >= expected → set to "Completed"
- Update attendance_logs every tick with entry_rate, wait times, gate status

### Phase 5: AI Intelligence Layer
1. **Crowd Surge Prediction** — project 15-min entry growth vs gate capacity, trigger warnings at 85%+
2. **Gate Optimization Engine** — if avg wait > 8min & gates available, recommend opening specific gates with estimated wait reduction
3. **Risk Score** — pre-event prediction using attendance/capacity ratio + historical data

### Phase 6: Emergency Mode Override
- Admin toggle forces all gates open, overrides AI, switches to alert theme
- Logs admin action with timestamp
- Pauses predictive calculations
- Deactivation restores normal operation

### Phase 7: Integration
- Trend graph detects surge patterns → triggers warning → triggers AI recommendation
- Admin can override via emergency mode
- All features share the same live simulation data

### Tech Choices
- **Leaflet.js** + react-leaflet for India map (free)
- **Recharts** for trend graphs (already installed)
- Existing StadiumContext refactored to work per-stadium
- Edge function updated for per-stadium AI context

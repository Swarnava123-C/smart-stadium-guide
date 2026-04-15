# 🚀 ArenaFlow AI

### AI-Powered Smart Stadium Intelligence Platform

**Built for Google PromptWars (Virtual) – Build with AI Challenge**

---

## 🏟 Problem Statement

Design a solution that improves the physical event experience for attendees at large-scale sporting venues.

The system must address:

* Crowd movement optimization
* Waiting time reduction
* Real-time coordination
* Safety compliance
* Emergency management
* Seamless attendee experience

---

## 💡 Solution Overview

**ArenaFlow AI** is a full-stack intelligent stadium operations platform that combines:

* Real-time crowd simulation
* AI-powered surge prediction
* Voice-based stadium assistant
* Lifecycle-driven event automation
* Evacuation modeling
* National command monitoring

It transforms traditional venue management into a **predictive, AI-augmented command system**.

---
<img width="1536" height="1024" alt="WhatsApp Image 2026-04-16 at 12 07 29 AM" src="https://github.com/user-attachments/assets/c4cb06b9-8d65-4b03-a26d-68b7890ffac6" />


# 🎯 Core System Modules

---

## 👥 1️⃣ Public Stadium Interface (Attendee Mode)

### 🔥 Live Experience Features

* Real-time crowd density heatmap
* Smart gate recommendations
* Shortest wait-time suggestions
* 30-minute trend visibility
* Live occupancy per entity (gates, food courts, washrooms)

### 🎙 AI Assistant (Chat + Call Mode)

* Text Chat Mode
* Voice Call Mode (Web Speech API)
* Continuous listening
* Auto-restart on speech end
* Multi-language support
* Emergency override mode
* Venue-aware contextual responses

### 🧭 Smart Route Optimization System

* AI-driven entry balancing
* Dynamic gate load redistribution
* Congestion-aware navigation suggestions

### 📲 Smart Push Notification Alert System

* Live congestion alerts
* Emergency evacuation instructions
* Multilingual safety announcements
* Non-panic calming guidance

---

## 🧑‍💼 2️⃣ Admin Command Center (Operational Mode)

### 📊 Executive Summary Bar

* High / Medium / Low Density Zone Count
* Average Wait Time
* Entry Rate
* Surge Risk Percentage

### 🚨 Surge Prediction Panel

* Dynamic Risk Score
* Congestion Index
* AI Recommendations
* Auto Gate Suggestions

### 📈 30-Min Trend Graphs

* Entry Rate Trend
* Wait Time Trend
* Surge Risk Trend

### 🔴 Auto Escalation Indicators

* Zone cards glow based on threshold
* Red overlay during critical surge
* Acknowledgment-required incident modal

### ⚡ Emergency Control System

* Activate Emergency Mode
* Voice override enforcement
* Incident logging
* Public broadcast option

### 🌧 Match Delay + Overtime Handling

* Rain delay simulation
* Technical pause support
* Super Over / Tie Break / Ceremony buffer
* Dynamic end-time extension
  
<img width="1600" height="706" alt="WhatsApp Image 2026-04-16 at 12 14 23 AM" src="https://github.com/user-attachments/assets/25006c63-0751-4f72-b187-da3d6d7dc511" />

---

## 🏛 3️⃣ National Command Center

* Multi-stadium monitoring
* Risk severity ranking
* Inter-stadium comparison charts
* Live occupancy comparison
* India heatmap visualization

Designed for centralized event governance.

---

# 🧠 AI & Intelligence Layer

---

## 🔮 Surge Prediction Engine (ECIRS)

* Density-based risk modeling
* Threshold scoring
* Gate load imbalance detection
* Predictive congestion warnings

---

## 🧍 Crowd Psychology Risk Model

* Panic Index
* Aggression Index
* Density Stress Score
* Behavioral anomaly detection

---

## 🏃 Real-Time Evacuation Simulation Engine

* Zone-by-zone flow tracking
* Exit distribution optimization
* AI escape path balancing
* Evacuation logs

---

## 🎥 Computer Vision Crowd Analytics (Simulated)

* Reverse flow detection
* Rapid movement anomaly detection
* Overcrowding cluster alerts
* Anomaly timeline tracking

---

## 📡 IoT Sensor Fusion Layer

Simulated sensors:

* Infrared
* WiFi tracking
* Motion
* Noise detection

Weighted confidence scoring engine for reliability.

---

## 🏛 Government Safety Compliance Module

* Capacity compliance validation
* Exit width verification
* Medical & security staffing audit
* Density threshold monitoring
* Auto-logged compliance violations

---

# 🔁 Server-Side Lifecycle Engine

Edge function runs every 60 seconds via cron:

Event States:

* scheduled
* active
* finalizing
* archived

On completion:

* Generates event snapshots
* Stores final attendance
* Captures peak surge
* Calculates average wait

Ensures automatic event transitions:

* Upcoming → Live
* Live → Completed
* Completed → Archived

Fully server-controlled (not client dependent).

---

# 🏗 System Architecture

<img width="1536" height="1024" alt="WhatsApp Image 2026-04-16 at 12 07 29 AM (1)" src="https://github.com/user-attachments/assets/9dfda09f-7acb-4c2b-9e46-0f540e5e875b" />


# 🗂 System Layers

1. User Layer
2. Public Interface Layer
3. Admin Command Layer
4. National Command Layer
5. Event Lifecycle Engine
6. Surge Prediction Engine
7. Crowd Psychology Model
8. Evacuation Simulation Engine
9. IoT Sensor Fusion
10. Compliance Monitoring

<img width="1600" height="711" alt="WhatsApp Image 2026-04-16 at 12 14 23 AM (1)" src="https://github.com/user-attachments/assets/d6889093-251d-45ee-9eca-839f68fd39c4" />

---

# ⚙ Tech Stack

### Frontend

* React 18 + TypeScript
* Tailwind CSS v3
* Recharts
* Leaflet + OpenStreetMap

### Backend

* Supabase (PostgreSQL + RLS)
* Supabase Edge Functions
* Supabase Realtime (WebSocket)

### AI Engine

* Gemini via Lovable AI Gateway

### Voice

* Web Speech API

### Infrastructure

* Docker
* Google Cloud Run

---

# 🔐 Security

* Role-Based Access Control
* Row-Level Security (RLS)
* Admin-only protected routes
* Incident logging
* Emergency isolation mode

---

# 📈 Performance Optimizations

* Indexed queries (8 DB indexes)
* useMemo-based filtering
* Throttled simulation (8s tick)
* Attendance log capped buffer
* WebSocket auto-reconnect
* ErrorBoundary crash protection

---

# 🧪 Fault Tolerance

* ErrorBoundary wrapper
* Sync indicator for delayed updates
* Try/catch auto retry in simulation
* Lifecycle engine guard against manual override

---

# 🗃 Database Tables

* events
* attendance_logs
* event_snapshots
* event_daily_snapshots
* evacuation_logs
* iot_stream
* compliance_audit_log

---

# 🚀 Deployment

### Docker Build

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/arenflow-ai
```

### Deploy to Cloud Run

```bash
gcloud run deploy arenflow-ai \
--image gcr.io/PROJECT_ID/arenflow-ai \
--platform managed \
--region asia-south1 \
--allow-unauthenticated
```

---

# 💻 Local Development

```bash
npm install
npm run dev
```

Ensure environment variables are configured for:

* Supabase URL
* Supabase Anon Key
* Gemini API Key

---

# 📊 Evaluation Alignment

ArenaFlow AI addresses:

✅ Crowd Movement
✅ Waiting Time Optimization
✅ Real-Time Coordination
✅ Emergency Management
✅ Compliance Enforcement
✅ Seamless Attendee Experience

---

# 🌍 Future Scope

* Real IoT hardware integration
* Real CV camera deployment
* ML-based surge forecasting
* Multi-event federation layer
* Disaster-scale command integration

---

# 🏁 Conclusion

ArenaFlow AI is not just a dashboard.
It is a full-stack, AI-driven stadium intelligence ecosystem designed for:

* Predictive safety
* Operational control
* Real-time public guidance
* National-level oversight

Built for **Google PromptWars – Build with AI**.




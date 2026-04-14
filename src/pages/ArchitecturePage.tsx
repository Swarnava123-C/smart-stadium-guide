import React from 'react';
import { 
  Layers, Database, Cpu, Radio, Shield, Zap, Globe, Eye, Brain, 
  ArrowRight, Users, BarChart3, Smartphone, Server, Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="glass rounded-xl p-5 space-y-3 hover:border-primary/20 border border-transparent transition-colors duration-300">
    <h3 className="font-display font-semibold text-sm flex items-center gap-2">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const FlowStep: React.FC<{ steps: string[] }> = ({ steps }) => (
  <div className="flex items-center gap-2 flex-wrap text-xs">
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <span className="px-3 py-1.5 rounded-lg bg-muted/50 font-medium text-foreground">{step}</span>
        {i < steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
      </React.Fragment>
    ))}
  </div>
);

const TechBadge: React.FC<{ label: string; tech: string }> = ({ label, tech }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/10 last:border-0 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono font-medium text-primary">{tech}</span>
  </div>
);

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">
          <span className="gradient-text">System Architecture</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ArenaFlow AI — Enterprise-grade Stadium Crowd Intelligence Platform
        </p>
      </div>

      {/* High-Level Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="User Layer" icon={<Users className="w-4 h-4 text-primary" />}>
          <p className="text-xs text-muted-foreground">Attendees access the platform via mobile or web. They receive real-time navigation, crowd alerts, and voice-guided safety instructions.</p>
          <FlowStep steps={['User Opens App', 'Stadium Selection', 'Live Dashboard', 'Smart Route / Alerts']} />
        </Section>

        <Section title="Public UI Layer" icon={<Smartphone className="w-4 h-4 text-secondary" />}>
          <p className="text-xs text-muted-foreground">Calm, minimal interface showing venue map, navigation routes, crowd density indicators, and emergency guidance.</p>
          <FlowStep steps={['Venue Map', 'Route Overlay', 'Gate Status', 'Safety Alerts']} />
        </Section>

        <Section title="Admin Control Layer" icon={<Shield className="w-4 h-4 text-neon-amber" />}>
          <p className="text-xs text-muted-foreground">Role-authenticated command center with full operational control — delay management, overtime extensions, evacuation triggers, and compliance monitoring.</p>
          <FlowStep steps={['Auth', 'Stadium Select', 'Executive Summary', 'Action Controls']} />
        </Section>

        <Section title="National Command Layer" icon={<Globe className="w-4 h-4 text-destructive" />}>
          <p className="text-xs text-muted-foreground">Centralized cross-stadium monitoring with risk escalation, comparison charts, and emergency feed across all Indian venues.</p>
          <FlowStep steps={['India Map', 'Risk Ranking', 'Emergency Feed', 'Cross-Stadium Compare']} />
        </Section>
      </div>

      {/* Processing Engines */}
      <h2 className="text-lg font-display font-semibold mt-4">Processing Engines</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Event State Engine" icon={<Cpu className="w-4 h-4 text-primary" />}>
          <p className="text-xs text-muted-foreground">Server-authoritative lifecycle management. Events auto-transition between states based on timestamps.</p>
          <div className="space-y-2">
            <FlowStep steps={['Scheduled', 'Active', 'Finalizing', 'Archived']} />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>Edge Function</strong> runs every 60s via pg_cron</p>
              <p>• Respects delay buffers, overtime, and pause states</p>
              <p>• Creates snapshot on completion (attendance, peak risk, revenue)</p>
              <p>• Frontend resolves status independently for instant UI response</p>
            </div>
          </div>
        </Section>

        <Section title="Surge Prediction Engine" icon={<Brain className="w-4 h-4 text-purple-400" />}>
          <p className="text-xs text-muted-foreground">Multi-signal crowd surge prediction combining density, entry rate, and wait times.</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Input:</strong> Entry rate, gate capacity, wait times, density ratio</p>
            <p><strong>Processing:</strong> Weighted risk formula with exponential growth detection</p>
            <p><strong>Decision:</strong> Risk {'>'} 70% → warning, {'>'} 85% → critical alert</p>
            <p><strong>Action:</strong> Gate recommendations, crowd dispersal, admin escalation</p>
          </div>
        </Section>

        <Section title="Crowd Psychology Model" icon={<Brain className="w-4 h-4 text-neon-amber" />}>
          <p className="text-xs text-muted-foreground">Behavioral risk modeling for panic prediction before physical surge.</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Panic Index:</strong> Exponential growth when density {'>'} 80% + wait {'>'} 15min</p>
            <p><strong>Aggression Index:</strong> Based on high-density zone clusters</p>
            <p><strong>Density Stress:</strong> Composite of occupancy ratio and congestion</p>
            <p><strong>Trigger:</strong> Panic {'>'} 70% → calming announcements + exit opening</p>
          </div>
        </Section>

        <Section title="Evacuation Simulation (RESE)" icon={<Shield className="w-4 h-4 text-destructive" />}>
          <p className="text-xs text-muted-foreground">Real-time zone-based evacuation modeling with AI exit distribution optimization.</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Input:</strong> Zone populations, gate widths, congestion scores</p>
            <p><strong>Processing:</strong> Per-zone flow rate simulation every 10 seconds</p>
            <p><strong>Decision:</strong> Rebalance when any corridor {'>'} 85% density</p>
            <p><strong>Action:</strong> Dynamic exit % distribution, estimated clear time</p>
          </div>
        </Section>
      </div>

      {/* Data Layers */}
      <h2 className="text-lg font-display font-semibold mt-4">Data & Sensor Layers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="IoT Sensor Fusion" icon={<Radio className="w-4 h-4 text-primary" />}>
          <p className="text-xs text-muted-foreground">Multi-sensor density estimation with weighted confidence scoring.</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Infrared People Counter (40%) + WiFi Density (30%)</p>
            <p>Motion Velocity (20%) + Noise Level (10%)</p>
            <p>Confidence-weighted fallback when sensors degrade</p>
          </div>
        </Section>

        <Section title="Computer Vision Analytics" icon={<Eye className="w-4 h-4 text-purple-400" />}>
          <p className="text-xs text-muted-foreground">Simulated AI video analysis for anomaly detection.</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Overcrowding cluster detection</p>
            <p>• Reverse crowd flow identification</p>
            <p>• Rapid movement surge alerts</p>
            <p>• Privacy-safe: anonymized blob tracking only</p>
          </div>
        </Section>

        <Section title="Database Architecture" icon={<Database className="w-4 h-4 text-secondary" />}>
          <p className="text-xs text-muted-foreground">Postgres with Row-Level Security, real-time subscriptions, and automated snapshots.</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Core Tables:</strong> stadiums, events, attendance_logs</p>
            <p><strong>Analytics:</strong> event_snapshots, event_daily_snapshots</p>
            <p><strong>Safety:</strong> evacuation_logs, compliance_audit_log</p>
            <p><strong>Sensors:</strong> iot_stream</p>
            <p><strong>Auth:</strong> user_roles (admin/moderator/user)</p>
          </div>
        </Section>

        <Section title="Emergency Protocol Engine" icon={<Zap className="w-4 h-4 text-destructive" />}>
          <p className="text-xs text-muted-foreground">Multi-tier emergency response with ECIRS escalation.</p>
          <FlowStep steps={['Threshold Breach', 'Warning Alert', 'Critical Alert', 'Red Alert + Evacuation']} />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Debounced alerts (30s cooldown per type)</p>
            <p>• Admin emergency toggle overrides all AI</p>
            <p>• Voice assistant switches to safety-only mode</p>
            <p>• All triggers logged with timestamp + source</p>
          </div>
        </Section>
      </div>

      {/* Smart Routing & Alerts */}
      <h2 className="text-lg font-display font-semibold mt-4">Intelligence Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Smart Route Optimization" icon={<Layers className="w-4 h-4 text-primary" />}>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Input:</strong> Destination type, current position, zone densities</p>
            <p><strong>Processing:</strong> Multi-factor scoring: distance × density × wait time</p>
            <p><strong>Output:</strong> Ranked route options with estimated arrival times</p>
            <p><strong>Update:</strong> Recalculated every 30 seconds based on live data</p>
          </div>
        </Section>

        <Section title="Push Alert System" icon={<Wifi className="w-4 h-4 text-neon-amber" />}>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Triggers:</strong> Gate congestion, food queue, surge detected, emergency</p>
            <p><strong>Cooldown:</strong> 5-minute per alert type to prevent spam</p>
            <p><strong>Delivery:</strong> In-app toast + notification center + voice override</p>
            <p><strong>Admin:</strong> Manual broadcast capability with severity control</p>
          </div>
        </Section>
      </div>

      {/* Tech Stack */}
      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" /> Technology Stack
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <TechBadge label="Frontend" tech="React 18 + TypeScript" />
            <TechBadge label="Styling" tech="Tailwind CSS v3" />
            <TechBadge label="Charts" tech="Recharts" />
            <TechBadge label="Maps" tech="Leaflet + OpenStreetMap" />
            <TechBadge label="Voice" tech="Web Speech API" />
          </div>
          <div>
            <TechBadge label="Backend" tech="Supabase Edge Functions" />
            <TechBadge label="Database" tech="PostgreSQL + RLS" />
            <TechBadge label="AI Engine" tech="Gemini (Lovable AI Gateway)" />
            <TechBadge label="Realtime" tech="Supabase Realtime (WebSocket)" />
            <TechBadge label="IoT Layer" tech="Simulated Sensor Fusion" />
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-secondary" /> Safety Compliance
        </h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Real-time monitoring of max capacity, exit width ratio, staff ratios, and density thresholds</p>
          <p>• Automatic violation logging with severity classification</p>
          <p>• Compliance audit trail exportable for district authorities and disaster management</p>
          <p>• Role-based access with admin/moderator/user separation</p>
        </div>
      </div>
    </div>
  );
};

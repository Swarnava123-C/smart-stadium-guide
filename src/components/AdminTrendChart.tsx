import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AttendanceLog } from '@/hooks/useStadiums';
import { TrendingUp } from 'lucide-react';

interface Props {
  logs: AttendanceLog[];
  title?: string;
}

export const AdminTrendChart: React.FC<Props> = ({ logs, title = 'Gate Metrics Trend (Last 30 Min)' }) => {
  const chartData = useMemo(() => {
    // Get last 30 minutes of data
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    return logs
      .filter(l => new Date(l.created_at) >= thirtyMinAgo)
      .map(l => ({
        time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attendance: l.current_attendance,
        entryRate: l.entry_rate,
        waitTime: Math.round(l.avg_wait_time * 10) / 10,
        surgeRisk: Math.round(l.surge_risk_score * 100),
      }));
  }, [logs]);

  if (chartData.length < 2) {
    return (
      <div className="glass rounded-xl p-4 text-center">
        <TrendingUp className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Trend data will appear once more metrics are collected</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm">{title}</h3>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
            <Line yAxisId="left" type="monotone" dataKey="entryRate" stroke="hsl(var(--primary))" name="Entry Rate" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="waitTime" stroke="hsl(var(--destructive))" name="Wait Time" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="surgeRisk" stroke="#f59e0b" name="Surge Risk %" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

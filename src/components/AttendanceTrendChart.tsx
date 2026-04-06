import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { AttendanceLog } from '@/hooks/useStadiums';
import { Activity } from 'lucide-react';

interface AttendanceTrendChartProps {
  logs: AttendanceLog[];
  expectedAttendance: number;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({ logs, expectedAttendance }) => {
  if (logs.length === 0) {
    return (
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Attendance Trend</h3>
        </div>
        <p className="text-sm text-muted-foreground">No attendance data yet for this event.</p>
      </div>
    );
  }

  const chartData = logs.map((log) => ({
    time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    attendance: log.current_attendance,
    entryRate: log.entry_rate,
    waitTime: log.avg_wait_time,
    surgeRisk: Math.round(log.surge_risk_score * 100),
  }));

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm">30-Minute Attendance Trend</h3>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(187,100%,50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(187,100%,50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222,44%,9%)',
                border: '1px solid hsl(222,30%,18%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(210,40%,96%)' }}
            />
            <Area
              type="monotone"
              dataKey="attendance"
              stroke="hsl(187,100%,50%)"
              fill="url(#attendanceGradient)"
              strokeWidth={2}
              name="Attendance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Entry rate mini chart */}
      <div className="h-[100px]">
        <p className="text-xs text-muted-foreground mb-1">Entry Rate (per min) & Surge Risk (%)</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222,44%,9%)',
                border: '1px solid hsl(222,30%,18%)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Line type="monotone" dataKey="entryRate" stroke="hsl(160,84%,45%)" strokeWidth={1.5} dot={false} name="Entry Rate" />
            <Line type="monotone" dataKey="surgeRisk" stroke="hsl(0,72%,51%)" strokeWidth={1.5} dot={false} name="Surge Risk %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

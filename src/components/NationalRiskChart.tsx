import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StadiumStatus } from '@/hooks/useNationalOverview';

interface Props {
  statuses: StadiumStatus[];
}

const riskColor = (risk: number) =>
  risk > 0.85 ? '#ef4444' : risk > 0.5 ? '#f59e0b' : '#22c55e';

export const NationalRiskChart: React.FC<Props> = ({ statuses }) => {
  const data = statuses
    .filter(s => s.liveEvent)
    .sort((a, b) => b.surgeRisk - a.surgeRisk)
    .map(s => ({
      name: s.stadium.name.replace(/Stadium|Cricket|Ground/gi, '').trim().slice(0, 15),
      risk: Math.round(s.surgeRisk * 100),
      occupancy: s.occupancyPct,
    }));

  if (data.length === 0) return null;

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold">Inter-Stadium Risk Comparison</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#888' }} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9, fill: '#aaa' }} />
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
            formatter={(val: number, name: string) => [`${val}%`, name === 'risk' ? 'Surge Risk' : 'Occupancy']}
          />
          <Bar dataKey="risk" name="Surge Risk" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={riskColor(entry.risk / 100)} />
            ))}
          </Bar>
          <Bar dataKey="occupancy" name="Occupancy" fill="hsl(var(--primary))" opacity={0.4} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

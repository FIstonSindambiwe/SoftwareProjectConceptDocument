// src/components/chart/AttendanceRateDonut.jsx
// Expects: rate = 87.5  (a number 0–100)
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const AttendanceRateDonut = ({ rate = 0 }) => {
  const safeRate = Math.min(100, Math.max(0, Number(rate) || 0));
  const data     = [
    { name: 'Present', value: safeRate              },
    { name: 'Absent',  value: 100 - safeRate        },
  ];
  const color = safeRate >= 80 ? '#2dd4bf' : safeRate >= 60 ? '#f59e0b' : '#f87171';
  const label = safeRate >= 80 ? 'Excellent'      : safeRate >= 60 ? 'Good'           : 'Needs Work';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={60} outerRadius={80}
            startAngle={90} endAngle={-270}
            dataKey="value" strokeWidth={0}
          >
            <Cell fill={color}    />
            <Cell fill="#1e293b"  />
          </Pie>
          <Tooltip
            formatter={(v, name) => [`${Number(v).toFixed(1)}%`, name]}
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
            itemStyle={{ color: '#e2e8f0' }}
            labelStyle={{ color: '#94a3b8' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-black" style={{ color }}>{safeRate.toFixed(1)}%</span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">{label}</span>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          Present {safeRate.toFixed(1)}%
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          Absent {(100 - safeRate).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default AttendanceRateDonut;
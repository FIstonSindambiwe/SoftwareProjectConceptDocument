// src/components/chart/AttendanceChart.jsx
// Expects: data = [{ day: 'Mon', present: 42, absent: 8 }, ...]
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400 capitalize">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const AttendanceChart = ({ data = [] }) => {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2dd4bf" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}    />
          </linearGradient>
          <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f87171" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f87171" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="day"  tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis               tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
        <Area type="monotone" dataKey="present" stroke="#2dd4bf" strokeWidth={2.5}
          fill="url(#presentGrad)" dot={false} activeDot={{ r: 5, fill: '#2dd4bf', strokeWidth: 0 }} />
        <Area type="monotone" dataKey="absent"  stroke="#f87171" strokeWidth={2}
          fill="url(#absentGrad)"  dot={false} activeDot={{ r: 5, fill: '#f87171', strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;
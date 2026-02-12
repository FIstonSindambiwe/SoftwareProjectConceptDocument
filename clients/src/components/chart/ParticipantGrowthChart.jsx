// src/components/chart/ParticipantGrowthChart.jsx
// Expects: data = [{ month: 'Aug', new: 22, returning: 48 }, ...]
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-gray-400 capitalize">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-gray-700 text-xs flex justify-between">
        <span className="text-gray-400">Total</span>
        <span className="font-black text-rose-400">{total}</span>
      </div>
    </div>
  );
};

const ParticipantGrowthChart = ({ data = [] }) => {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={24}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis                 tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
        <Bar dataKey="returning" stackId="a" fill="#f43f5e" radius={[0, 0, 4, 4]} />
        <Bar dataKey="new"       stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ParticipantGrowthChart;
// src/components/chart/AssessmentProgressChart.jsx
// Expects:
//   data       = [{ month: 'Aug', academic: 6.2, vocational: 5.8 }, ...]
//   categories = ['academic', 'vocational', ...]   (keys that exist in data rows)
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// Assign a colour to each category dynamically
const PALETTE = [
  '#3b82f6', '#f59e0b', '#10b981', '#ec4899',
  '#8b5cf6', '#f97316', '#06b6d4', '#84cc16',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400 capitalize">{p.name.replace(/_/g, ' ')}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="flex flex-wrap justify-center gap-4 mt-2">
    {payload.map(p => (
      <div key={p.value} className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: p.color }} />
        <span className="capitalize">{p.value.replace(/_/g, ' ')}</span>
      </div>
    ))}
  </div>
);

const AssessmentProgressChart = ({ data = [], categories = [] }) => {
  if (!data.length || !categories.length) return null;

  // Auto-detect categories from data if not explicitly passed
  const cats = categories.length
    ? categories
    : Object.keys(data[0] || {}).filter(k => k !== 'month');

  // Calculate Y-axis domain from actual data
  const allValues = data.flatMap(row => cats.map(c => Number(row[c]) || 0)).filter(Boolean);
  const minVal = allValues.length ? Math.floor(Math.min(...allValues) - 1) : 0;
  const maxVal = allValues.length ? Math.ceil(Math.max(...allValues)  + 1) : 10;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[minVal, maxVal]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
        <Legend content={<CustomLegend />} />
        {cats.map((cat, i) => (
          <Line
            key={cat}
            type="monotone"
            dataKey={cat}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: PALETTE[i % PALETTE.length], strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AssessmentProgressChart;
// src/components/chart/AssessmentProgressChart.jsx
// Pure SVG — no external dependencies required.
// data       = [{ month: 'Aug', academic: 6.2, vocational: 5.8 }, ...]
// categories = ['academic', 'vocational', ...]
import React, { useState } from 'react';

const W = 560; const H = 200;
const PAD = { top: 16, right: 16, bottom: 36, left: 40 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top  - PAD.bottom;

const PALETTE = [
  '#3b82f6', '#f59e0b', '#10b981',
  '#ec4899', '#8b5cf6', '#f97316', '#06b6d4',
];

const AssessmentProgressChart = ({ data = [], categories = [] }) => {
  const [tooltip, setTooltip] = useState(null);
  if (!data.length) return null;

  const cats = categories.length
    ? categories
    : Object.keys(data[0]).filter(k => k !== 'month');

  if (!cats.length) return null;

  const allVals = data.flatMap(row => cats.map(c => Number(row[c]) || 0)).filter(Boolean);
  const minV = allVals.length ? Math.floor(Math.min(...allVals) - 0.5) : 0;
  const maxV = allVals.length ? Math.ceil (Math.max(...allVals) + 0.5) : 10;
  const range = maxV - minV || 1;

  const scaleX = i => PAD.left + (i / (data.length - 1 || 1)) * CW;
  const scaleY = v => PAD.top  + CH - ((v - minV) / range) * CH;

  const ticks = [minV, (minV + maxV) / 2, maxV].map(v => +v.toFixed(1));

  const polyline = (cat) =>
    data.map((d, i) => `${scaleX(i)},${scaleY(Number(d[cat]) || minV)}`).join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 210 }}>
        {/* Grid */}
        {ticks.map(t => (
          <g key={t}>
            <line x1={PAD.left} y1={scaleY(t)} x2={PAD.left + CW} y2={scaleY(t)}
              stroke="#f1f5f9" strokeDasharray="3 3" />
            <text x={PAD.left - 6} y={scaleY(t) + 4}
              fill="#475569" fontSize="10" textAnchor="end">{t}</text>
          </g>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={scaleX(i)} y={H - 6}
            fill="#475569" fontSize="10" textAnchor="middle">{d.month}</text>
        ))}

        {/* Lines */}
        {cats.map((cat, ci) => (
          <polyline key={cat}
            points={polyline(cat)}
            fill="none"
            stroke={PALETTE[ci % PALETTE.length]}
            strokeWidth="2.5"
            strokeLinejoin="round" strokeLinecap="round"
          />
        ))}

        {/* Hover zones + dots */}
        {data.map((d, i) => (
          <g key={i}
            onMouseEnter={() => setTooltip({ i, d })}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: 'pointer' }}>
            <rect x={scaleX(i) - 18} y={PAD.top} width={36} height={CH} fill="transparent" />
            {cats.map((cat, ci) => (
              <circle key={cat}
                cx={scaleX(i)} cy={scaleY(Number(d[cat]) || minV)} r="4"
                fill={PALETTE[ci % PALETTE.length]} stroke="#ffffff" strokeWidth="2"
                opacity={tooltip?.i === i ? 1 : 0}
              />
            ))}
            {tooltip?.i === i && (
              <g>
                <rect
                  x={Math.min(scaleX(i) - 56, W - PAD.right - 116)}
                  y={PAD.top}
                  width={112} height={16 + cats.length * 16}
                  rx="6" fill="#1e293b" stroke="#334155"
                />
                <text
                  x={Math.min(scaleX(i), W - PAD.right - 4) - 56 + 56}
                  y={PAD.top + 14}
                  fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="bold">
                  {d.month}
                </text>
                {cats.map((cat, ci) => (
                  <text key={cat}
                    x={Math.min(scaleX(i) - 56, W - PAD.right - 116) + 56}
                    y={PAD.top + 28 + ci * 16}
                    fill={PALETTE[ci % PALETTE.length]}
                    fontSize="10" textAnchor="middle">
                    {cat.replace(/_/g, ' ')}: {Number(d[cat] ?? 0).toFixed(1)}
                  </text>
                ))}
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-1">
        {cats.map((cat, ci) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-0.5 rounded-full inline-block"
              style={{ background: PALETTE[ci % PALETTE.length] }} />
            <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssessmentProgressChart;
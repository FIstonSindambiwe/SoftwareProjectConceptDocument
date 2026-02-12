// src/components/chart/AttendanceChart.jsx
// Pure SVG — no external dependencies required.
// data = [{ day: 'Mon', present: 42, absent: 8 }, ...]
import React, { useState } from 'react';

const W = 560; const H = 180; const PAD = { top: 12, right: 16, bottom: 28, left: 36 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top  - PAD.bottom;

const AttendanceChart = ({ data = [] }) => {
  const [tooltip, setTooltip] = useState(null);
  if (!data.length) return null;

  const maxVal = Math.max(...data.flatMap(d => [d.present, d.absent]), 1);

  const scaleX = i => PAD.left + (i / (data.length - 1)) * CW;
  const scaleY = v => PAD.top  + CH - (v / maxVal) * CH;

  const polyline = (key, fallback = 0) =>
    data.map((d, i) => `${scaleX(i)},${scaleY(d[key] ?? fallback)}`).join(' ');

  const area = (key) => {
    const pts = data.map((d, i) => `${scaleX(i)},${scaleY(d[key] ?? 0)}`).join(' ');
    const first = `${scaleX(0)},${scaleY(0)}`;
    const last  = `${scaleX(data.length - 1)},${scaleY(0)}`;
    return `M ${first} L ${pts} L ${last} Z`;
  };

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * maxVal));

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
        <defs>
          <linearGradient id="ac-present" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2dd4bf" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"    />
          </linearGradient>
          <linearGradient id="ac-absent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f87171" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map(t => (
          <g key={t}>
            <line
              x1={PAD.left} y1={scaleY(t)}
              x2={PAD.left + CW} y2={scaleY(t)}
              stroke="#f1f5f9" strokeDasharray="3 3"
            />
            <text x={PAD.left - 6} y={scaleY(t) + 4}
              fill="#475569" fontSize="10" textAnchor="end">{t}</text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={i} x={scaleX(i)} y={H - 6}
            fill="#475569" fontSize="10" textAnchor="middle">{d.day}</text>
        ))}

        {/* Filled areas */}
        <path d={area('present')} fill="url(#ac-present)" />
        <path d={area('absent')}  fill="url(#ac-absent)"  />

        {/* Lines */}
        <polyline
          points={polyline('present')}
          fill="none" stroke="#2dd4bf" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round"
        />
        <polyline
          points={polyline('absent')}
          fill="none" stroke="#f87171" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round"
        />

        {/* Hover dots */}
        {data.map((d, i) => (
          <g key={i}
            onMouseEnter={() => setTooltip({ i, x: scaleX(i), ...d })}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect x={scaleX(i) - 18} y={PAD.top} width={36} height={CH} fill="transparent" />
            <circle cx={scaleX(i)} cy={scaleY(d.present)} r="4"
              fill="#2dd4bf" stroke="#ffffff" strokeWidth="2"
              opacity={tooltip?.i === i ? 1 : 0} />
            <circle cx={scaleX(i)} cy={scaleY(d.absent)} r="4"
              fill="#f87171" stroke="#ffffff" strokeWidth="2"
              opacity={tooltip?.i === i ? 1 : 0} />
            {tooltip?.i === i && (
              <g>
                <rect
                  x={scaleX(i) - 46} y={scaleY(Math.max(d.present, d.absent)) - 52}
                  width={92} height={46} rx="6"
                  fill="#1e293b" stroke="#334155"
                />
                <text x={scaleX(i)} y={scaleY(Math.max(d.present, d.absent)) - 35}
                  fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="bold">
                  {d.day}
                </text>
                <text x={scaleX(i) - 8} y={scaleY(Math.max(d.present, d.absent)) - 20}
                  fill="#2dd4bf" fontSize="10" textAnchor="end">{d.present}</text>
                <text x={scaleX(i)} y={scaleY(Math.max(d.present, d.absent)) - 20}
                  fill="#475569" fontSize="10" textAnchor="middle">/</text>
                <text x={scaleX(i) + 8} y={scaleY(Math.max(d.present, d.absent)) - 20}
                  fill="#f87171" fontSize="10" textAnchor="start">{d.absent}</text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default AttendanceChart;
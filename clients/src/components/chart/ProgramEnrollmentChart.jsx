// src/components/chart/ProgramEnrollmentChart.jsx
// Pure SVG — no external dependencies required.
// data = [{ program: 'Youth Leadership', enrolled: 78 }, ...]
import React, { useState } from 'react';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#818cf8', '#4f46e5', '#c4b5fd'];

const ProgramEnrollmentChart = ({ data = [] }) => {
  const [hovered, setHovered] = useState(null);
  if (!data.length) return null;

  const BAR_H   = 22;
  const GAP     = 10;
  const PAD_L   = 112;  // space for labels
  const PAD_R   = 40;
  const PAD_V   = 12;
  const W       = 560;
  const H       = PAD_V * 2 + data.length * (BAR_H + GAP) - GAP;
  const CW      = W - PAD_L - PAD_R;

  const maxVal = Math.max(...data.map(d => d.enrolled ?? 0), 1);
  const scaleW = v => (v / maxVal) * CW;

  const ticks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: Math.max(H, 120) }}>
        {/* Vertical grid */}
        {ticks.map(t => {
          const x = PAD_L + scaleW(t);
          return (
            <g key={t}>
              <line x1={x} y1={PAD_V - 6} x2={x} y2={H - PAD_V + 4}
                stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x={x} y={H - 2}
                fill="#475569" fontSize="10" textAnchor="middle">{t}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const y       = PAD_V + i * (BAR_H + GAP);
          const bw      = scaleW(d.enrolled ?? 0);
          const isHov   = hovered === i;
          const color   = COLORS[i % COLORS.length];

          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              {/* Program label */}
              <text x={PAD_L - 8} y={y + BAR_H / 2 + 4}
                fill={isHov ? '#e2e8f0' : '#94a3b8'}
                fontSize="11" textAnchor="end"
                style={{ transition: 'fill 0.15s' }}>
                {(d.program ?? '').length > 14
                  ? (d.program ?? '').slice(0, 13) + '…'
                  : d.program}
              </text>

              {/* Track */}
              <rect x={PAD_L} y={y} width={CW} height={BAR_H}
                fill="#f1f5f9" rx="4" />

              {/* Bar */}
              <rect x={PAD_L} y={y} width={bw} height={BAR_H}
                fill={color} rx="4"
                opacity={isHov ? 1 : 0.85}
                style={{ transition: 'opacity 0.15s, width 0.4s ease' }}
              />

              {/* Value label */}
              {bw > 28 && (
                <text x={PAD_L + bw - 6} y={y + BAR_H / 2 + 4}
                  fill="#1e293b" fontSize="10" textAnchor="end" fontWeight="bold">
                  {d.enrolled}
                </text>
              )}

              {/* Tooltip */}
              {isHov && (
                <g>
                  <rect x={PAD_L + bw + 6} y={y - 2} width={72} height={BAR_H + 4} rx="5"
                    fill="#1e293b" stroke="#334155" />
                  <text x={PAD_L + bw + 42} y={y + BAR_H / 2 + 4}
                    fill={color} fontSize="11" textAnchor="middle" fontWeight="bold">
                    {d.enrolled} enrolled
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ProgramEnrollmentChart;
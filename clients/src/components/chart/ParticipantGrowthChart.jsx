// src/components/chart/ParticipantGrowthChart.jsx
// Pure SVG — no external dependencies required.
// data = [{ month: 'Aug', new: 22, returning: 48 }, ...]
import React, { useState } from 'react';

const W = 560; const H = 180;
const PAD = { top: 12, right: 16, bottom: 28, left: 36 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top  - PAD.bottom;

const ParticipantGrowthChart = ({ data = [] }) => {
  const [tooltip, setTooltip] = useState(null);
  if (!data.length) return null;

  const maxVal = Math.max(...data.map(d => (d.new ?? 0) + (d.returning ?? 0)), 1);
  const barW   = Math.min(32, (CW / data.length) * 0.6);
  const scaleX = i => PAD.left + (i + 0.5) * (CW / data.length);
  const scaleH = v => (v / maxVal) * CH;

  const ticks = [0, 0.5, 1].map(t => Math.round(t * maxVal));

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
        {/* Grid */}
        {ticks.map(t => {
          const y = PAD.top + CH - scaleH(t);
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={PAD.left + CW} y2={y}
                stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x={PAD.left - 6} y={y + 4}
                fill="#475569" fontSize="10" textAnchor="end">{t}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x        = scaleX(i) - barW / 2;
          const retH     = scaleH(d.returning ?? 0);
          const newH     = scaleH(d.new ?? 0);
          const totalH   = retH + newH;
          const baseY    = PAD.top + CH;
          const isHovered = tooltip?.i === i;

          return (
            <g key={i}
              onMouseEnter={() => setTooltip({ i, ...d })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}>
              {/* returning (bottom) */}
              {retH > 0 && (
                <rect x={x} y={baseY - retH} width={barW} height={retH}
                  fill={isHovered ? '#fb7185' : '#f43f5e'}
                  rx="3" ry="3"
                />
              )}
              {/* new (top) */}
              {newH > 0 && (
                <rect x={x} y={baseY - totalH} width={barW} height={newH}
                  fill={isHovered ? '#fdba74' : '#fb923c'}
                  rx="3" ry="3"
                />
              )}
              {/* X label */}
              <text x={scaleX(i)} y={H - 6}
                fill="#475569" fontSize="10" textAnchor="middle">{d.month}</text>

              {/* Tooltip */}
              {isHovered && totalH > 0 && (
                <g>
                  <rect
                    x={scaleX(i) - 48} y={baseY - totalH - 58}
                    width={96} height={52} rx="6"
                    fill="#1e293b" stroke="#334155"
                  />
                  <text x={scaleX(i)} y={baseY - totalH - 42}
                    fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="bold">
                    {d.month} · {(d.new ?? 0) + (d.returning ?? 0)} total
                  </text>
                  <text x={scaleX(i) - 4} y={baseY - totalH - 26}
                    fill="#fb923c" fontSize="10" textAnchor="end">New: {d.new ?? 0}</text>
                  <text x={scaleX(i) + 4} y={baseY - totalH - 26}
                    fill="#f43f5e" fontSize="10" textAnchor="start">Ret: {d.returning ?? 0}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ParticipantGrowthChart;
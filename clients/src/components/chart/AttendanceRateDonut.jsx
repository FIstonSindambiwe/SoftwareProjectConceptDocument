// src/components/chart/AttendanceRateDonut.jsx
// Pure SVG — no external dependencies required.
// rate = number 0–100
import React from 'react';

const AttendanceRateDonut = ({ rate = 0 }) => {
  const safe  = Math.min(100, Math.max(0, Number(rate) || 0));
  const color = safe >= 80 ? '#2dd4bf' : safe >= 60 ? '#f59e0b' : '#f87171';
  const label = safe >= 80 ? 'Excellent'  : safe >= 60 ? 'Good'   : 'Needs Work';

  // SVG arc math
  const R = 54; const CX = 80; const CY = 80;
  const circumference = 2 * Math.PI * R;
  const dash  = (safe / 100) * circumference;
  const gap   = circumference - dash;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg viewBox="0 0 160 160" width="160" height="160">
          {/* Track */}
          <circle cx={CX} cy={CY} r={R}
            fill="none" stroke="#e2e8f0" strokeWidth="14" />
          {/* Progress */}
          <circle cx={CX} cy={CY} r={R}
            fill="none" stroke={color} strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black leading-none" style={{ color }}>
            {safe.toFixed(1)}%
          </span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
            {label}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
          Present {safe.toFixed(1)}%
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-gray-300" />
          Absent {(100 - safe).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default AttendanceRateDonut;
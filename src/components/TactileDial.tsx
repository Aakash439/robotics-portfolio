import React from 'react';

interface TactileDialProps {
  color?: 'orange' | 'blue' | 'green' | 'white';
  label?: string;
  size?: number;
  rotation?: number; // 0 to 270 degrees
  value?: number; // 0 to 100 (maps to 0 to 270 degrees)
  className?: string;
}

const COLOR_MAP = {
  orange: {
    cap: '#FF5500',
    capTop: '#FF6611',
    ring: '#CC4400',
    dot: '#FFFFFF',
    shadow: 'rgba(255, 85, 0, 0.35)',
  },
  blue: {
    cap: '#2563EB',
    capTop: '#3B82F6',
    ring: '#1D4ED8',
    dot: '#FFFFFF',
    shadow: 'rgba(37, 99, 235, 0.35)',
  },
  green: {
    cap: '#10B981',
    capTop: '#34D399',
    ring: '#059669',
    dot: '#FFFFFF',
    shadow: 'rgba(16, 185, 129, 0.35)',
  },
  white: {
    cap: '#E5E5E2',
    capTop: '#F5F5F3',
    ring: '#C4C4BD',
    dot: '#1A1A18',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

/**
 * TactileDial — Iconic Teenage Engineering OP-1 style cylindrical rotary knob
 * with machined grip notches, indicator notch, and recessed bevel socket.
 */
export const TactileDial: React.FC<TactileDialProps> = ({
  color = 'orange',
  label,
  size = 28,
  rotation,
  value,
  className = '',
}) => {
  const c = COLOR_MAP[color];
  const rot =
    rotation !== undefined
      ? rotation
      : value !== undefined
      ? (value / 100) * 270
      : 45;

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-full bg-[#DCDCD8] p-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.8)] border border-[#C8C8C2]"
        style={{ width: size + 4, height: size + 4 }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          className="transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${rot}deg)` }}
        >
          {/* Beveled Knob Body */}
          <circle cx="16" cy="16" r="14" fill={c.cap} stroke={c.ring} strokeWidth="1.2" />

          {/* Grip Ridges around perimeter */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
            <line
              key={ang}
              x1="16"
              y1="2.5"
              x2="16"
              y2="4.5"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="1.2"
              strokeLinecap="round"
              transform={`rotate(${ang} 16 16)`}
            />
          ))}

          {/* Inner Recessed Cap */}
          <circle cx="16" cy="16" r="10" fill={c.capTop} />

          {/* Precision Indicator Pointer / Notch */}
          <circle cx="16" cy="7.5" r="1.6" fill={c.dot} />
        </svg>
      </div>

      {label && (
        <span className="font-sans text-[9px] uppercase tracking-wider text-[#777772] font-bold">
          {label}
        </span>
      )}
    </div>
  );
};

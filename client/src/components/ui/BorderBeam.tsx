import React from 'react';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className = '',
  size = 150,
  duration = 8,
  borderWidth = 1.5,
  anchor = 90,
  colorFrom = '#007d88',
  colorTo = '#14b8a6',
  delay = 0,
}) => {
  return (
    <div
      style={{
        '--size': size,
        '--duration': duration,
        '--anchor': anchor,
        '--border-width': borderWidth,
        '--color-from': colorFrom,
        '--color-to': colorTo,
        '--delay': delay,
      } as React.CSSProperties}
      className={`pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] ${className}`}
    >
      <div
        className="absolute inset-0 rounded-[inherit] [background:linear-gradient(to_right,var(--color-from),var(--color-to))_border-box] [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] [mask-composite:exclude]"
        style={{
          animation: `border-beam calc(var(--duration)*1s) infinite linear`,
          animationDelay: `calc(var(--delay)*1s)`,
        }}
      />
    </div>
  );
};

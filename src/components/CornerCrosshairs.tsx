import React from 'react';

/**
 * CornerCrosshairs — Renders subtle stamped alignment crosshairs (+)
 * or recessed Allen screw heads at the four corners of a hardware plate.
 */
export const CornerCrosshairs: React.FC<{
  type?: 'crosshair' | 'screw' | 'crosshairs' | 'screws';
  variant?: 'crosshair' | 'screw' | 'crosshairs' | 'screws';
}> = ({ type, variant }) => {
  const mode = variant || type || 'crosshair';
  const isScrew = mode === 'screw' || mode === 'screws';

  if (isScrew) {
    return (
      <>
        {/* Top-Left Screw */}
        <div className="pointer-events-none absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-[#DFDFDC] border border-[#B8B8B0] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.8)] flex items-center justify-center">
          <div className="w-1.5 h-[1px] bg-[#666660]" />
        </div>
        {/* Top-Right Screw */}
        <div className="pointer-events-none absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#DFDFDC] border border-[#B8B8B0] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.8)] flex items-center justify-center">
          <div className="w-1.5 h-[1px] bg-[#666660] rotate-45" />
        </div>
        {/* Bottom-Left Screw */}
        <div className="pointer-events-none absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-[#DFDFDC] border border-[#B8B8B0] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.8)] flex items-center justify-center">
          <div className="w-1.5 h-[1px] bg-[#666660] -rotate-45" />
        </div>
        {/* Bottom-Right Screw */}
        <div className="pointer-events-none absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-[#DFDFDC] border border-[#B8B8B0] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.8)] flex items-center justify-center">
          <div className="w-1.5 h-[1px] bg-[#666660] rotate-90" />
        </div>
      </>
    );
  }

  return (
    <>
      <span className="pointer-events-none absolute top-2.5 left-2.5 font-mono text-[10px] leading-none text-[#A8A8A2] select-none font-bold">
        +
      </span>
      <span className="pointer-events-none absolute top-2.5 right-2.5 font-mono text-[10px] leading-none text-[#A8A8A2] select-none font-bold">
        +
      </span>
      <span className="pointer-events-none absolute bottom-2.5 left-2.5 font-mono text-[10px] leading-none text-[#A8A8A2] select-none font-bold">
        +
      </span>
      <span className="pointer-events-none absolute bottom-2.5 right-2.5 font-mono text-[10px] leading-none text-[#A8A8A2] select-none font-bold">
        +
      </span>
    </>
  );
};
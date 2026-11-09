import React from 'react';

/**
 * WorkbenchRuler — Renders subtle engineering millimeter ruler tick marks
 * along the top and left margins of the layout, transforming the screen
 * into an authentic Teenage Engineering / Dieter Rams precision workbench.
 */
export const WorkbenchRuler: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Top Millimeter Ruler Bar (Desktop & Tablet) */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-[#E5E5E2]/80 backdrop-blur-sm border-b border-[#D0D0CB] flex items-end">
        {/* Origin Corner Spec Badge */}
        <div className="w-10 h-full border-r border-[#D0D0CB] flex items-center justify-center font-mono text-[7px] font-semibold text-[#888884] bg-[#DFDFDC]">
          0,0
        </div>

        {/* Scaled Millimeter Tick Strip */}
        <div className="flex-1 h-full relative overflow-hidden">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="ruler-mm-top"
                width="50"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                {/* 10px subdivisions */}
                <line x1="10" y1="11" x2="10" y2="16" stroke="#B8B8B2" strokeWidth="0.75" />
                <line x1="20" y1="11" x2="20" y2="16" stroke="#B8B8B2" strokeWidth="0.75" />
                <line x1="30" y1="11" x2="30" y2="16" stroke="#B8B8B2" strokeWidth="0.75" />
                <line x1="40" y1="11" x2="40" y2="16" stroke="#B8B8B2" strokeWidth="0.75" />
                {/* 25px mid tick */}
                <line x1="25" y1="8" x2="25" y2="16" stroke="#888884" strokeWidth="1" />
                {/* 50px major tick */}
                <line x1="0" y1="4" x2="0" y2="16" stroke="#555550" strokeWidth="1.25" />
                <line x1="50" y1="4" x2="50" y2="16" stroke="#555550" strokeWidth="1.25" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ruler-mm-top)" />
          </svg>
        </div>

        {/* Top-Right Calibration Stamp */}
        <div className="hidden lg:flex items-center gap-2 px-3 h-full border-l border-[#D0D0CB] font-mono text-[7px] text-[#777772] uppercase tracking-wider bg-[#DFDFDC]/60">
          <span className="h-1 w-1 rounded-full bg-[#FF5500]" />
          <span>Metric Precision Workbench · 1:1 Scale</span>
        </div>
      </div>

      {/* Left Margin Millimeter Ruler (Desktop screens >= 1280px) */}
      <div className="hidden xl:flex absolute top-4 left-0 bottom-0 w-4 bg-[#E5E5E2]/80 backdrop-blur-sm border-r border-[#D0D0CB] flex-col items-end">
        <div className="flex-1 w-full relative overflow-hidden">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="ruler-mm-left"
                width="16"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                {/* 10px subdivisions */}
                <line x1="11" y1="10" x2="16" y2="10" stroke="#B8B8B2" strokeWidth="0.75" />
                <line x1="11" y1="20" x2="16" y2="20" stroke="#B8B8B2" strokeWidth="0.75" />
                <line x1="11" y1="30" x2="16" y2="30" stroke="#B8B8B2" strokeWidth="0.75" />
                <line x1="11" y1="40" x2="16" y2="40" stroke="#B8B8B2" strokeWidth="0.75" />
                {/* 25px mid tick */}
                <line x1="8" y1="25" x2="16" y2="25" stroke="#888884" strokeWidth="1" />
                {/* 50px major tick */}
                <line x1="4" y1="0" x2="16" y2="0" stroke="#555550" strokeWidth="1.25" />
                <line x1="4" y1="50" x2="16" y2="50" stroke="#555550" strokeWidth="1.25" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ruler-mm-left)" />
          </svg>
        </div>
      </div>
    </div>
  );
};

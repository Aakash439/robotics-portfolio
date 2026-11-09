import React from 'react';
import { motion } from 'framer-motion';
import { CORE_SYSTEMS_BENTO, TECH_ARSENAL_CATEGORIES } from '../data/projects';
import { CornerCrosshairs } from './CornerCrosshairs';
import { TactileDial } from './TactileDial';

const STUDIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const Skills: React.FC = () => {
  return (
    <section
      id="systems"
      className="relative bg-[#ECECEB] py-20 sm:py-28 border-b border-[#D5D5D0] overflow-hidden"
    >
      {/* Precision CAD Drafting & Workbench Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(#B8B8B2 0.75px, transparent 0.75px), linear-gradient(to right, #D8D8D2 0.5px, transparent 0.5px), linear-gradient(to bottom, #D8D8D2 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px, 120px 120px, 120px 120px',
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Section Header: Dieter Rams Modernist Monospace & Swiss Typography */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs text-[#FF5500] uppercase tracking-wider mb-2 font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#FF5500] shadow-[0_0_6px_rgba(255,85,0,0.6)] animate-pulse" />
              <span>Module 02 · Architecture &amp; Arsenal</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#111111]">
              Engineering Stack &amp; Architecture.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <TactileDial label="BUS" value={45} size={28} />
            <p className="font-mono text-xs text-[#777772] uppercase tracking-wider">
              SOFTWARE · EMBEDDED · FABRICATION
            </p>
          </div>
        </div>

        {/* 3-Column Stamped Modular Hardware Racks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {CORE_SYSTEMS_BENTO.map((col, colIdx) => {
            const isOrange = col.led === 'orange';
            const ledBg = isOrange ? '#FF5500' : '#10B981';
            return (
              <motion.div
                key={col.columnLabel}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: colIdx * 0.08, ease: STUDIO_EASE }}
                whileHover={{ y: -3 }}
                data-dmm-target="mcu"
                className="relative rounded-xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.04)] p-7 flex flex-col justify-between group transition-shadow hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_rgba(0,0,0,0.06)]"
              >
                <CornerCrosshairs variant="screws" />

                <div>
                  {/* Rack Module Kicker */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-[#666662] uppercase tracking-wider">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: ledBg,
                          boxShadow: `0 0 6px ${ledBg}`,
                        }}
                      />
                      <span>{col.columnLabel}</span>
                    </div>
                    <span className="font-mono text-[9px] text-[#999994] font-semibold">
                      CH-0{colIdx + 1}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#111111] mb-5 tracking-tight">
                    {col.header}
                  </h3>

                  {/* 7-Segment Multimeter Digital LED Display Window */}
                  <div className="mb-6 p-1 bg-[#DFDFDC] rounded border border-[#C8C8C2] shadow-inner">
                    <div className="bg-[#121315] text-[#FF453A] font-mono px-3.5 py-2.5 rounded-sm border border-black/50 shadow-inner flex items-center justify-between">
                      <span className="text-[10px] text-[#888884] tracking-widest uppercase">
                        TELEMETRY
                      </span>
                      <span className="text-base sm:text-lg font-bold tracking-widest tabular-nums drop-shadow-[0_0_6px_rgba(255,69,58,0.7)]">
                        {col.stat}
                      </span>
                    </div>
                  </div>

                  {/* Specification Items with Mechanical Line Connectors */}
                  <div className="pt-4 border-t border-[#D5D5D0] space-y-2.5">
                    {col.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2.5 text-xs text-[#333330] font-sans"
                      >
                        <span className="h-1.5 w-1.5 rounded-sm bg-[#888884] shrink-0" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Stamped Spec Strip */}
                <div className="mt-6 pt-3 border-t border-[#E0E0DB] flex items-center justify-between font-mono text-[9px] text-[#888884]">
                  <span>Bus: Ready</span>
                  <span className="text-[#059669] font-bold">Active · 100% Nominal</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Teenage Engineering OP-1 Sequencer Keycap Arsenal Rack */}
        <div className="relative rounded-2xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.05)] p-6 sm:p-10 space-y-12">
          <CornerCrosshairs variant="crosshairs" />

          {/* Top Plate Header Bar */}
          <div className="flex items-center justify-between border-b border-[#D5D5D0] pb-4">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5500] shadow-[0_0_6px_rgba(255,85,0,0.7)]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
                Tactile Key Matrix · Hardware &amp; Logic Arsenal
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 font-mono text-[10px] text-[#777772]">
              <span>Calibration: 100%</span>
              <span>Grid: 4×3 Matrix</span>
            </div>
          </div>

          {TECH_ARSENAL_CATEGORIES.map((category, catIdx) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: catIdx * 0.08, ease: STUDIO_EASE }}
            >
              {/* Category Header with Tactile Division Hairline */}
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-xs tracking-[0.2em] text-[#FF5500] uppercase font-bold whitespace-nowrap">
                  {category.category}
                </span>
                <div className="h-[1px] w-full bg-[#D5D5D0]" />
                <span className="font-mono text-[10px] text-[#888884] whitespace-nowrap">
                  0{category.items.length} KEYS
                </span>
              </div>

              {/* OP-1 Synthesizer Keycaps Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {category.items.map((tech, idx) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: idx * 0.03,
                      ease: STUDIO_EASE,
                    }}
                    className="group flex flex-col items-center text-center cursor-pointer select-none"
                  >
                    {/* Authentic Tactile OP-1 Keycap */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#E8E8E5] group-hover:bg-[#FFFFFF] border border-[#C8C8C2] shadow-[0_3px_0_#B8B8B2,inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-[2px] active:shadow-none transition-all flex flex-col items-center justify-center p-2 mb-2 relative overflow-hidden">
                      {/* Keycap Corner Color Pip */}
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#FF5500] opacity-80 group-hover:opacity-100" />

                      {/* Chemical / Tech Element Abbreviation */}
                      <span className="font-mono font-bold text-xl sm:text-2xl text-[#111111] group-hover:scale-105 transition-transform tracking-tight">
                        {tech.abbr}
                      </span>

                      {/* Small Key Index */}
                      <span className="font-mono text-[8px] text-[#888884] mt-0.5 tracking-tighter">
                        K{idx + 1}
                      </span>
                    </div>

                    {/* Tech Name */}
                    <h4 className="text-[#111111] font-bold text-xs tracking-tight mb-0.5 group-hover:text-[#FF5500] transition-colors">
                      {tech.name}
                    </h4>

                    {/* Tech Subtitle */}
                    <p className="text-[9px] font-mono tracking-wider text-[#777772] uppercase truncate max-w-[100px]">
                      {tech.sub}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
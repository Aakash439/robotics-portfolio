import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Maximize2, X } from 'lucide-react';
import { PROJECTS, PROJECTS_SECTION, ProjectWork } from '../data/projects';
import { CornerCrosshairs } from './CornerCrosshairs';
import { TactileDial } from './TactileDial';
import { audioEngine } from '../utils/audio';
import { useGsapCardTilt } from '../utils/gsapAnimations';

const STUDIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * MotorGuard Active Thermal Simulation Viewport
 * Implements real-time 1.2s thermal runaway climbing from 42°C -> 64°C,
 * two-stage PWM derating (100% -> 65% -> 0%), and interlock reset recovery.
 */
const MotorGuardVisualizer: React.FC<{ project: ProjectWork }> = ({ project }) => {
  const [thermalPhase, setThermalPhase] = useState<'nominal' | 'climbing' | 'tripped' | 'resetting'>('nominal');
  const [temp, setTemp] = useState(42);
  const [pwm, setPwm] = useState(100);
  const animRef = useRef<number | null>(null);

  const isTripped = temp >= 60;
  const isDerate = temp >= 50 && temp < 60;

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleSimulateSpike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (thermalPhase === 'climbing' || thermalPhase === 'resetting') return;

    if (thermalPhase === 'tripped') {
      // Reset sequence
      audioEngine.playInterlockReset();
      setThermalPhase('resetting');
      const start = performance.now();
      const duration = 900;

      const step = (now: number) => {
        const elapsed = Math.min(now - start, duration);
        const progress = elapsed / duration;
        const currentTemp = Math.round(64 - progress * (64 - 42));
        setTemp(currentTemp);

        if (currentTemp < 50) {
          setPwm(100);
        } else if (currentTemp < 60) {
          setPwm(65);
        } else {
          setPwm(0);
        }

        if (elapsed < duration) {
          animRef.current = requestAnimationFrame(step);
        } else {
          setTemp(42);
          setPwm(100);
          setThermalPhase('nominal');
        }
      };
      animRef.current = requestAnimationFrame(step);
      return;
    }

    // Trigger Thermal Spike: climbs 42°C to 64°C over 1.2s
    audioEngine.playRelayClick();
    setThermalPhase('climbing');
    const start = performance.now();
    const duration = 1200;

    const step = (now: number) => {
      const elapsed = Math.min(now - start, duration);
      const progress = elapsed / duration;
      const currentTemp = Math.round(42 + progress * (64 - 42));
      setTemp(currentTemp);

      if (currentTemp >= 60) {
        setPwm(0);
      } else if (currentTemp >= 50) {
        setPwm(65);
      } else {
        setPwm(100);
      }

      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setTemp(64);
        setPwm(0);
        setThermalPhase('tripped');
        audioEngine.playInterlockTrip();
      }
    };
    animRef.current = requestAnimationFrame(step);
  };

  // SVG thermal curve geometry based on current live temperature
  const tempRatio = (temp - 42) / (64 - 42);
  const pwmDropY = pwm === 100 ? 24 : pwm === 65 ? 62 : 118;

  return (
    <div
      className={`relative rounded-lg bg-[#141517] border transition-colors duration-300 h-[260px] w-full p-4 flex flex-col justify-between overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.6)] ${
        isTripped ? 'border-[#FF3B30]' : isDerate ? 'border-[#F59E0B]' : 'border-[#2C2D32]'
      }`}
    >
      {/* Top LCD Status Strip */}
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-[#8E8E93]">
        <span className="truncate">{project.viewport.label}</span>
        <span
          className={`tabular-nums font-bold tracking-wider px-2 py-0.5 rounded border ${
            isTripped
              ? 'bg-[#FF3B30]/20 text-[#FF453A] border-[#FF3B30]/40 animate-pulse'
              : isDerate
              ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
              : 'bg-black/60 text-[#30D158] border-white/10'
          }`}
        >
          {temp}°C · {isTripped ? 'Cutoff Active (0% PWM)' : isDerate ? '50°C Limp-Home (65% PWM)' : `${pwm}% PWM Nominal`}
        </span>
      </div>

      <svg viewBox="0 0 340 140" className="w-full h-36 overflow-visible">
        <defs>
          <linearGradient id="mgAreaTE" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isTripped ? 'rgba(255,59,48,0.25)' : 'rgba(255,85,0,0.2)'} />
            <stop offset="100%" stopColor="rgba(255,85,0,0)" />
          </linearGradient>
        </defs>

        {/* Oscilloscope Grid Lines */}
        <line x1="12" y1="36" x2="328" y2="36" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="12" y1="62" x2="328" y2="62" stroke="rgba(245,158,11,0.25)" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="12" y1="118" x2="328" y2="118" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Step PWM Curve */}
        <path
          d={`M 12 24 L 98 24 L 108 ${pwmDropY} L 328 ${pwmDropY} L 328 124 L 12 124 Z`}
          fill="url(#mgAreaTE)"
        />
        <path
          d={`M 12 24 L 98 24 L 108 ${pwmDropY} L 328 ${pwmDropY}`}
          fill="none"
          stroke={isTripped ? '#FF3B30' : isDerate ? '#F59E0B' : '#FFFFFF'}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Rising Thermal Curve */}
        <path
          d={`M 12 114 C 70 106, ${140 - tempRatio * 40} ${114 - tempRatio * 80}, ${220 - tempRatio * 40} ${100 - tempRatio * 85} C 270 ${90 - tempRatio * 75}, 300 ${80 - tempRatio * 70}, 328 ${110 - tempRatio * 96}`}
          fill="none"
          stroke="#FF5500"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Playhead */}
        <line
          x1={40 + tempRatio * 260}
          y1="14"
          x2={40 + tempRatio * 260}
          y2="124"
          stroke={isTripped ? '#FF453A' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.2"
          strokeDasharray={isTripped ? undefined : '2 2'}
        />
        <circle cx={40 + tempRatio * 260} cy={pwmDropY} r="4" fill={isTripped ? '#FF3B30' : '#FF5500'} />
      </svg>

      <div className="flex items-center justify-between gap-2 font-mono text-[9px] text-[#A1A1A6]">
        <span className="truncate">
          {isTripped
            ? 'Emergency 0% Relay Cutoff Triggered'
            : isDerate
            ? 'Two-Stage Limp-Home Mode Active'
            : '50°C Limp-Home · 60°C Emergency Cutoff'}
        </span>

        {/* Active Thermal Simulation / Recovery Button */}
        <button
          type="button"
          onClick={handleSimulateSpike}
          className={`cursor-shrink px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_2px_0_rgba(0,0,0,0.2)] active:translate-y-[1px] active:shadow-none cursor-pointer ${
            isTripped
              ? 'bg-[#10B981] text-white shadow-[0_2px_0_#059669] hover:bg-[#059669]'
              : 'bg-[#FF5500] text-white shadow-[0_2px_0_#CC4400] hover:bg-[#FF6611]'
          }`}
        >
          {isTripped ? 'Reset Thermal Interlock' : 'Simulate 64°C Thermal Spike'}
        </button>
      </div>
    </div>
  );
};

/**
 * Line-Following AGV Physical Hardware Inspection Frame
 * Replaces generic graphic with authentic lab hardware photos and interactive inspection views.
 */
const LineBotHardwareViewer: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<'blueprint' | 'assembly' | 'chassis'>('blueprint');
  const [modalOpen, setModalOpen] = useState(false);

  const photos = [
    {
      id: 'blueprint' as const,
      label: 'Blueprint Layout',
      src: '/images/line-bot-blueprint.jpg',
      caption: 'Physical Packaging & Dimension Blueprint · ESP32 + 8-Ch IR Array',
    },
    {
      id: 'assembly' as const,
      label: 'Chassis Assembly',
      src: '/images/line-bot-assembly.jpg',
      caption: 'Chassis Mechanical Assembly · Motor Brackets & Caster Wheel',
    },
    {
      id: 'chassis' as const,
      label: 'Wiring & Perfboard',
      src: '/images/line-bot-chassis.jpg',
      caption: 'Wiring & Perfboard Distribution · Motor Signal & Power Harness',
    },
  ];

  const current = photos.find((p) => p.id === selectedPhoto) || photos[0];

  const handleSelect = (id: 'blueprint' | 'assembly' | 'chassis') => {
    audioEngine.playMechanicalClick();
    setSelectedPhoto(id);
  };

  return (
    <>
      <div className="relative rounded-xl border border-[#C8C8C2] bg-[#141517] shadow-sm overflow-hidden h-[260px] w-full flex flex-col justify-between group">
        {/* Hardware Inspection Photo Container */}
        <div className="relative w-full h-full overflow-hidden bg-black/40">
          <img
            src={current.src}
            alt={current.caption}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-black/30 pointer-events-none" />

          {/* Top Pill Controls */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10">
            <div className="flex items-center gap-1 bg-[#111111]/85 backdrop-blur-sm p-1 rounded-md border border-white/10 shadow-sm">
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                    selectedPhoto === p.id
                      ? 'bg-[#FF5500] text-white shadow-sm'
                      : 'text-[#A1A1A6] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Inspect Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                audioEngine.playMechanicalClick();
                setModalOpen(true);
              }}
              className="p-1 rounded bg-[#111111]/80 hover:bg-[#111111] text-white border border-white/10 shadow-sm cursor-pointer transition-colors"
              title="Expand Hardware Photo"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom Monospace Caption Overlay */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between text-white font-mono text-[9px] bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10">
            <span className="truncate">{current.caption}</span>
            <span className="text-[#30D158] font-bold shrink-0 ml-2">Lab Verified</span>
          </div>
        </div>
      </div>

      {/* Full Resolution Modal Inspection */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            <div
              className="relative max-w-4xl w-full bg-[#18181B] rounded-2xl border border-white/15 p-4 sm:p-6 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FF5500]" />
                  <span className="font-mono text-xs text-white font-bold uppercase tracking-wider">
                    {current.label} · Inspection Frame
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10 max-h-[70vh] flex items-center justify-center bg-black/50">
                <img
                  src={current.src}
                  alt={current.caption}
                  className="max-h-[68vh] w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
                <span>{current.caption}</span>
                <span className="text-[#FF5500] font-semibold">JSPM Robotics Lab, Pune</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * CinemaViewportVisual — Styled as a benchtop oscilloscope / digital LCD testing panel.
 */
const CinemaViewportVisual: React.FC<{
  project: ProjectWork;
  hoverPos: { x: number; y: number };
}> = ({ project, hoverPos }) => {
  const [faultInjected, setFaultInjected] = useState(false);

  const v = project.viewport;
  const deltaX = (hoverPos.x - 0.5) * 28;
  const deltaY = (hoverPos.y - 0.5) * 20;

  const renderFaultButton = (faultLabel: string) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        audioEngine.playRelayClick();
        setFaultInjected((prev) => !prev);
      }}
      className={`cursor-shrink px-2.5 py-1 rounded font-mono text-[9px] font-bold uppercase tracking-wider transition-all shadow-[0_2px_0_rgba(0,0,0,0.2)] active:translate-y-[1px] active:shadow-none cursor-pointer ${
        faultInjected
          ? 'bg-[#FF3B30] text-white shadow-[0_2px_0_#B81414]'
          : 'bg-[#FF5500] text-white shadow-[0_2px_0_#CC4400] hover:bg-[#FF6611]'
      }`}
    >
      {faultInjected ? 'Fault Active · Reset' : faultLabel}
    </button>
  );

  switch (project.visualizerType) {
    case 'motorguard-cbm':
      return <MotorGuardVisualizer project={project} />;

    case 'agv-line-pid':
      return <LineBotHardwareViewer />;

    case 'rover-6wd':
      return (
        <div
          className={`relative rounded-lg bg-[#141517] border transition-colors duration-300 h-[260px] w-full p-4 flex flex-col justify-between overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.6)] ${
            faultInjected ? 'border-[#FF3B30]' : 'border-[#2C2D32]'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-[10px] text-[#8E8E93]">
            <span>{v.label}</span>
            <span
              className={`font-bold tracking-wider px-2 py-0.5 rounded bg-black/60 border border-white/10 ${
                faultInjected ? 'text-[#FF453A]' : 'text-[#30D158]'
              }`}
            >
              {faultInjected ? v.faultStatus : v.status}
            </span>
          </div>

          <svg viewBox="0 0 340 140" className="w-full h-36 overflow-visible">
            {/* Chassis Outline */}
            <rect
              x="110"
              y="32"
              width="120"
              height="76"
              rx="6"
              fill="#1C1D22"
              stroke={faultInjected ? '#FF3B30' : '#4E505E'}
              strokeWidth="1.6"
            />
            {/* 6 Independent Wheel Assemblies */}
            {[
              { x: 92, y: 34 },
              { x: 92, y: 64 },
              { x: 92, y: 94 },
              { x: 236, y: 34 },
              { x: 236, y: 64 },
              { x: 236, y: 94 },
            ].map((wheel, idx) => (
              <g key={idx}>
                <rect
                  x={wheel.x}
                  y={wheel.y - 10}
                  width="14"
                  height="20"
                  rx="3"
                  fill="#2A2B32"
                  stroke={faultInjected && idx >= 3 ? '#FF3B30' : '#30D158'}
                  strokeWidth="1.2"
                />
              </g>
            ))}

            <circle
              cx={faultInjected ? 220 : 170 + deltaX}
              cy={faultInjected ? 40 : 70 + deltaY}
              r="4"
              fill={faultInjected ? '#FF3B30' : '#30D158'}
            />
            <circle cx="170" cy="70" r="3.5" fill="#FFFFFF" />
          </svg>

          <div className="flex items-center justify-between gap-2 font-mono text-[9px] text-[#A1A1A6]">
            <span className="truncate">
              {faultInjected ? v.faultFooter : v.footer}
            </span>
            {renderFaultButton(v.faultButton)}
          </div>
        </div>
      );

    case 'ecu-alcohol-safety':
      return (
        <div
          className={`relative rounded-lg bg-[#141517] border transition-colors duration-300 h-[260px] w-full p-4 flex flex-col justify-between overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.6)] ${
            faultInjected ? 'border-[#FF3B30]' : 'border-[#2C2D32]'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-[10px] text-[#8E8E93]">
            <span>{v.label}</span>
            <span
              className={`font-bold tracking-wider px-2 py-0.5 rounded bg-black/60 border border-white/10 ${
                faultInjected ? 'text-[#FF453A]' : 'text-[#30D158]'
              }`}
            >
              {faultInjected ? v.faultStatus : v.status}
            </span>
          </div>

          <svg viewBox="0 0 340 140" className="w-full h-36 overflow-visible">
            <line x1="20" y1="110" x2="320" y2="110" stroke="#3A3C45" strokeWidth="1.2" />
            <path
              d={
                faultInjected
                  ? 'M 20 100 Q 120 95 180 50 T 320 20'
                  : 'M 20 105 Q 140 104 220 100 T 320 98'
              }
              fill="none"
              stroke={faultInjected ? '#FF3B30' : '#30D158'}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>

          <div className="flex items-center justify-between gap-2 font-mono text-[9px] text-[#A1A1A6]">
            <span className="truncate">
              {faultInjected ? v.faultFooter : v.footer}
            </span>
            {renderFaultButton(v.faultButton)}
          </div>
        </div>
      );

    case 'contactless-door':
    default:
      return (
        <div
          className={`relative rounded-lg bg-[#141517] border transition-colors duration-300 h-[260px] w-full p-4 flex flex-col justify-between overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.6)] ${
            faultInjected ? 'border-[#FF3B30]' : 'border-[#2C2D32]'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-[10px] text-[#8E8E93]">
            <span>{v.label}</span>
            <span
              className={`font-bold tracking-wider px-2 py-0.5 rounded bg-black/60 border border-white/10 ${
                faultInjected ? 'text-[#FF453A]' : 'text-[#30D158]'
              }`}
            >
              {faultInjected ? v.faultStatus : v.status}
            </span>
          </div>

          <svg viewBox="0 0 340 140" className="w-full h-36 overflow-visible">
            {[26, 46, 66].map((r, idx) => (
              <motion.path
                key={r}
                d={`M ${170 - r} ${42 + idx * 12} Q 170 ${66 + idx * 16} ${170 + r} ${42 + idx * 12}`}
                fill="none"
                stroke={faultInjected ? '#FF3B30' : '#30D158'}
                strokeWidth="1.8"
                strokeLinecap="round"
                animate={{ opacity: [0.25, 0.8, 0.25] }}
                transition={{
                  duration: 2.2,
                  delay: idx * 0.35,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </svg>

          <div className="flex items-center justify-between gap-2 font-mono text-[9px] text-[#A1A1A6]">
            <span className="truncate">
              {faultInjected ? v.faultFooter : v.footer}
            </span>
            {renderFaultButton(v.faultButton)}
          </div>
        </div>
      );
  }
};

/**
 * Modular Hardware Datasheet Card — Styled like an authentic industrial module datasheet.
 */
const ModularDatasheetCard: React.FC<{ project: ProjectWork; idx: number }> = ({
  project,
  idx,
}) => {
  const cardRef = useGsapCardTilt<HTMLElement>(2);
  const [hoverPos, setHoverPos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setHoverPos({ x: px / rect.width, y: py / rect.height });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const px = touch.clientX - rect.left;
    const py = touch.clientY - rect.top;
    setHoverPos({
      x: Math.max(0, Math.min(1, px / rect.width)),
      y: Math.max(0, Math.min(1, py / rect.height)),
    });
  };

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: idx * 0.05, ease: STUDIO_EASE }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      data-dmm-target={project.slug.includes('motorguard') ? 'motorguard' : project.slug.includes('agv') ? 'agv' : 'project'}
      className="group relative rounded-xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.03),0_12px_28px_-12px_rgba(0,0,0,0.06)] p-6 sm:p-8 md:p-10 mb-8 last:mb-0 overflow-hidden transform-gpu"
    >
      <CornerCrosshairs type="screw" />

      {/* Top Hardware Datasheet Header Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-[#D5D5D0]">
        <div className="flex items-center gap-2.5">
          {/* Solid Rounded Module Badge */}
          <span className="bg-[#FF5500] text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded shadow-[0_1px_0_#CC4400]">
            Module 0{idx + 1}
          </span>
          <span className="font-mono text-[11px] font-bold text-[#111111] uppercase tracking-wider">
            {project.domainKicker}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline font-mono text-[9px] text-[#555550] uppercase bg-[#E6E6E3] px-2.5 py-0.5 rounded border border-[#D0D0CA] font-semibold">
            Status: Deployed
          </span>
          <Link
            to={`/projects/${project.slug}`}
            onClick={() => audioEngine.playMechanicalClick()}
            className="cursor-shrink inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#111111] hover:text-[#FF5500] transition-colors bg-[#EAEAE7] hover:bg-[#E2E2DF] px-2.5 py-1 rounded border border-[#D0D0CA]"
          >
            <span>Field Spec</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 60/40 Modular Split */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side (7 Cols): Title, Narrative & Multimeter LED Windows */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 min-w-0">
          <div className="space-y-2.5">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              <Link
                to={`/projects/${project.slug}`}
                onClick={() => audioEngine.playMechanicalClick()}
                className="cursor-shrink focus:outline-none hover:text-[#FF5500] transition-colors"
              >
                {project.title}
              </Link>
            </h3>

            <p className="text-sm sm:text-base text-[#555550] leading-relaxed max-w-[56ch]">
              {project.summary}
            </p>
          </div>

          {/* 7-Segment / Recessed Multimeter LED Display Windows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-[#D5D5D0]">
            {project.stats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-0 bg-[#E6E6E3] p-2.5 rounded-lg border border-[#D0D0CA] shadow-inner"
              >
                <div className="bg-[#121315] text-[#FF453A] font-mono px-2.5 py-1.5 rounded-[3px] border border-black/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.7)] text-center text-lg sm:text-xl font-bold tracking-widest tabular-nums truncate drop-shadow-[0_0_6px_rgba(255,69,58,0.4)]">
                  {stat.value}
                </div>
                <p className="text-[9px] uppercase tracking-wider text-[#666662] mt-1.5 font-mono font-bold text-center truncate">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Solid Specification Hardware Badges in Functional 4-Color Palette */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {project.tools.map((tag) => {
              const isBus = tag.includes('UART') || tag.includes('PWM') || tag.includes('PID') || tag.includes('C++');
              return (
                <span
                  key={tag}
                  className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold shadow-sm ${
                    isBus
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                      : 'bg-[#E8E8E5] text-[#222220] border border-[#D0D0CB]'
                  }`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right Side (5 Cols): Real Hardware Viewer or Oscilloscope LCD Viewport */}
        <div className="lg:col-span-5 w-full">
          <CinemaViewportVisual project={project} hoverPos={hoverPos} />
        </div>
      </div>
    </motion.article>
  );
};

export const TechCards: React.FC = () => {
  return (
    <section
      id="projects"
      className="relative bg-[#ECECEB] py-20 sm:py-28 border-b border-[#D5D5D0]"
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[10px] text-[#FF5500] uppercase font-bold tracking-wider mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500]" />
              <span>{PROJECTS_SECTION.kicker}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#111111]">
              {PROJECTS_SECTION.heading}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <TactileDial color="blue" size={24} rotation={90} label="SYS" />
            <span className="font-mono text-xs font-bold text-[#555550] bg-[#DFDFDC] px-3 py-1.5 rounded border border-[#D0D0CB] shadow-sm tabular-nums">
              {PROJECTS_SECTION.counterLabel.replace('//', '·')}
            </span>
          </div>
        </div>

        {/* Modular Hardware Datasheet Cards */}
        <div>
          {PROJECTS.map((project, idx) => (
            <ModularDatasheetCard key={project.id} project={project} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

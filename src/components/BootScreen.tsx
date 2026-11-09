import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpinningTorusO } from './SpinningTorusO';
import { CornerCrosshairs } from './CornerCrosshairs';
import { BOOT_SEQUENCE, PERSONAL_PROFILE } from '../data/projects';
import { audioEngine } from '../utils/audio';

const SESSION_KEY = 'boot-sequence-shown';

/** Shows on initial visit, with ?boot override for previewing anytime. */
const shouldShowBoot = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('boot')) return true;
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // fallback
  }
  return true;
};

export const BootScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(shouldShowBoot);
  const [progress, setProgress] = useState(0);
  const lastStepRef = useRef(-1);

  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    const duration = 1350;
    let rafId = 0;
    let hideTimer = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const currentProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(currentProgress);

      // Trigger subtle mechanical click on each telemetry calibration step transition
      const steps = BOOT_SEQUENCE.steps;
      const currentStep = Math.min(steps.length - 1, Math.floor((currentProgress / 100) * steps.length));
      if (currentStep !== lastStepRef.current) {
        lastStepRef.current = currentStep;
        if (currentProgress < 100) {
          audioEngine.playMechanicalClick();
        } else {
          audioEngine.playRelayClick();
        }
      }

      if (elapsed < duration) {
        rafId = requestAnimationFrame(tick);
      } else {
        hideTimer = window.setTimeout(() => setIsVisible(false), 240);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(hideTimer);
    };
  }, [isVisible]);

  const steps = BOOT_SEQUENCE.steps;
  const stepIndex = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));
  const done = progress >= 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="boot-screen"
          role="status"
          aria-live="polite"
          aria-label="Loading engineering portfolio"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.012, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[100000] bg-[#ECECEB] flex flex-col items-center justify-center px-6 select-none"
          style={{
            backgroundImage:
              'radial-gradient(#B8B8B2 0.75px, transparent 0.75px), linear-gradient(to right, #D8D8D2 0.5px, transparent 0.5px), linear-gradient(to bottom, #D8D8D2 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px, 120px 120px, 120px 120px',
          }}
        >
          {/* Stamped Anodized Aluminum Hardware Calibration Console */}
          <div className="relative z-10 w-full max-w-[400px] rounded-2xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_60px_rgba(0,0,0,0.14)] p-8 space-y-6">
            <CornerCrosshairs variant="screws" />

            {/* Top Identity & Status Header */}
            <div className="flex items-center justify-between border-b border-[#D5D5D0] pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: done ? '#10B981' : '#FF5500',
                    boxShadow: done ? '0 0 8px #10B981' : '0 0 8px #FF5500',
                  }}
                />
                <span className="font-mono text-xs text-[#111111] font-bold tracking-wider">
                  {PERSONAL_PROFILE.name.toUpperCase()} · CALIBRATION
                </span>
              </div>
              <SpinningTorusO className="w-7 h-7" color="#111111" />
            </div>

            {/* Recessed Digital Multimeter 7-Segment Window */}
            <div className="bg-[#E6E6E3] p-3 rounded-xl border border-[#D0D0CA] shadow-inner flex items-center justify-between">
              <div>
                <p className="font-mono text-[9px] text-[#888884] uppercase tracking-widest font-bold">
                  {BOOT_SEQUENCE.title}
                </p>
                <p className="font-mono text-[11px] text-[#222220] mt-1 font-semibold truncate max-w-[210px]">
                  {steps[stepIndex]}
                </p>
              </div>

              {/* Digital LED Window */}
              <div className="bg-[#121315] text-[#FF453A] font-mono px-3 py-1.5 rounded-[4px] border border-black/60 shadow-inner font-bold text-2xl tracking-widest tabular-nums drop-shadow-[0_0_8px_rgba(255,69,58,0.5)]">
                {String(progress).padStart(3, '0')}%
              </div>
            </div>

            {/* Recessed Mechanical Progress Track */}
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-[#DFDFDC] border border-[#C8C8C2] shadow-inner overflow-hidden p-[1px]">
                <div
                  className="h-full rounded-full bg-[#FF5500] transition-all duration-75 shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[9px] text-[#888884]">
                <span>SCALE: 0 TO 100%</span>
                <span>BUS: NOMINAL</span>
              </div>
            </div>

            {/* Bottom Telemetry Status Strip */}
            <div className="flex items-center justify-between font-mono text-[10px] text-[#777772] pt-2 border-t border-[#EAEAE7]">
              <span>{BOOT_SEQUENCE.footerLeft}</span>
              <span className={done ? 'text-[#059669] font-bold' : 'text-[#FF5500] font-semibold'}>
                {done ? '● ONLINE · READY' : '○ CALIBRATING...'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

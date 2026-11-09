import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioEngine } from '../utils/audio';

interface Shortcut {
  key: string;
  label: string;
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { key: 'SPACE', label: 'Gripper', description: 'Clamp / release robotic arm end-effector' },
  { key: 'M', label: 'Audio', description: 'Toggle mechanical relay audio synthesizer' },
  { key: 'X', label: 'CAD X-Ray', description: 'Toggle PCB schematic netlist overlay' },
  { key: 'D', label: 'DMM Probe', description: 'Toggle benchtop multimeter test probes' },
  { key: '1-4', label: 'Robot Lab', description: 'Switch stickman assembly actions' },
  { key: '?', label: 'Keymap', description: 'Open / close this hardware shortcut card' },
];

export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 1500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when typing in inputs or textareas
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      const key = e.key.toUpperCase();

      if (e.key === ' ' || e.code === 'Space') {
        // Space: Toggle robotic arm gripper
        // Only prevent default if not focused on another interactive button
        if (activeEl?.tagName !== 'BUTTON') {
          e.preventDefault();
          audioEngine.playMechanicalClick();
          window.dispatchEvent(new CustomEvent('portfolio-toggle-gripper'));
          showToast('GRIPPER ACTUATED');
        }
      } else if (key === 'M') {
        audioEngine.playRelayClick();
        const muted = audioEngine.toggleMute();
        showToast(muted ? 'AUDIO: MUTED' : 'AUDIO: ACTIVE');
      } else if (key === 'X') {
        audioEngine.playRelayClick();
        window.dispatchEvent(new CustomEvent('portfolio-toggle-xray'));
        const isXray = document.documentElement.classList.toggle('schematic-xray-active');
        showToast(isXray ? 'CAD X-RAY: ON' : 'CAD X-RAY: OFF');
      } else if (key === 'D') {
        audioEngine.playRelayClick();
        window.dispatchEvent(new CustomEvent('portfolio-toggle-dmm'));
        showToast('DMM MULTIMETER PROBES');
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const phases = ['welding', 'bolting', 'coding', 'online'];
        const phaseIdx = parseInt(e.key, 10) - 1;
        const phase = phases[phaseIdx];
        if (phase) {
          audioEngine.playMechanicalClick();
          window.dispatchEvent(new CustomEvent('portfolio-set-builder-phase', { detail: phase }));
          showToast(`ROBOT LAB: ${phase.toUpperCase()}`);
        }
      } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        audioEngine.playMechanicalClick();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isOpen) {
          audioEngine.playMechanicalClick();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Transient Action Toast HUD */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-[#ECECEB] px-3.5 py-1.5 rounded-lg border border-[#333333] shadow-2xl font-mono text-xs flex items-center gap-2 pointer-events-none select-none"
          >
            <span className="h-2 w-2 rounded-full bg-[#FF5500] animate-pulse" />
            <span className="font-bold tracking-wider">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docked Keyboard Shortcuts Launcher Pill (Desktop & Laptop Bottom Left) */}
      <div className="hidden sm:block fixed bottom-4 left-6 z-40">
        <button
          type="button"
          onClick={() => {
            audioEngine.playMechanicalClick();
            setIsOpen((prev) => !prev);
          }}
          title="Open Hardware Hotkeys [?]"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08)] bg-[#ECECEB]/90 backdrop-blur-md border border-[#D0D0CA] text-[#555550] hover:text-[#111111] hover:border-[#111111]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500]" />
          <span>⌨ KEYS</span>
          <span className="hidden sm:inline text-[9px] bg-[#DFDFDC] px-1 py-0.2 rounded text-[#777772]">?</span>
        </button>
      </div>

      {/* Hardware Keymap Drawer Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[440px] rounded-2xl bg-[#ECECEB] border border-[#D0D0CA] shadow-2xl p-5 text-[#111111] font-mono"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#D5D5D0] mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FF5500] animate-pulse" />
                  <span className="font-sans font-extrabold text-sm tracking-tight text-[#111111]">
                    HARDWARE HOTKEYS &amp; SHORTCUTS
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs px-2 py-0.5 rounded hover:bg-[#DFDFDC] text-[#666662] hover:text-[#111111]"
                >
                  ✕ ESC
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="space-y-2.5">
                {SHORTCUTS.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F3] border border-[#D5D5D0] text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-[#111111]">{s.label}</span>
                      <span className="text-[10px] text-[#777772]">{s.description}</span>
                    </div>
                    <span className="bg-[#111111] text-[#30D158] font-mono font-bold px-2 py-1 rounded border border-black shadow-sm text-xs">
                      {s.key}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer Note */}
              <div className="mt-4 pt-3 border-t border-[#D5D5D0] flex items-center justify-between text-[10px] text-[#888884]">
                <span>DIETER RAMS HARDWARE TEST SUITE</span>
                <span>PRESS [?] TO TOGGLE</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

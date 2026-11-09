import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioEngine } from '../utils/audio';

type TestInstrumentTab = 'dso' | 'tape' | 'dmm';

interface ProbeTargetTelemetry {
  target: string;
  voltage: string;
  current: string;
  impedance: string;
  signal: string;
  status: string;
}

const DEFAULT_PROBE: ProbeTargetTelemetry = {
  target: 'CHASSIS STAR GROUND',
  voltage: '0.00 VDC',
  current: '0.00 mA',
  impedance: '0.02 Ω',
  signal: 'EARTH STAR GROUND BUS',
  status: 'CONTINUITY OK',
};

export const BenchtopTestSuite: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TestInstrumentTab>('dso');
  const [xrayActive, setXrayActive] = useState(false);
  const [dmmActive, setDmmActive] = useState(false);
  const [dsoChannel, setDsoChannel] = useState<'ch1' | 'ch2' | 'ch3'>('ch1');
  const [dsoRunning, setDsoRunning] = useState(true);
  const [timeDivIndex, setTimeDivIndex] = useState(2); // 1ms default
  const [voltsDivIndex, setVoltsDivIndex] = useState(1); // 1V default

  // Tape memo player states
  const [tapePlaying, setTapePlaying] = useState(false);
  const [tapeTrack, setTapeTrack] = useState<number>(1);
  const [tapeCounter, setTapeCounter] = useState(14.2);

  // DMM Probe floating tooltip
  const [probePos, setProbePos] = useState<{ x: number; y: number } | null>(null);
  const [probeTelemetry, setProbeTelemetry] = useState<ProbeTargetTelemetry>(DEFAULT_PROBE);

  const dsoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  const timeDivs = ['200μs', '500μs', '1ms', '2ms', '5ms'];
  const voltsDivs = ['200mV', '500mV', '1V', '2V', '5V'];

  // Toggle X-Ray mode and apply class to document body
  const toggleXray = () => {
    audioEngine.playRelayClick();
    setXrayActive((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('schematic-xray-active');
      } else {
        document.documentElement.classList.remove('schematic-xray-active');
      }
      return next;
    });
  };

  // Toggle DMM mode
  const toggleDmm = () => {
    audioEngine.playRelayClick();
    setDmmActive((prev) => {
      const next = !prev;
      if (next) {
        setIsOpen(true);
        setActiveTab('dmm');
        audioEngine.playMultimeterBeep();
      } else {
        setProbePos(null);
      }
      return next;
    });
  };

  // DMM Global Mouse Probe listener
  useEffect(() => {
    if (!dmmActive) return;

    let lastProbeBeep = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setProbePos({ x: e.clientX, y: e.clientY });

      // Determine telemetry based on what element is under the probe
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;

      const closestCard = target.closest('[data-dmm-target]');
      let newTelemetry: ProbeTargetTelemetry = DEFAULT_PROBE;

      if (closestCard) {
        const type = closestCard.getAttribute('data-dmm-target');
        if (type === 'motorguard') {
          newTelemetry = {
            target: 'MOTORGUARD POWER BUS',
            voltage: '12.60 VDC',
            current: '4.80 A',
            impedance: '2.62 Ω',
            signal: '20 kHz PWM @ 65% DUTY',
            status: 'THERMAL 42°C NOMINAL',
          };
        } else if (type === 'manipulator') {
          newTelemetry = {
            target: 'MG996R SERVO BUS',
            voltage: '5.02 VDC',
            current: '1.45 A',
            impedance: '3.46 Ω',
            signal: '50 Hz PWM (1.52 ms PULSE)',
            status: 'CLOSED-LOOP IK LOCKED',
          };
        } else if (type === 'mcu') {
          newTelemetry = {
            target: 'ESP32-S3 / JETSON ORIN',
            voltage: '3.31 VDC',
            current: '420 mA',
            impedance: '7.88 Ω',
            signal: '400 kHz I2C CLOCK ACTIVE',
            status: 'DUAL CORE 240 MHz',
          };
        } else if (type === 'agv') {
          newTelemetry = {
            target: '2S LI-ION TRACTION PACK',
            voltage: '7.82 VDC',
            current: '2.10 A',
            impedance: '3.72 Ω',
            signal: '8-CH INFRARED PHOTODIODE',
            status: '500 Hz PID VELOCITY',
          };
        }
      } else if (target.closest('button, a, input')) {
        newTelemetry = {
          target: 'TACTILE RELAY CONTACT',
          voltage: '3.30 VDC',
          current: '15.2 mA',
          impedance: '217 Ω',
          signal: 'GPIO PULL-UP 10 kΩ',
          status: 'DIGITAL INPUT HIGH',
        };
      } else if (target.closest('canvas')) {
        newTelemetry = {
          target: 'ANALOG SENSOR MATRIX',
          voltage: '2.48 VDC',
          current: '22.0 mA',
          impedance: '112.7 Ω',
          signal: 'DAMPED KINEMATICS STREAM',
          status: 'INTERACTIVE SOLVER RUNNING',
        };
      }

      setProbeTelemetry(newTelemetry);

      // Play subtle probe continuity chirp when switching onto an active target
      const now = Date.now();
      if (newTelemetry.target !== DEFAULT_PROBE.target && now - lastProbeBeep > 650) {
        lastProbeBeep = now;
        audioEngine.playMultimeterBeep();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dmmActive]);

  // Tape transport playback simulation
  useEffect(() => {
    let interval: number | null = null;
    if (tapePlaying) {
      interval = window.setInterval(() => {
        setTapeCounter((c) => +(c + 0.1).toFixed(1));
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tapePlaying]);

  const handlePlayTapeTrack = (trackId: number) => {
    audioEngine.playRelayClick();
    setTapeTrack(trackId);
    setTapePlaying(true);

    if (trackId === 1) {
      audioEngine.playMotorSpool();
    } else if (trackId === 2) {
      audioEngine.playPidResonance();
    } else if (trackId === 3) {
      audioEngine.playRelaySequence();
    } else if (trackId === 4) {
      audioEngine.playSonarBurst();
    }

    setTimeout(() => {
      setTapePlaying(false);
    }, 2500);
  };

  // Oscilloscope Canvas Rendering Loop
  useEffect(() => {
    if (activeTab !== 'dso' || !isOpen) return;

    const canvas = dsoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const renderDso = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;

      // Dark phosphor screen clearing
      ctx.fillStyle = '#0F120E';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope Graticule (Subtle grid)
      ctx.strokeStyle = '#1A241A';
      ctx.lineWidth = 1;
      const xDivs = 10;
      const yDivs = 8;
      const stepX = width / xDivs;
      const stepY = height / yDivs;

      ctx.beginPath();
      for (let x = 0; x <= width; x += stepX) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += stepY) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Center crosshair axis
      ctx.strokeStyle = '#273827';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (dsoRunning) {
        phaseRef.current += 0.08;
      }
      const phase = phaseRef.current;

      // Draw phosphor signal trace
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;

      if (dsoChannel === 'ch1') {
        // CH1: Real-time PWM Square Wave (Servo Control)
        ctx.strokeStyle = '#30D158'; // Phosphor Green
        ctx.shadowColor = '#30D158';
        ctx.beginPath();

        const period = stepX * (1.2 + timeDivIndex * 0.4);
        const duty = 0.62;
        const topY = height * 0.28;
        const botY = height * 0.72;

        for (let x = 0; x < width; x += 1) {
          const modX = (x + phase * 22) % period;
          const y = modX < period * duty ? topY : botY;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (dsoChannel === 'ch2') {
        // CH2: Motor Quadrature Encoder & Hall Sensor (Amber Phosphor)
        ctx.strokeStyle = '#FF9F0A'; // Amber Phosphor
        ctx.shadowColor = '#FF9F0A';
        ctx.beginPath();

        const freq = 0.04 * (5 - timeDivIndex);
        const amp = (height * 0.32) / (voltsDivIndex + 1);

        for (let x = 0; x < width; x += 2) {
          // Sine wave with motor rotor harmonic noise
          const harmonic = Math.sin((x * freq * 3) + phase * 2) * (amp * 0.12);
          const y = height / 2 + Math.sin(x * freq + phase) * amp + harmonic;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // CH3: UART / CAN Bus Digital Logic Packet (Cyan Phosphor)
        ctx.strokeStyle = '#38BDF8';
        ctx.shadowColor = '#38BDF8';
        ctx.beginPath();

        const bitW = stepX * 0.55;
        const topY = height * 0.32;
        const botY = height * 0.68;

        const packet = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0];
        for (let x = 0; x < width; x += 1) {
          const bitIdx = Math.floor(((x + phase * 18) / bitW) % packet.length);
          const y = packet[bitIdx] ? topY : botY;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(renderDso);
    };

    renderDso();

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTab, isOpen, dsoChannel, dsoRunning, timeDivIndex, voltsDivIndex]);

  return (
    <>
      {/* Floating Multimeter Probe Tooltip when DMM mode is ON */}
      {dmmActive && probePos && (
        <div
          className="fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-[125%]"
          style={{ left: probePos.x, top: probePos.y }}
        >
          <div className="bg-[#111111] text-[#ECECEB] p-2.5 rounded shadow-2xl border border-[#FF5500]/60 font-mono text-xs max-w-[280px]">
            <div className="flex items-center justify-between gap-3 text-[#FF5500] font-bold pb-1 border-b border-[#333333] mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF5500] animate-ping" />
                DMM PROBE TIP
              </span>
              <span className="text-[10px] bg-[#222222] px-1 py-0.5 rounded text-white">600V CAT III</span>
            </div>
            <div className="text-[11px] font-bold text-white mb-1 truncate">{probeTelemetry.target}</div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#A0A09C]">
              <div>
                VOLTS: <span className="text-[#30D158] font-bold">{probeTelemetry.voltage}</span>
              </div>
              <div>
                AMPS: <span className="text-[#FF9F0A] font-bold">{probeTelemetry.current}</span>
              </div>
              <div>
                IMPED: <span className="text-white font-bold">{probeTelemetry.impedance}</span>
              </div>
              <div>
                STATUS: <span className="text-[#30D158] font-bold">{probeTelemetry.status}</span>
              </div>
            </div>
            <div className="text-[9px] text-[#888884] mt-1 pt-1 border-t border-[#262626] truncate">
              SIG: {probeTelemetry.signal}
            </div>
          </div>
          {/* Probe Lead Graphic */}
          <div className="w-1.5 h-6 bg-[#FF3B30] mx-auto rounded-b border border-black shadow-md" />
          <div className="w-0.5 h-3 bg-zinc-300 mx-auto" />
        </div>
      )}

      {/* Docked Benchtop Instrument Floating Toolbar */}
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-6 z-40 flex items-center gap-1.5 p-1 bg-[#ECECEB]/90 backdrop-blur-md border border-[#D0D0CA] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        {/* Schematic X-Ray Rocker Switch */}
        <button
          onClick={toggleXray}
          title="Toggle PCB CAD Schematic Netlist Overlay"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all border ${
            xrayActive
              ? 'bg-[#111111] text-[#38BDF8] border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.35)]'
              : 'bg-[#F5F5F3] text-[#555550] border-[#D5D5D0] hover:text-[#111111] hover:border-[#111111]'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${xrayActive ? 'bg-[#38BDF8] animate-pulse' : 'bg-[#888884]'}`} />
          <span className="hidden sm:inline">CAD X-RAY</span>
          <span className="sm:hidden">X-RAY</span>
        </button>

        {/* DMM Probe Quick Latch */}
        <button
          onClick={toggleDmm}
          title="Toggle Precision Multimeter Probes"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all border ${
            dmmActive
              ? 'bg-[#111111] text-[#FF5500] border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.35)]'
              : 'bg-[#F5F5F3] text-[#555550] border-[#D5D5D0] hover:text-[#111111] hover:border-[#111111]'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dmmActive ? 'bg-[#FF5500] animate-pulse' : 'bg-[#888884]'}`} />
          <span className="hidden sm:inline">DMM PROBE</span>
          <span className="sm:hidden">DMM</span>
        </button>

        {/* Master Instrument Drawer Latch */}
        <button
          onClick={() => {
            audioEngine.playRelayClick();
            setIsOpen((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all border ${
            isOpen
              ? 'bg-[#FF5500] text-black border-[#FF5500]'
              : 'bg-[#111111] text-[#ECECEB] border-black hover:bg-[#222222]'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="hidden sm:inline">TEST DECK</span>
          <span className="sm:hidden">DECK</span>
        </button>
      </div>

      {/* Slide-Up Teenage Engineering Field Instrument Rack */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 right-4 sm:bottom-22 sm:right-6 z-50 w-[95vw] max-w-[620px] bg-[#ECECEB] border border-[#D0D0CA] rounded-2xl shadow-2xl p-4 sm:p-5 text-[#111111] font-mono select-none"
          >
            {/* Top Hardware Panel Rivets & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#D5D5D0] mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FF5500] animate-pulse" />
                <span className="font-sans font-extrabold text-sm tracking-tight text-[#111111]">
                  FIELD BENCH INSTRUMENT SUITE
                </span>
                <span className="text-[10px] bg-[#DFDFDC] text-[#666662] px-1.5 py-0.5 rounded border border-[#D0D0CB]">
                  REV 4.2
                </span>
              </div>
              <button
                onClick={() => {
                  audioEngine.playMechanicalClick();
                  setIsOpen(false);
                }}
                className="text-xs px-2 py-1 rounded hover:bg-[#DFDFDC] text-[#666662] hover:text-[#111111]"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Instrument Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-4 bg-[#DFDFDC] p-1.5 rounded-xl border border-[#D5D5D0]">
              <button
                onClick={() => {
                  audioEngine.playMechanicalClick();
                  setActiveTab('dso');
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'dso'
                    ? 'bg-[#111111] text-[#30D158] shadow-sm'
                    : 'text-[#666662] hover:text-[#111111]'
                }`}
              >
                DSO-200 SCOPE
              </button>
              <button
                onClick={() => {
                  audioEngine.playMechanicalClick();
                  setActiveTab('tape');
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'tape'
                    ? 'bg-[#111111] text-[#FF9F0A] shadow-sm'
                    : 'text-[#666662] hover:text-[#111111]'
                }`}
              >
                OP-1 TAPE MEMO
              </button>
              <button
                onClick={() => {
                  audioEngine.playMechanicalClick();
                  setActiveTab('dmm');
                  setDmmActive(true);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'dmm'
                    ? 'bg-[#111111] text-[#FF5500] shadow-sm'
                    : 'text-[#666662] hover:text-[#111111]'
                }`}
              >
                BENCH DMM
              </button>
            </div>

            {/* TAB 1: DSO-200 OSCILLOSCOPE */}
            {activeTab === 'dso' && (
              <div className="space-y-3">
                {/* Phosphor CRT Screen */}
                <div className="relative rounded-lg overflow-hidden border border-[#273827] bg-[#0F120E] shadow-inner">
                  <canvas ref={dsoCanvasRef} width={580} height={200} className="w-full h-[180px] sm:h-[200px]" />

                  {/* On-Screen Telemetry OSD */}
                  <div className="absolute top-2 left-2 flex items-center gap-2 text-[10px] font-mono text-[#30D158]/90">
                    <span className="bg-black/60 px-1.5 py-0.5 rounded border border-[#30D158]/40">
                      {dsoChannel === 'ch1' ? 'CH1: SERVO PWM' : dsoChannel === 'ch2' ? 'CH2: MOTOR RPM' : 'CH3: CAN BUS'}
                    </span>
                    <span className="bg-black/60 px-1.5 py-0.5 rounded text-white/80">
                      T: {timeDivs[timeDivIndex]}/div
                    </span>
                    <span className="bg-black/60 px-1.5 py-0.5 rounded text-white/80">
                      V: {voltsDivs[voltsDivIndex]}/div
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[10px] font-mono">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        dsoRunning ? 'bg-[#30D158] text-black' : 'bg-[#FF3B30] text-white'
                      }`}
                    >
                      {dsoRunning ? 'AUTO TRIG' : 'HOLD'}
                    </span>
                  </div>
                </div>

                {/* Tactile DSO Controls Bar */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-xs">
                  {/* Channel Selector */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-[#888884] font-bold">CHANNEL</span>
                    <div className="flex rounded border border-[#D0D0CB] overflow-hidden">
                      {(['ch1', 'ch2', 'ch3'] as const).map((ch) => (
                        <button
                          key={ch}
                          onClick={() => {
                            audioEngine.playMechanicalClick();
                            setDsoChannel(ch);
                          }}
                          className={`flex-1 py-1 text-[10px] font-bold uppercase ${
                            dsoChannel === ch ? 'bg-[#FF5500] text-black' : 'bg-[#DFDFDC] text-[#666662]'
                          }`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TIME/DIV Stepper */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-[#888884] font-bold">TIME/DIV</span>
                    <button
                      onClick={() => {
                        audioEngine.playMechanicalClick();
                        setTimeDivIndex((i) => (i + 1) % timeDivs.length);
                      }}
                      className="py-1 bg-[#F5F5F3] border border-[#D0D0CB] rounded font-bold text-center hover:bg-white"
                    >
                      {timeDivs[timeDivIndex]}
                    </button>
                  </div>

                  {/* VOLTS/DIV Stepper */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-[#888884] font-bold">VOLTS/DIV</span>
                    <button
                      onClick={() => {
                        audioEngine.playMechanicalClick();
                        setVoltsDivIndex((i) => (i + 1) % voltsDivs.length);
                      }}
                      className="py-1 bg-[#F5F5F3] border border-[#D0D0CB] rounded font-bold text-center hover:bg-white"
                    >
                      {voltsDivs[voltsDivIndex]}
                    </button>
                  </div>

                  {/* RUN / STOP Trigger */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-[#888884] font-bold">TRIGGER</span>
                    <button
                      onClick={() => {
                        audioEngine.playRelayClick();
                        setDsoRunning((r) => !r);
                      }}
                      className={`py-1 rounded font-bold text-center border ${
                        dsoRunning
                          ? 'bg-[#111111] text-[#30D158] border-black'
                          : 'bg-[#FF3B30] text-white border-[#FF3B30]'
                      }`}
                    >
                      {dsoRunning ? 'RUN' : 'HOLD'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OP-1 MAGNETIC TAPE LOOP RECORDER */}
            {activeTab === 'tape' && (
              <div className="space-y-4">
                {/* Mechanical Tape Transport Display */}
                <div className="bg-[#1A1A18] rounded-xl p-4 border border-[#333333] shadow-inner text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${tapePlaying ? 'bg-[#FF3B30] animate-ping' : 'bg-[#666662]'}`} />
                      <span className="text-xs font-bold text-[#A0A09C]">FIELD TAPE 4-TRK</span>
                    </div>
                    {/* Rolling Mechanical Counter */}
                    <div className="bg-black text-[#FF9F0A] font-mono text-sm px-2.5 py-0.5 rounded border border-white/20 tracking-widest font-bold">
                      00:{tapeCounter < 10 ? `0${tapeCounter}` : tapeCounter}
                    </div>
                  </div>

                  {/* Tape Spool Animation */}
                  <div className="flex items-center justify-around py-3 border-y border-white/10">
                    <div className="relative w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center bg-black/40">
                      <div
                        className={`w-12 h-12 rounded-full border-2 border-dashed border-[#FF5500] ${
                          tapePlaying ? 'animate-spin' : ''
                        }`}
                        style={{ animationDuration: '1.2s' }}
                      />
                      <div className="absolute w-3 h-3 bg-white rounded-full" />
                    </div>
                    <div className="h-0.5 flex-1 mx-4 bg-[#FF5500]/60 relative">
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-all`}
                        style={{ left: `${(tapeCounter * 6) % 95}%` }}
                      />
                    </div>
                    <div className="relative w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center bg-black/40">
                      <div
                        className={`w-12 h-12 rounded-full border-2 border-dashed border-[#FF5500] ${
                          tapePlaying ? 'animate-spin' : ''
                        }`}
                        style={{ animationDuration: '1.8s' }}
                      />
                      <div className="absolute w-3 h-3 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="text-center text-[11px] text-[#A0A09C] mt-2">
                    {tapePlaying ? 'PLAYING REAL-TIME HARDWARE ACOUSTIC SYNTH' : 'READY TO PLAY FIELD SAMPLES'}
                  </div>
                </div>

                {/* Track Trigger Buttons */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handlePlayTapeTrack(1)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      tapePlaying && tapeTrack === 1
                        ? 'bg-[#FF5500] text-black border-[#FF5500] font-bold'
                        : 'bg-[#F5F5F3] border-[#D0D0CB] hover:bg-white text-[#111111]'
                    }`}
                  >
                    <div className="text-[10px] text-[#888884]">TRK 1 · PROPULSION</div>
                    <div className="font-bold">12k RPM BLDC Spool</div>
                  </button>
                  <button
                    onClick={() => handlePlayTapeTrack(2)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      tapePlaying && tapeTrack === 2
                        ? 'bg-[#FF5500] text-black border-[#FF5500] font-bold'
                        : 'bg-[#F5F5F3] border-[#D0D0CB] hover:bg-white text-[#111111]'
                    }`}
                  >
                    <div className="text-[10px] text-[#888884]">TRK 2 · CONTROL LOOP</div>
                    <div className="font-bold">PID Loop Damping</div>
                  </button>
                  <button
                    onClick={() => handlePlayTapeTrack(3)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      tapePlaying && tapeTrack === 3
                        ? 'bg-[#FF5500] text-black border-[#FF5500] font-bold'
                        : 'bg-[#F5F5F3] border-[#D0D0CB] hover:bg-white text-[#111111]'
                    }`}
                  >
                    <div className="text-[10px] text-[#888884]">TRK 3 · ACTUATORS</div>
                    <div className="font-bold">Dual Solenoid Relay</div>
                  </button>
                  <button
                    onClick={() => handlePlayTapeTrack(4)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      tapePlaying && tapeTrack === 4
                        ? 'bg-[#FF5500] text-black border-[#FF5500] font-bold'
                        : 'bg-[#F5F5F3] border-[#D0D0CB] hover:bg-white text-[#111111]'
                    }`}
                  >
                    <div className="text-[10px] text-[#888884]">TRK 4 · TELEMETRY</div>
                    <div className="font-bold">Ultrasonic Sonar Ping</div>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: BENCHTOP MULTIMETER */}
            {activeTab === 'dmm' && (
              <div className="space-y-4">
                {/* 7-Segment Digital Bench Multimeter Window */}
                <div className="bg-[#111111] p-4 rounded-xl border border-black shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3 text-xs">
                    <span className="text-[#FF5500] font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#FF5500] animate-ping" />
                      BENCHTOP DMM · TRUE RMS
                    </span>
                    <span className="text-[#A0A09C] text-[10px]">6.5 DIGIT PRECISION</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-2">
                    <div>
                      <div className="text-[10px] text-[#888884] uppercase">DC VOLTAGE</div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#30D158] font-mono tracking-wider">
                        {probeTelemetry.voltage}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#888884] uppercase">DC CURRENT</div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#FF9F0A] font-mono tracking-wider">
                        {probeTelemetry.current}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-[#888884] text-[10px]">IMPEDANCE: </span>
                      <span className="text-white font-bold">{probeTelemetry.impedance}</span>
                    </div>
                    <div>
                      <span className="text-[#888884] text-[10px]">STATUS: </span>
                      <span className="text-[#30D158] font-bold">{probeTelemetry.status}</span>
                    </div>
                  </div>
                </div>

                {/* Probe Instructions & Latch Toggle */}
                <div className="flex items-center justify-between bg-[#DFDFDC] p-3 rounded-lg border border-[#D5D5D0] text-xs">
                  <div>
                    <div className="font-bold text-[#111111]">Interactive Multimeter Leads</div>
                    <div className="text-[11px] text-[#666662]">Move cursor over any component or project card to probe live signals.</div>
                  </div>
                  <button
                    onClick={toggleDmm}
                    className={`px-3 py-1.5 rounded font-bold ${
                      dmmActive ? 'bg-[#FF5500] text-black' : 'bg-[#111111] text-white'
                    }`}
                  >
                    {dmmActive ? 'PROBES ON' : 'ENABLE'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

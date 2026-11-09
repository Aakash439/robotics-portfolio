import React, { useEffect, useRef, useState } from 'react';
import { CornerCrosshairs } from './CornerCrosshairs';
import { audioEngine } from '../utils/audio';

type VisualizerMode = 'gimbal' | 'gearbox';

export const HeroGimbalVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<VisualizerMode>('gimbal');
  const [telemetry, setTelemetry] = useState({
    pitch: 14.2,
    roll: -8.6,
    yaw: 42.0,
    rpm: 720,
  });

  const stateRef = useRef({
    targetRotX: 0.35,
    targetRotY: 0.65,
    rotX: 0.35,
    rotY: 0.65,
    rotZ: 0,
    gearAngle: 0,
    isHovering: false,
    speed: 1,
  });

  const handleModeToggle = (newMode: VisualizerMode) => {
    audioEngine.playRelayClick();
    setMode(newMode);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let running = true;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = 210;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // 3D Point Projection Helper
    const project = (
      x: number,
      y: number,
      z: number,
      cx: number,
      cy: number,
      rotX: number,
      rotY: number
    ): [number, number, number] => {
      // Y-axis rotation
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // X-axis rotation
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // Perspective projection
      const fov = 340;
      const scale = fov / (fov + z2 + 180);
      return [cx + x1 * scale, cy + y2 * scale, z2];
    };

    // Draw 3D Ring with segment ticks
    const draw3DRing = (
      radius: number,
      tiltAxis: 'x' | 'y' | 'z',
      color: string,
      lineWidth: number,
      rotX: number,
      rotY: number,
      cx: number,
      cy: number,
      angleOffset = 0
    ) => {
      const segments = 48;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      let first = true;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2 + angleOffset;
        let px = 0;
        let py = 0;
        let pz = 0;

        if (tiltAxis === 'x') {
          px = Math.cos(theta) * radius;
          py = Math.sin(theta) * radius;
          pz = 0;
        } else if (tiltAxis === 'y') {
          px = Math.cos(theta) * radius;
          py = 0;
          pz = Math.sin(theta) * radius;
        } else {
          px = 0;
          py = Math.cos(theta) * radius;
          pz = Math.sin(theta) * radius;
        }

        const [sx, sy] = project(px, py, pz, cx, cy, rotX, rotY);
        if (first) {
          ctx.moveTo(sx, sy);
          first = false;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();
    };

    let lastTime = performance.now();
    let frameCounter = 0;

    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;
      frameCounter++;

      const s = stateRef.current;
      const cx = width / 2;
      const cy = height / 2;

      // Smooth inertia following
      if (!s.isHovering) {
        s.targetRotY += 0.008;
        s.targetRotX = 0.28 + Math.sin(now * 0.0008) * 0.15;
      }

      s.rotX += (s.targetRotX - s.rotX) * 0.08;
      s.rotY += (s.targetRotY - s.rotY) * 0.08;
      s.gearAngle += dt * 2.2 * s.speed;

      // Update telemetry display every 6 frames
      if (frameCounter % 6 === 0) {
        const pDeg = +((s.rotX * 180) / Math.PI).toFixed(1);
        const rDeg = +(((s.rotY % (Math.PI * 2)) * 180) / Math.PI).toFixed(1);
        const yDeg = +(((now * 0.04) % 360)).toFixed(1);
        setTelemetry({
          pitch: pDeg,
          roll: rDeg,
          yaw: yDeg,
          rpm: Math.round(680 + Math.sin(now * 0.001) * 80),
        });
      }

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Subtle engineering coordinate grid background
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      const step = 20;
      ctx.beginPath();
      for (let x = 0; x < width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Outer boundary hairline ring
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy, 78, 0, Math.PI * 2);
      ctx.stroke();

      if (mode === 'gimbal') {
        // --- 3D INERTIAL GIMBAL VISUALIZATION ---
        // 1. Outer Ring: Yaw (Titanium gray)
        draw3DRing(72, 'y', '#4A4A46', 2.4, s.rotX, s.rotY, cx, cy);

        // 2. Intermediate Ring: Pitch (Safety Amber Brass)
        draw3DRing(56, 'x', '#D97706', 2.0, s.rotX + 0.1, s.rotY + Math.sin(now * 0.001) * 0.3, cx, cy);

        // 3. Inner Ring: Roll (Safety Orange)
        draw3DRing(40, 'z', '#FF5500', 1.8, s.rotX, s.rotY + s.gearAngle * 0.5, cx, cy);

        // Central Triad Coordinate Vector Arrows
        const axes: [number, number, number, string, string][] = [
          [28, 0, 0, '#FF3B30', 'X'], // X: Red
          [0, -28, 0, '#10B981', 'Y'], // Y: Green
          [0, 0, 28, '#2563EB', 'Z'], // Z: Blue
        ];

        axes.forEach(([ax, ay, az, col, lbl]) => {
          const [sx, sy] = project(ax, ay, az, cx, cy, s.rotX, s.rotY);
          const [bx, by] = project(0, 0, 0, cx, cy, s.rotX, s.rotY);

          ctx.beginPath();
          ctx.strokeStyle = col;
          ctx.lineWidth = 2.2;
          ctx.moveTo(bx, by);
          ctx.lineTo(sx, sy);
          ctx.stroke();

          // Axis arrowhead dot
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#111111';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(lbl, sx + 5, sy - 2);
        });

        // Center IMU Core Chip
        const [coreX, coreY] = project(0, 0, 0, cx, cy, s.rotX, s.rotY);
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(coreX, coreY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        // --- PLANETARY GEARBOX DRIVE VISUALIZATION ---
        const ga = s.gearAngle;

        // Outer Ring Gear (Annulus)
        ctx.strokeStyle = '#1A1A18';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.stroke();

        // Ring gear internal teeth
        const ringTeeth = 36;
        ctx.strokeStyle = '#888884';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < ringTeeth; i++) {
          const a = (i / ringTeeth) * Math.PI * 2;
          const r0 = 65;
          const r1 = 70;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          ctx.stroke();
        }

        // Sun Gear (Center)
        ctx.fillStyle = '#FF5500';
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Sun gear teeth
        const sunTeeth = 12;
        for (let i = 0; i < sunTeeth; i++) {
          const a = (i / sunTeeth) * Math.PI * 2 + ga;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * 19, cy + Math.sin(a) * 19);
          ctx.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26);
          ctx.stroke();
        }

        // 3 Planet Gears orbiting Sun
        const planetOrbitRadius = 45;
        const numPlanets = 3;
        for (let p = 0; p < numPlanets; p++) {
          const orbitAngle = (p / numPlanets) * Math.PI * 2 + ga * 0.35;
          const px = cx + Math.cos(orbitAngle) * planetOrbitRadius;
          const py = cy + Math.sin(orbitAngle) * planetOrbitRadius;

          // Planet Gear Body
          ctx.fillStyle = '#E5E5E0';
          ctx.beginPath();
          ctx.arc(px, py, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#111111';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Planet teeth
          const pTeeth = 10;
          const pSpin = -ga * 1.8;
          for (let i = 0; i < pTeeth; i++) {
            const a = (i / pTeeth) * Math.PI * 2 + pSpin;
            ctx.beginPath();
            ctx.moveTo(px + Math.cos(a) * 15, py + Math.sin(a) * 15);
            ctx.lineTo(px + Math.cos(a) * 22, py + Math.sin(a) * 22);
            ctx.stroke();
          }

          // Pinion Bearing center dot
          ctx.fillStyle = '#FF5500';
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Carrier Triangle connecting the 3 planet axes
        ctx.strokeStyle = 'rgba(17, 17, 17, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let p = 0; p < numPlanets; p++) {
          const orbitAngle = (p / numPlanets) * Math.PI * 2 + ga * 0.35;
          const px = cx + Math.cos(orbitAngle) * planetOrbitRadius;
          const py = cy + Math.sin(orbitAngle) * planetOrbitRadius;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [mode]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    const s = stateRef.current;
    s.isHovering = true;
    s.targetRotY = (nx - 0.5) * Math.PI * 1.6;
    s.targetRotX = (ny - 0.5) * Math.PI * 1.2;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => (stateRef.current.isHovering = false)}
      className="relative rounded-xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.03),0_8px_20px_-8px_rgba(0,0,0,0.06)] p-4 select-none group transition-all"
    >
      <CornerCrosshairs type="screw" />

      {/* Header Strip */}
      <div className="relative z-10 flex items-center justify-between pb-2.5 mb-2 border-b border-[#D5D5D0]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#FF5500] animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold text-[#111111] uppercase tracking-wider">
            6-DoF IMU &amp; Planetary Drive
          </span>
        </div>

        {/* Mode Rocker Buttons */}
        <div className="flex rounded border border-[#D0D0CB] overflow-hidden bg-[#EAEAE7]">
          <button
            type="button"
            onClick={() => handleModeToggle('gimbal')}
            className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase transition-all ${
              mode === 'gimbal' ? 'bg-[#FF5500] text-black shadow-sm' : 'text-[#666662] hover:text-[#111111]'
            }`}
          >
            3D GIMBAL
          </button>
          <button
            type="button"
            onClick={() => handleModeToggle('gearbox')}
            className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase transition-all ${
              mode === 'gearbox' ? 'bg-[#FF5500] text-black shadow-sm' : 'text-[#666662] hover:text-[#111111]'
            }`}
          >
            GEARBOX
          </button>
        </div>
      </div>

      {/* Canvas 3D Projection Stage */}
      <div className="relative h-[190px] w-full rounded-lg bg-[#EAEAE7] border border-[#D0D0CB] overflow-hidden cursor-grab active:cursor-grabbing shadow-inner flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute top-2 left-2 pointer-events-none">
          <span className="font-mono text-[9px] text-[#666662] bg-[#DFDFDC]/90 px-1.5 py-0.5 rounded border border-[#D0D0CB]">
            {mode === 'gimbal' ? 'AXIS: X/Y/Z ORTHO' : 'RATIO: 4.2 : 1'}
          </span>
        </div>
        <div className="absolute top-2 right-2 pointer-events-none">
          <span className="font-mono text-[9px] text-[#666662] bg-[#DFDFDC]/90 px-1.5 py-0.5 rounded border border-[#D0D0CB]">
            DRAG TO TILT
          </span>
        </div>
      </div>

      {/* Telemetry LED Readout Windows */}
      <div className="grid grid-cols-4 gap-1.5 mt-3">
        <div className="bg-[#121315] p-1.5 rounded border border-black/40 shadow-inner text-center">
          <div className="font-mono text-[8px] text-[#888884] uppercase">PITCH</div>
          <div className="font-mono text-[11px] font-bold text-[#FF453A] tracking-tight">{telemetry.pitch}°</div>
        </div>
        <div className="bg-[#121315] p-1.5 rounded border border-black/40 shadow-inner text-center">
          <div className="font-mono text-[8px] text-[#888884] uppercase">ROLL</div>
          <div className="font-mono text-[11px] font-bold text-[#30D158] tracking-tight">{telemetry.roll}°</div>
        </div>
        <div className="bg-[#121315] p-1.5 rounded border border-black/40 shadow-inner text-center">
          <div className="font-mono text-[8px] text-[#888884] uppercase">YAW</div>
          <div className="font-mono text-[11px] font-bold text-[#FF9F0A] tracking-tight">{telemetry.yaw}°</div>
        </div>
        <div className="bg-[#121315] p-1.5 rounded border border-black/40 shadow-inner text-center">
          <div className="font-mono text-[8px] text-[#888884] uppercase">RPM</div>
          <div className="font-mono text-[11px] font-bold text-white tracking-tight">{telemetry.rpm}</div>
        </div>
      </div>
    </div>
  );
};

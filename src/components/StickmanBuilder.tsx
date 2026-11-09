import React, { useEffect, useRef, useState } from 'react';
import { CornerCrosshairs } from './CornerCrosshairs';
import { audioEngine } from '../utils/audio';

type BuildPhase = 'welding' | 'bolting' | 'coding' | 'online';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface DebrisItem {
  type: 'nut' | 'bolt' | 'washer';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  bounces: number;
}

interface CodeParticle {
  x: number;
  y: number;
  vy: number;
  text: string;
  alpha: number;
}

export const StickmanBuilder: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<BuildPhase>('welding');
  const [boltCount, setBoltCount] = useState(0);

  const stateRef = useRef({
    phase: 'welding' as BuildPhase,
    phaseTimer: 0,
    sparks: [] as Spark[],
    debris: [] as DebrisItem[],
    codeStream: [] as CodeParticle[],
    stickmanArmAngle: 0,
    wrenchAngle: 0,
    typingFrame: 0,
    robotEyeBlink: 0,
    robotAntennaWiggle: 0,
    isHovering: false,
    mousePos: { x: 0, y: 0 },
  });

  const PHASES: { id: BuildPhase; label: string; icon: string }[] = [
    { id: 'welding', label: 'WELD', icon: '⚡' },
    { id: 'bolting', label: 'BOLT', icon: '🔧' },
    { id: 'coding', label: 'CODE', icon: '💻' },
    { id: 'online', label: 'BOOT', icon: '🤖' },
  ];

  const switchPhase = (newPhase: BuildPhase) => {
    audioEngine.playRelayClick();
    setPhase(newPhase);
    stateRef.current.phase = newPhase;
    stateRef.current.phaseTimer = 0;

    if (newPhase === 'welding') {
      audioEngine.playMechanicalClick();
    } else if (newPhase === 'bolting') {
      dropNutOrBolt(140, 60);
      dropNutOrBolt(160, 40);
    } else if (newPhase === 'online') {
      audioEngine.playInterlockReset();
    }
  };

  useEffect(() => {
    const handleRemotePhase = (e: Event) => {
      const custom = e as CustomEvent<BuildPhase>;
      if (custom.detail) {
        switchPhase(custom.detail);
      }
    };
    window.addEventListener('portfolio-set-builder-phase', handleRemotePhase);
    return () => window.removeEventListener('portfolio-set-builder-phase', handleRemotePhase);
  }, []);

  const dropNutOrBolt = (spawnX?: number, spawnY?: number) => {
    const s = stateRef.current;
    const types: ('nut' | 'bolt' | 'washer')[] = ['nut', 'bolt', 'washer'];
    const type = types[Math.floor(Math.random() * types.length)];
    s.debris.push({
      type,
      x: spawnX ?? 130 + (Math.random() * 40 - 20),
      y: spawnY ?? 50 + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2 - 4,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.25,
      bounces: 0,
    });
    setBoltCount((c) => c + 1);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    audioEngine.playMechanicalClick();
    dropNutOrBolt(clickX, clickY);

    // Also burst some sparks
    for (let i = 0; i < 8; i++) {
      stateRef.current.sparks.push({
        x: clickX,
        y: clickY,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1,
        maxLife: 20 + Math.random() * 15,
        color: Math.random() > 0.4 ? '#FF5500' : '#FFD60A',
        size: 1.5 + Math.random() * 1.5,
      });
    }
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

    // Initial nuts & bolts on workbench table
    stateRef.current.debris = [
      { type: 'nut', x: 230, y: 172, vx: 0, vy: 0, rot: 0.4, vRot: 0, bounces: 3 },
      { type: 'washer', x: 245, y: 174, vx: 0, vy: 0, rot: 0.1, vRot: 0, bounces: 3 },
      { type: 'bolt', x: 70, y: 173, vx: 0, vy: 0, rot: 1.2, vRot: 0, bounces: 3 },
    ];

    const codeSnippets = ['init_motors()', 'pwm=255', 'pid_loop()', '0x55_ACK', 'theta=45°', 'ik_solve()', 'imu_ok'];

    let lastTime = performance.now();

    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;

      const s = stateRef.current;
      s.phaseTimer += dt;

      // Auto cycle phase every 4.8 seconds if not hovering
      if (!s.isHovering && s.phaseTimer > 4.8) {
        s.phaseTimer = 0;
        const phaseSeq: BuildPhase[] = ['welding', 'bolting', 'coding', 'online'];
        const nextIdx = (phaseSeq.indexOf(s.phase) + 1) % phaseSeq.length;
        const nextPhase = phaseSeq[nextIdx];
        s.phase = nextPhase;
        setPhase(nextPhase);

        if (nextPhase === 'bolting') {
          dropNutOrBolt(130, 80);
          dropNutOrBolt(145, 70);
        } else if (nextPhase === 'online') {
          audioEngine.playInterlockReset();
        }
      }

      ctx.clearRect(0, 0, width, height);

      // --- Workbench Tabletop Baseline & Grid ---
      const tableY = 176;

      // Engineering millimeter hairline ticks along table edge
      ctx.strokeStyle = '#D5D5D0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, tableY);
      ctx.lineTo(width - 10, tableY);
      ctx.stroke();

      for (let x = 20; x < width - 20; x += 10) {
        const isMajor = (x - 20) % 50 === 0;
        ctx.beginPath();
        ctx.moveTo(x, tableY);
        ctx.lineTo(x, tableY + (isMajor ? 6 : 3));
        ctx.stroke();
      }

      // Positions
      // Stickman on Left, Robot in Middle/Right
      const manBaseX = Math.max(70, width * 0.28);
      const robotBaseX = Math.max(160, width * 0.65);

      // --- DRAW ROBOT BEING ASSEMBLED ---
      const rx = robotBaseX;
      const ry = tableY - 6;

      // Robot Knobby Wheels
      ctx.fillStyle = '#1A1A18';
      ctx.beginPath();
      ctx.arc(rx - 24, ry, 10, 0, Math.PI * 2);
      ctx.arc(rx + 24, ry, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(rx - 24, ry, 3.5, 0, Math.PI * 2);
      ctx.arc(rx + 24, ry, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Robot Chassis Plate
      ctx.fillStyle = '#E5E5E2';
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(rx - 32, ry - 38, 64, 32, 6);
      ctx.fill();
      ctx.stroke();

      // Corner rivets on chassis
      ctx.fillStyle = '#888884';
      [[-26, -32], [26, -32], [-26, -12], [26, -12]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(rx + dx, ry + dy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Robot Dome Head
      ctx.fillStyle = '#DFDFDC';
      ctx.beginPath();
      ctx.arc(rx, ry - 42, 18, Math.PI, 0, false);
      ctx.fill();
      ctx.stroke();

      // Robot Antenna with Blinking LED
      ctx.beginPath();
      ctx.moveTo(rx, ry - 60);
      const antennaWiggle = Math.sin(now * 0.008) * 3;
      ctx.lineTo(rx + antennaWiggle, ry - 74);
      ctx.stroke();

      ctx.fillStyle = s.phase === 'online' ? '#10B981' : Math.sin(now * 0.01) > 0 ? '#FF3B30' : '#888884';
      ctx.beginPath();
      ctx.arc(rx + antennaWiggle, ry - 76, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Robot Visor & Eyes
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.roundRect(rx - 12, ry - 54, 24, 10, 3);
      ctx.fill();

      const eyeColor = s.phase === 'online' ? '#30D158' : s.phase === 'coding' ? '#38BDF8' : '#FF9F0A';
      ctx.fillStyle = eyeColor;
      ctx.shadowBlur = s.phase === 'online' ? 8 : 2;
      ctx.shadowColor = eyeColor;
      // Left eye & right eye
      ctx.beginPath();
      ctx.arc(rx - 6, ry - 49, 2.5, 0, Math.PI * 2);
      ctx.arc(rx + 6, ry - 49, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Robot Mini Manipulator Claw
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(rx + 18, ry - 24);
      const armWave = s.phase === 'online' ? Math.sin(now * 0.012) * 8 : 0;
      ctx.lineTo(rx + 36, ry - 32 + armWave);
      ctx.lineTo(rx + 42, ry - 42 + armWave);
      ctx.stroke();
      // Gripper jaws
      ctx.beginPath();
      ctx.moveTo(rx + 38, ry - 46 + armWave);
      ctx.lineTo(rx + 45, ry - 40 + armWave);
      ctx.lineTo(rx + 46, ry - 46 + armWave);
      ctx.stroke();

      // --- DRAW STICKMAN WITH ORANGE SAFETY HELMET ---
      const sx = manBaseX;
      const sy = tableY;

      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.phase === 'welding') {
        // --- 1. WELDING / SOLDERING POSE ---
        // Stickman leans forward toward the robot
        const headX = sx + 24;
        const headY = sy - 66;

        // Legs (standing slightly bent forward)
        ctx.beginPath();
        ctx.moveTo(sx - 14, sy);
        ctx.lineTo(sx - 4, sy - 28);
        ctx.lineTo(sx + 4, sy - 48); // Pelvis
        ctx.lineTo(sx + 14, sy - 26);
        ctx.lineTo(sx + 18, sy);
        ctx.stroke();

        // Spine (leaning)
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy - 48);
        ctx.lineTo(headX - 6, headY + 12);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(headX, headY, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // Orange Safety Hard Hat with Visor
        ctx.fillStyle = '#FF5500';
        ctx.beginPath();
        ctx.arc(headX, headY - 2, 10.5, Math.PI, 0, false);
        ctx.fill();
        // Hat brim / visor
        ctx.strokeStyle = '#CC4400';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(headX - 11, headY - 2);
        ctx.lineTo(headX + 13, headY - 3);
        ctx.stroke();
        ctx.lineWidth = 2.2;

        // Welding Arm reaching with soldering iron
        const weldTargetX = rx - 24;
        const weldTargetY = ry - 28;

        ctx.strokeStyle = '#111111';
        ctx.beginPath();
        ctx.moveTo(headX - 6, headY + 14); // Shoulder
        const elbowX = headX + 18;
        const elbowY = headY + 28;
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(weldTargetX - 12, weldTargetY - 4);
        ctx.stroke();

        // Soldering Iron / Torch Tool
        ctx.strokeStyle = '#444440';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(weldTargetX - 14, weldTargetY - 6);
        ctx.lineTo(weldTargetX, weldTargetY);
        ctx.stroke();
        ctx.lineWidth = 2.2;

        // Torch glow tip
        ctx.fillStyle = '#FFD60A';
        ctx.beginPath();
        ctx.arc(weldTargetX, weldTargetY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Spawn dynamic welding spark particles!
        if (Math.random() > 0.3) {
          s.sparks.push({
            x: weldTargetX,
            y: weldTargetY,
            vx: (Math.random() - 0.7) * 4.5,
            vy: (Math.random() - 0.7) * 5 - 1.5,
            life: 1,
            maxLife: 15 + Math.random() * 12,
            color: Math.random() > 0.5 ? '#FF5500' : '#FFD60A',
            size: 1.2 + Math.random() * 1.6,
          });
        }

        // Radial Welding Flash Glow
        const flashGradient = ctx.createRadialGradient(
          weldTargetX,
          weldTargetY,
          2,
          weldTargetX,
          weldTargetY,
          36
        );
        flashGradient.addColorStop(0, 'rgba(255, 214, 10, 0.45)');
        flashGradient.addColorStop(0.5, 'rgba(255, 85, 0, 0.2)');
        flashGradient.addColorStop(1, 'rgba(255, 85, 0, 0)');
        ctx.fillStyle = flashGradient;
        ctx.beginPath();
        ctx.arc(weldTargetX, weldTargetY, 36, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.phase === 'bolting') {
        // --- 2. BOLTING & TIGHTENING POSE ---
        const headX = sx + 14;
        const headY = sy - 68;

        // Legs
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy);
        ctx.lineTo(sx - 2, sy - 28);
        ctx.lineTo(sx + 2, sy - 48);
        ctx.lineTo(sx + 8, sy - 26);
        ctx.lineTo(sx + 14, sy);
        ctx.stroke();

        // Spine
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy - 48);
        ctx.lineTo(headX - 2, headY + 12);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(headX, headY, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // Orange Safety Helmet
        ctx.fillStyle = '#FF5500';
        ctx.beginPath();
        ctx.arc(headX, headY - 2, 10.5, Math.PI, 0, false);
        ctx.fill();
        ctx.strokeStyle = '#CC4400';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(headX - 10, headY - 2);
        ctx.lineTo(headX + 12, headY - 2);
        ctx.stroke();
        ctx.lineWidth = 2.2;

        // Arm with ratchet wrench turning
        const boltX = rx - 18;
        const boltY = ry - 34;

        s.wrenchAngle = Math.sin(now * 0.008) * 0.7;

        ctx.strokeStyle = '#111111';
        ctx.beginPath();
        ctx.moveTo(headX - 2, headY + 14);
        const elbowX = headX + 16;
        const elbowY = headY + 22;
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(boltX - Math.cos(s.wrenchAngle) * 14, boltY - Math.sin(s.wrenchAngle) * 14);
        ctx.stroke();

        // Wrench Graphic
        ctx.save();
        ctx.translate(boltX, boltY);
        ctx.rotate(s.wrenchAngle);
        ctx.strokeStyle = '#444440';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-20, -8);
        ctx.stroke();
        // Wrench head
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();

        // Occasionally drop a nut or bolt during wrenching
        if (Math.random() < 0.02) {
          dropNutOrBolt(boltX - 10, boltY - 10);
        }
      } else if (s.phase === 'coding') {
        // --- 3. CODING / TERMINAL DEBUGGING POSE ---
        const headX = sx - 6;
        const headY = sy - 64;

        // Stool / Bench Chair
        ctx.strokeStyle = '#888884';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx - 20, sy);
        ctx.lineTo(sx - 12, sy - 26);
        ctx.lineTo(sx - 4, sy);
        ctx.moveTo(sx - 18, sy - 26);
        ctx.lineTo(sx - 2, sy - 26);
        ctx.stroke();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#111111';

        // Sitting Legs
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy - 26); // Hip
        ctx.lineTo(sx + 10, sy - 26); // Knee
        ctx.lineTo(sx + 10, sy); // Foot
        ctx.stroke();

        // Spine
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy - 26);
        ctx.lineTo(headX, headY + 12);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(headX, headY, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // Orange Helmet (tilted as engineer concentrates)
        ctx.fillStyle = '#FF5500';
        ctx.beginPath();
        ctx.arc(headX, headY - 2, 10.5, Math.PI * 0.9, Math.PI * 1.9, false);
        ctx.fill();
        ctx.strokeStyle = '#CC4400';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(headX - 10, headY - 1);
        ctx.lineTo(headX + 11, headY - 3);
        ctx.stroke();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#111111';

        // Miniature Laptop on Stand
        const lapX = sx + 22;
        const lapY = sy - 36;

        // Laptop base & screen
        ctx.fillStyle = '#222220';
        ctx.fillRect(lapX - 10, lapY, 20, 2.5);
        ctx.beginPath();
        ctx.moveTo(lapX + 8, lapY);
        ctx.lineTo(lapX + 12, lapY - 16);
        ctx.stroke();
        // Screen glow
        ctx.fillStyle = '#30D158';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#30D158';
        ctx.fillRect(lapX + 9, lapY - 15, 2, 14);
        ctx.shadowBlur = 0;

        // Typing Hands (fluttering)
        const typeOffset = Math.sin(now * 0.02) * 2;
        ctx.beginPath();
        ctx.moveTo(headX + 2, headY + 14); // Shoulder
        ctx.lineTo(lapX - 2, lapY - 2 + typeOffset);
        ctx.stroke();

        // Floating Code Characters
        if (Math.random() < 0.08) {
          s.codeStream.push({
            x: lapX + 8 + Math.random() * 8,
            y: lapY - 18,
            vy: -0.6 - Math.random() * 0.6,
            text: codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
            alpha: 1,
          });
        }
      } else {
        // --- 4. CELEBRATING / ONLINE POSE ---
        const headX = sx + 8;
        const headY = sy - 72;

        // Excited jumping legs
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy - 8);
        ctx.lineTo(sx - 2, sy - 34);
        ctx.lineTo(sx + 6, sy - 48);
        ctx.lineTo(sx + 14, sy - 34);
        ctx.lineTo(sx + 18, sy - 8);
        ctx.stroke();

        // Spine
        ctx.beginPath();
        ctx.moveTo(sx + 6, sy - 48);
        ctx.lineTo(headX, headY + 12);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(headX, headY, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // Orange Helmet
        ctx.fillStyle = '#FF5500';
        ctx.beginPath();
        ctx.arc(headX, headY - 2, 10.5, Math.PI, 0, false);
        ctx.fill();
        ctx.strokeStyle = '#CC4400';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(headX - 10, headY - 2);
        ctx.lineTo(headX + 12, headY - 2);
        ctx.stroke();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#111111';

        // Cheering Arms in the air! (\o/)
        const armCheer = Math.sin(now * 0.01) * 3;
        ctx.beginPath();
        ctx.moveTo(headX - 4, headY + 14);
        ctx.lineTo(headX - 18, headY - 2 + armCheer);
        ctx.lineTo(headX - 24, headY - 20 + armCheer);
        ctx.moveTo(headX + 4, headY + 14);
        ctx.lineTo(headX + 18, headY - 2 + armCheer);
        ctx.lineTo(headX + 26, headY - 20 + armCheer);
        ctx.stroke();

        // Speech Bubble: "ONLINE! ⚡"
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.roundRect(headX - 32, headY - 48, 64, 18, 5);
        ctx.fill();
        ctx.fillStyle = '#30D158';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('ONLINE! 🤖', headX - 24, headY - 36);
      }

      // --- RENDER & SIMULATE SPARKS ---
      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const p = s.sparks[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.life++;

        if (p.life >= p.maxLife || p.y > tableY) {
          s.sparks.splice(i, 1);
          continue;
        }

        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // --- RENDER & SIMULATE DROPPED NUTS, BOLTS, WASHERS ---
      for (let i = s.debris.length - 1; i >= 0; i--) {
        const d = s.debris[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.38; // gravity
        d.rot += d.vRot;

        // Bounce on tabletop
        if (d.y >= tableY - 2) {
          d.y = tableY - 2;
          d.vy = -d.vy * 0.45;
          d.vx *= 0.75;
          d.vRot *= 0.65;
          d.bounces++;
          if (d.bounces > 4) {
            d.vy = 0;
            d.vx = 0;
            d.vRot = 0;
          }
        }

        // Draw Debris Graphic
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);

        ctx.fillStyle = '#888884';
        ctx.strokeStyle = '#1A1A18';
        ctx.lineWidth = 1;

        if (d.type === 'nut') {
          // Hex Nut
          ctx.beginPath();
          for (let h = 0; h < 6; h++) {
            const a = (h / 6) * Math.PI * 2;
            const hx = Math.cos(a) * 4.5;
            const hy = Math.sin(a) * 4.5;
            if (h === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Center hole
          ctx.fillStyle = '#ECECEB';
          ctx.beginPath();
          ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (d.type === 'washer') {
          // Washer
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ECECEB';
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Bolt
          ctx.fillRect(-1.5, -6, 3, 10);
          ctx.strokeRect(-1.5, -6, 3, 10);
          ctx.fillRect(-4, -8, 8, 3);
          ctx.strokeRect(-4, -8, 8, 3);
        }

        ctx.restore();
      }

      // Keep debris count reasonable
      if (s.debris.length > 18) {
        s.debris.shift();
      }

      // --- RENDER FLOATING CODE PARTICLES ---
      for (let i = s.codeStream.length - 1; i >= 0; i--) {
        const c = s.codeStream[i];
        c.y += c.vy;
        c.alpha -= 0.015;

        if (c.alpha <= 0) {
          s.codeStream.splice(i, 1);
          continue;
        }

        ctx.fillStyle = '#30D158';
        ctx.globalAlpha = c.alpha;
        ctx.font = 'bold 8.5px monospace';
        ctx.fillText(c.text, c.x, c.y);
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => (stateRef.current.isHovering = true)}
      onMouseLeave={() => (stateRef.current.isHovering = false)}
      className="relative rounded-xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.03),0_8px_20px_-8px_rgba(0,0,0,0.06)] p-3.5 select-none group transition-all"
    >
      <CornerCrosshairs type="screw" />

      {/* Header Strip: Authentic Teenage Engineering Lab Badge */}
      <div className="relative z-10 flex items-center justify-between pb-2 mb-2 border-b border-[#D5D5D0]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#FF5500] animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold text-[#111111] uppercase tracking-wider">
            ROBOT LAB · MK-01
          </span>
          <span className="text-[9px] font-mono text-[#777772] hidden sm:inline bg-[#E6E6E3] px-1.5 py-0.5 rounded border border-[#D0D0CB]">
            {phase.toUpperCase()}
          </span>
        </div>

        {/* Phase Selector Tactile Buttons */}
        <div className="flex rounded border border-[#D0D0CB] overflow-hidden bg-[#EAEAE7]">
          {PHASES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => switchPhase(p.id)}
              className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                phase === p.id ? 'bg-[#FF5500] text-black shadow-sm' : 'text-[#666662] hover:text-[#111111]'
              }`}
            >
              <span>{p.icon}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Animation Canvas */}
      <div className="relative h-[190px] w-full rounded-lg bg-[#EAEAE7] border border-[#D0D0CB] overflow-hidden cursor-pointer shadow-inner flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-crosshair"
          title="Click to toss bolts & trigger welding sparks!"
        />

        {/* Top Floating Helper Overlay */}
        <div className="absolute top-2 left-2 pointer-events-none">
          <span className="font-mono text-[9px] text-[#666662] bg-[#DFDFDC]/90 px-1.5 py-0.5 rounded border border-[#D0D0CB]">
            CLICK TO TOSS BOLTS ⚡
          </span>
        </div>
        <div className="absolute top-2 right-2 pointer-events-none">
          <span className="font-mono text-[9px] text-[#666662] bg-[#DFDFDC]/90 px-1.5 py-0.5 rounded border border-[#D0D0CB]">
            {boltCount > 0 ? `BOLTS DROPPED: ${boltCount}` : 'CYCLE: AUTO'}
          </span>
        </div>
      </div>

      {/* Bottom Micro-Telemetry Strip */}
      <div className="grid grid-cols-4 gap-1.5 mt-2.5">
        <div className="bg-[#121315] p-1 rounded border border-black/40 shadow-inner text-center">
          <div className="font-mono text-[8px] text-[#888884] uppercase">ENGINEER</div>
          <div className="font-mono text-[10px] font-bold text-[#FF5500] truncate">ORANGE CAP</div>
        </div>
        <div className="bg-[#121315] p-1 rounded border border-black/40 shadow-inner text-center">
          <div className="font-mono text-[8px] text-[#888884] uppercase">ACTIVITY</div>
          <div className="font-mono text-[10px] font-bold text-[#30D158] uppercase truncate">{phase}</div>
        </div>
        <div className="bg-[#121315] p-1 rounded border border-black/40 shadow-inner text-center">
          <div className="font-mono text-[8px] text-[#888884] uppercase">CORE TORCH</div>
          <div className="font-mono text-[10px] font-bold text-[#FFD60A] truncate">
            {phase === 'welding' ? '1,450°C' : 'OFF'}
          </div>
        </div>
        <div className="bg-[#121315] p-1 rounded border border-black/40 shadow-inner text-center">
          <div className="font-mono text-[8px] text-[#888884] uppercase">BOT STATE</div>
          <div className="font-mono text-[10px] font-bold text-white truncate">
            {phase === 'online' ? 'ACTIVE' : 'ASSEMBLING'}
          </div>
        </div>
      </div>
    </div>
  );
};

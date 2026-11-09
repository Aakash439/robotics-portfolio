import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PERSONAL_PROFILE } from '../data/projects';
import { TactileDial } from './TactileDial';
import { CornerCrosshairs } from './CornerCrosshairs';
import { StickmanBuilder } from './StickmanBuilder';
import { audioEngine } from '../utils/audio';
import { gsap } from '../utils/gsapAnimations';

const STUDIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type ArmControlMode = 'cursor' | 'pick-place' | 'orbit';

type AutoPhase =
  | 'select'
  | 'approach'
  | 'descend'
  | 'grip'
  | 'lift'
  | 'transit'
  | 'lower'
  | 'release'
  | 'retreat'
  | 'home';

interface StageObject {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  homeF: number;
}

const MODES: { id: ArmControlMode; label: string }[] = [
  { id: 'cursor', label: 'CAD Wireframe' },
  { id: 'orbit', label: 'Live Kinematics' },
  { id: 'pick-place', label: 'Pick & Place' },
];

export const HeroSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const heroContainerRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLDivElement | null>(null);
  const line1Ref = useRef<HTMLHeadingElement | null>(null);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const line2Ref = useRef<HTMLParagraphElement | null>(null);
  const line3Ref = useRef<HTMLParagraphElement | null>(null);
  const underlineRef = useRef<HTMLSpanElement | null>(null);
  const bioRef = useRef<HTMLParagraphElement | null>(null);
  const buttonsRef = useRef<HTMLDivElement | null>(null);

  const [armMode, setArmMode] = useState<ArmControlMode>('cursor');
  const [isClamped, setIsClamped] = useState(false);

  // GSAP Entrance Timeline: Staggered mechanical reveal
  useEffect(() => {
    if (!heroContainerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(eyebrowRef.current, {
        y: -18,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.5)',
      })
      .from(line1Ref.current, {
        y: 28,
        opacity: 0,
        duration: 0.55,
      }, '-=0.25')
      .from(badgeRef.current, {
        scale: 0.5,
        rotation: -6,
        opacity: 0,
        duration: 0.55,
        ease: 'back.out(2.2)',
      }, '-=0.35')
      .from(line2Ref.current, {
        y: 24,
        opacity: 0,
        duration: 0.55,
      }, '-=0.35')
      .from(line3Ref.current, {
        y: 24,
        opacity: 0,
        duration: 0.55,
      }, '-=0.35')
      .fromTo(
        underlineRef.current,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.2'
      )
      .from(bioRef.current, {
        y: 16,
        opacity: 0,
        duration: 0.5,
      }, '-=0.3')
      .from(buttonsRef.current ? Array.from(buttonsRef.current.children) : [], {
        y: 14,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: 'back.out(1.4)',
      }, '-=0.25');
    }, heroContainerRef);

    return () => ctx.revert();
  }, []);

  // GSAP Magnetic Physics on 'aakash.' badge
  useEffect(() => {
    const badge = badgeRef.current;
    if (!badge || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const xTo = gsap.quickTo(badge, 'x', { duration: 0.3, ease: 'power2.out' });
    const yTo = gsap.quickTo(badge, 'y', { duration: 0.3, ease: 'power2.out' });
    const rTo = gsap.quickTo(badge, 'rotation', { duration: 0.3, ease: 'power2.out' });

    const onMove = (e: MouseEvent) => {
      const rect = badge.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.4;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.4;
      xTo(Math.max(-16, Math.min(16, dx)));
      yTo(Math.max(-16, Math.min(16, dy)));
      rTo(Math.max(-8, Math.min(8, dx * 0.3)));
    };

    const onLeave = () => {
      gsap.to(badge, {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.7,
        ease: 'elastic.out(1.2, 0.4)',
        overwrite: 'auto',
      });
    };

    badge.addEventListener('mousemove', onMove);
    badge.addEventListener('mouseleave', onLeave);

    return () => {
      badge.removeEventListener('mousemove', onMove);
      badge.removeEventListener('mouseleave', onLeave);
      gsap.killTweensOf(badge);
    };
  }, []);

  const handleBadgeClick = () => {
    audioEngine.playMechanicalClick();
    if (badgeRef.current) {
      gsap.fromTo(
        badgeRef.current,
        { scale: 0.88, rotation: -3 },
        { scale: 1, rotation: 0, duration: 0.5, ease: 'elastic.out(1.4, 0.3)' }
      );
    }
  };

  const stateRef = useRef({
    normX: 0.64,
    normY: 0.4,
    isHovering: false,
    smoothX: 0.64,
    smoothY: 0.4,
    velX: 0,
    velY: 0,
    smoothJaw: 0.3,
    mode: 'cursor' as ArmControlMode,
    clamped: false,
    prevGrip: false,
    gripArmedUntil: 0,
    heldIndex: -1,
    heldOffX: 0,
    heldOffY: 0,
    lastWristAngle: -0.15,
    lastGripX: 0,
    lastGripY: 0,
    objects: [] as StageObject[],
    layoutKey: '',
    auto: {
      phase: 'select' as AutoPhase,
      phaseStart: 0,
      index: -1,
      pickX: 0,
      pickY: 0,
      destX: 0,
      destY: 0,
    },
    trail: [] as { x: number; y: number }[],
  });

  useEffect(() => {
    const s = stateRef.current;
    s.mode = armMode;
    s.auto.phase = 'select';
  }, [armMode]);

  useEffect(() => {
    stateRef.current.clamped = isClamped;
  }, [isClamped]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId = 0;
    let running = false;
    let isOnScreen = true;
    let width = 0;
    let height = 0;

    const geo = () => {
      const minDim = Math.min(width, height);
      const scale = Math.max(0.68, Math.min(1, width / 560));
      const baseX = width * 0.33;
      const baseY = height * 0.81;
      const L1 = minDim * 0.33;
      const L2 = minDim * 0.27;
      const L3 = minDim * 0.135;
      const gripDist = 32 * scale;
      const reach = Math.min(L1 + L2 + L3, width * 0.86 - baseX);
      const objW = 38 * scale;
      const objH = 28 * scale;
      return { minDim, scale, baseX, baseY, L1, L2, L3, gripDist, reach, objW, objH };
    };

    const zoneOf = () => {
      const g = geo();
      const cx = g.baseX + g.reach * 0.44;
      const w = g.objW * 1.9;
      return { cx, x0: cx - w / 2, x1: cx + w / 2, w };
    };

    const layoutObjects = () => {
      const g = geo();
      const key = `${Math.round(width)}x${Math.round(height)}`;
      const s = stateRef.current;
      if (s.layoutKey === key) return;
      s.layoutKey = key;
      const homeFs = [0.82, 0.95, 0.68, 0.55];
      s.heldIndex = -1;
      s.auto.phase = 'select';
      s.objects = ['SMD-0805', 'QFN-32', 'LM2596'].map((label, i) => ({
        label,
        x: g.baseX + g.reach * homeFs[i],
        y: g.baseY - g.objH / 2,
        w: g.objW,
        h: g.objH,
        vy: 0,
        homeF: homeFs[i],
      }));
    };

    const resizeCanvas = () => {
      const rect = stage.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layoutObjects();
    };

    const inZone = (o: StageObject) => {
      const z = zoneOf();
      return o.x > z.x0 && o.x < z.x1;
    };

    const startTime = performance.now();

    const render = (now: number) => {
      if (!running) return;
      const t = (now - startTime) * 0.001;
      const s = stateRef.current;
      const g = geo();
      const { scale, baseX, baseY, L1, L2, L3, gripDist } = g;

      let targetNormX = s.smoothX;
      let targetNormY = s.smoothY;
      let gripCommand = s.clamped;

      const toTargetNorm = (gx: number, gy: number) => {
        const tx = gx - Math.cos(s.lastWristAngle) * gripDist;
        const ty = gy - Math.sin(s.lastWristAngle) * gripDist;
        targetNormX = tx / width;
        targetNormY = ty / height;
      };

      // ---------------- Interactive Pick & Place Routine ----------------
      if (s.mode === 'pick-place') {
        const a = s.auto;
        const elapsed = t - a.phaseStart;
        const go = (phase: AutoPhase) => {
          a.phase = phase;
          a.phaseStart = t;
        };
        const lift = 60 * scale;
        const atGoal = (gx: number, gy: number) =>
          Math.hypot(s.lastGripX - gx, s.lastGripY - gy) < 6 * scale;

        gripCommand =
          a.phase === 'grip' ||
          a.phase === 'lift' ||
          a.phase === 'transit' ||
          a.phase === 'lower';

        // Synchronize React state status pill
        if (gripCommand !== isClamped) {
          setIsClamped(gripCommand);
        }

        if (a.phase === 'select') {
          gripCommand = false;
          // Find component to pick
          let idx = s.objects.findIndex((o) => !inZone(o));
          if (idx < 0) {
            // Reset to pick again
            idx = 0;
            s.objects[0].x = baseX + g.reach * 0.82;
            s.objects[0].y = baseY - s.objects[0].h / 2;
          }
          const o = s.objects[idx];
          a.index = idx;
          a.pickX = o.x;
          a.pickY = o.y;
          a.destX = zoneOf().cx;
          a.destY = baseY - o.h / 2;
          go('approach');
          toTargetNorm(s.lastGripX, s.lastGripY);
        } else if (a.phase === 'approach') {
          toTargetNorm(a.pickX, a.pickY - lift);
          if (atGoal(a.pickX, a.pickY - lift) || elapsed > 1.4) go('descend');
        } else if (a.phase === 'descend') {
          toTargetNorm(a.pickX, a.pickY);
          if (atGoal(a.pickX, a.pickY) || elapsed > 1.2) {
            audioEngine.playRelayClick();
            go('grip');
          }
        } else if (a.phase === 'grip') {
          toTargetNorm(a.pickX, a.pickY);
          if (elapsed > 0.4) go('lift');
        } else if (a.phase === 'lift') {
          toTargetNorm(a.pickX, a.pickY - lift);
          if (atGoal(a.pickX, a.pickY - lift) || elapsed > 1.2) go('transit');
        } else if (a.phase === 'transit') {
          toTargetNorm(a.destX, a.destY - lift);
          if (atGoal(a.destX, a.destY - lift) || elapsed > 1.6) go('lower');
        } else if (a.phase === 'lower') {
          toTargetNorm(a.destX, a.destY);
          if (atGoal(a.destX, a.destY) || elapsed > 1.2) {
            audioEngine.playMechanicalClick();
            go('release');
          }
        } else if (a.phase === 'release') {
          toTargetNorm(a.destX, a.destY);
          if (elapsed > 0.4) go('retreat');
        } else if (a.phase === 'retreat') {
          toTargetNorm(a.destX, a.destY - lift);
          if (atGoal(a.destX, a.destY - lift) || elapsed > 1.1) go('home');
        } else if (a.phase === 'home') {
          const homeX = baseX + g.reach * 0.62;
          const homeY = baseY - 120 * scale;
          toTargetNorm(homeX, homeY);
          if (elapsed > 2.0) go('select');
        }
      } else if (s.mode === 'orbit') {
        targetNormX = 0.63 + Math.cos(t * 1.9) * 0.14;
        targetNormY = 0.43 + Math.sin(t * 1.9) * 0.16;
      } else if (s.isHovering) {
        targetNormX = s.normX;
        targetNormY = s.normY;
      } else if (!reduceMotion && s.heldIndex < 0) {
        targetNormX = 0.62 + Math.cos(t * 0.8) * 0.16;
        targetNormY = 0.36 + Math.sin(t * 1.35) * 0.13;
      }

      const stiffness = s.mode === 'pick-place' ? 0.08 : 0.088;
      const damping = 0.82;
      s.velX = (s.velX + (targetNormX - s.smoothX) * stiffness) * damping;
      s.velY = (s.velY + (targetNormY - s.smoothY) * stiffness) * damping;
      s.smoothX += s.velX;
      s.smoothY += s.velY;

      const rawTargetX = Math.max(width * 0.2, Math.min(width * 0.9, s.smoothX * width));
      const rawTargetY = Math.max(height * 0.14, Math.min(baseY - 4 * scale, s.smoothY * height));

      const wristAngle = Math.atan2(rawTargetY - baseY, rawTargetX - baseX) * 0.42 - 0.15;
      const wristX = rawTargetX - Math.cos(wristAngle) * L3;
      const wristY = rawTargetY - Math.sin(wristAngle) * L3;

      const dx = wristX - baseX;
      const dy = wristY - baseY;
      const maxReach = L1 + L2 - 4;
      const dist = Math.min(Math.hypot(dx, dy), maxReach);

      const baseToWristAngle = Math.atan2(dy, dx);
      const cosElbow = Math.max(
        -1,
        Math.min(1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * Math.max(dist, 1)))
      );
      const theta1 = baseToWristAngle - Math.acos(cosElbow);

      const elbowX = baseX + Math.cos(theta1) * L1;
      const elbowY = baseY + Math.sin(theta1) * L1;

      const theta2 = Math.atan2(wristY - elbowY, wristX - elbowX);
      const wristJointX = elbowX + Math.cos(theta2) * L2;
      const wristJointY = elbowY + Math.sin(theta2) * L2;

      const eeX = wristJointX + Math.cos(wristAngle) * L3;
      const eeY = wristJointY + Math.sin(wristAngle) * L3;

      const gripX = eeX + Math.cos(wristAngle) * gripDist;
      const gripY = eeY + Math.sin(wristAngle) * gripDist;
      s.lastWristAngle = wristAngle;
      s.lastGripX = gripX;
      s.lastGripY = gripY;

      const findGrippable = () => {
        let best = -1;
        let bestD = Infinity;
        s.objects.forEach((o, i) => {
          const pad = 12 * scale;
          if (Math.abs(gripX - o.x) < o.w / 2 + pad && Math.abs(gripY - o.y) < o.h / 2 + pad) {
            const d = Math.hypot(gripX - o.x, gripY - o.y);
            if (d < bestD) {
              bestD = d;
              best = i;
            }
          }
        });
        return best;
      };

      if (gripCommand && !s.prevGrip) s.gripArmedUntil = t + 0.8;
      if (gripCommand && s.heldIndex < 0 && t < s.gripArmedUntil) {
        const idx = findGrippable();
        if (idx >= 0) {
          s.heldIndex = idx;
          s.heldOffX = s.objects[idx].x - gripX;
          s.heldOffY = s.objects[idx].y - gripY;
        }
      } else if (!gripCommand && s.prevGrip && s.heldIndex >= 0) {
        s.objects[s.heldIndex].vy = 0;
        s.heldIndex = -1;
      }
      s.prevGrip = gripCommand;
      const hoverIndex = s.heldIndex < 0 ? findGrippable() : -1;

      s.objects.forEach((o, i) => {
        if (i === s.heldIndex) {
          s.heldOffX *= 0.85;
          s.heldOffY *= 0.85;
          o.x = gripX + s.heldOffX;
          o.y = Math.min(gripY + s.heldOffY, baseY - o.h / 2);
        } else {
          o.y = baseY - o.h / 2;
        }
      });

      const holding = s.heldIndex >= 0;

      s.trail.push({ x: eeX, y: eeY });
      if (s.trail.length > 36) s.trail.shift();

      // ---------------- Clear & Draw on Technical Drafting Plate ----------------
      ctx.clearRect(0, 0, width, height);

      // Light drafting plate grid background
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      const step = 20 * scale;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Reach envelope arcs
      [0.24, 0.42, 0.6].forEach((rFactor, idx) => {
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.12 - idx * 0.03})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(baseX, baseY, width * rFactor, -Math.PI * 0.92, -Math.PI * 0.06);
        ctx.stroke();
      });

      // Target Tray Bay (PCB Target Socket)
      const zone = zoneOf();
      ctx.save();
      ctx.fillStyle = '#E2E2DF';
      ctx.strokeStyle = '#30D158';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(zone.x0, baseY - 12 * scale, zone.w, 16 * scale, 3 * scale);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#059669';
      ctx.font = `700 ${Math.round(9 * Math.max(scale, 0.9))}px "Geist Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('Target PCB Tray', zone.cx, baseY + 18 * scale);
      ctx.textAlign = 'left';

      // Motion Trail
      if (s.trail.length > 2) {
        ctx.beginPath();
        s.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        const trailGrad = ctx.createLinearGradient(s.trail[0].x, s.trail[0].y, eeX, eeY);
        trailGrad.addColorStop(0, 'rgba(255, 85, 0, 0)');
        trailGrad.addColorStop(1, holding ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255, 85, 0, 0.95)');
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // SMD Electronic Components
      s.objects.forEach((o, i) => {
        const isHeld = i === s.heldIndex;
        const isHover = i === hoverIndex;
        const x0 = o.x - o.w / 2;
        const y0 = o.y - o.h / 2;

        // Silver solder pads / leads
        ctx.strokeStyle = '#888884';
        ctx.lineWidth = 1.2;
        const pins = 4;
        for (let p = 0; p < pins; p++) {
          const px = x0 + (o.w / (pins + 1)) * (p + 1);
          ctx.beginPath();
          ctx.moveTo(px, y0);
          ctx.lineTo(px, y0 - 3 * scale);
          ctx.moveTo(px, y0 + o.h);
          ctx.lineTo(px, y0 + o.h + 2 * scale);
          ctx.stroke();
        }

        // Chip body
        ctx.save();
        ctx.shadowColor = isHeld ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = isHeld ? 12 : 5;
        ctx.fillStyle = '#18181B';
        ctx.beginPath();
        ctx.roundRect(x0, y0, o.w, o.h, 4 * scale);
        ctx.fill();
        ctx.restore();

        // Edge stroke
        ctx.strokeStyle = isHeld ? '#10B981' : isHover ? '#FF5500' : '#3F3F46';
        ctx.lineWidth = isHeld || isHover ? 1.8 : 1.2;
        ctx.beginPath();
        ctx.roundRect(x0, y0, o.w, o.h, 4 * scale);
        ctx.stroke();

        // Pin 1 dot
        ctx.fillStyle = '#FF5500';
        ctx.beginPath();
        ctx.arc(x0 + 5 * scale, y0 + 5 * scale, 1.4 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Chip Label
        ctx.fillStyle = isHeld ? '#34D399' : '#FFFFFF';
        ctx.font = `700 ${Math.round(8.5 * Math.max(scale, 0.85))}px "Geist Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(o.label, o.x, o.y + 3.5 * scale);
        ctx.textAlign = 'left';
      });

      // Machined dark anodized arm links
      const drawLink = (x1: number, y1: number, x2: number, y2: number, w1: number, w2: number) => {
        const perp = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
        const c = Math.cos(perp);
        const sn = Math.sin(perp);
        const p1x = x1 + c * (w1 / 2);
        const p1y = y1 + sn * (w1 / 2);
        const p2x = x1 - c * (w1 / 2);
        const p2y = y1 - sn * (w1 / 2);
        const p3x = x2 - c * (w2 / 2);
        const p3y = y2 - sn * (w2 / 2);
        const p4x = x2 + c * (w2 / 2);
        const p4y = y2 + sn * (w2 / 2);

        ctx.save();
        ctx.fillStyle = '#222225';
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);
        ctx.lineTo(p4x, p4y);
        ctx.closePath();
        ctx.fill();

        // Top specular hairline
        ctx.strokeStyle = '#444448';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      };

      drawLink(baseX, baseY, elbowX, elbowY, 26 * scale, 20 * scale);
      drawLink(elbowX, elbowY, wristJointX, wristJointY, 20 * scale, 16 * scale);
      drawLink(wristJointX, wristJointY, eeX, eeY, 15 * scale, 12 * scale);

      // Dieter Rams Joint Pivots
      const drawPivot = (px: number, py: number, radius: number, angleText?: string) => {
        ctx.save();
        ctx.fillStyle = '#DFDFDC';
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = '#FF5500';
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        if (angleText) {
          ctx.fillStyle = '#111111';
          ctx.font = `600 ${Math.round(10 * Math.max(scale, 0.85))}px "Geist Mono", monospace`;
          ctx.fillText(angleText, px + radius + 4 * scale, py + 3 * scale);
        }
        ctx.restore();
      };

      drawPivot(baseX, baseY, 13 * scale, `θ1 ${Math.round((theta1 * 180) / Math.PI)}°`);
      drawPivot(elbowX, elbowY, 10 * scale, `θ2 ${Math.round(((theta2 - theta1) * 180) / Math.PI)}°`);
      drawPivot(wristJointX, wristJointY, 7 * scale, `θ3 ${Math.round((wristAngle * 180) / Math.PI)}°`);

      // End-Effector Gripper Jaws
      ctx.save();
      const jawTarget = gripCommand ? 0.95 : 0.15;
      s.smoothJaw += (jawTarget - s.smoothJaw) * 0.22;
      const jawOffset = (1 - s.smoothJaw) * 9 * scale;

      ctx.translate(eeX, eeY);
      ctx.rotate(wristAngle);

      ctx.fillStyle = '#1A1A18';
      ctx.strokeStyle = holding ? '#10B981' : '#111111';
      ctx.lineWidth = 1.4;

      // Left jaw
      ctx.beginPath();
      ctx.rect(4 * scale, -11 * scale - jawOffset, 16 * scale, 4 * scale);
      ctx.fill();
      ctx.stroke();

      // Right jaw
      ctx.beginPath();
      ctx.rect(4 * scale, 7 * scale + jawOffset, 16 * scale, 4 * scale);
      ctx.fill();
      ctx.stroke();

      // Gripper Laser Crosshair
      ctx.strokeStyle = holding ? '#10B981' : '#FF5500';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(gripDist - 6 * scale, 0);
      ctx.lineTo(gripDist + 6 * scale, 0);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      isOnScreen = !document.hidden;
      if (isOnScreen && !running) {
        running = true;
        animationFrameId = requestAnimationFrame(render);
      } else if (!isOnScreen) {
        running = false;
        cancelAnimationFrame(animationFrameId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    running = true;
    animationFrameId = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const setPointer = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const s = stateRef.current;
    s.normX = Math.max(0.1, Math.min(0.92, x));
    s.normY = Math.max(0.12, Math.min(0.9, y));
    s.isHovering = true;
  };

  const handleModeChange = (mode: ArmControlMode) => {
    audioEngine.playRelayClick();
    setArmMode(mode);
    if (mode !== 'pick-place') {
      setIsClamped(false);
    }
  };

  const toggleGrip = () => {
    audioEngine.playRelayClick();
    if (armMode === 'pick-place') {
      setArmMode('cursor');
      setIsClamped(false);
      return;
    }
    setIsClamped((prev) => !prev);
  };

  useEffect(() => {
    const handleRemoteGrip = () => {
      toggleGrip();
    };
    window.addEventListener('portfolio-toggle-gripper', handleRemoteGrip);
    return () => window.removeEventListener('portfolio-toggle-gripper', handleRemoteGrip);
  }, [armMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    const step = 0.03;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      if (armMode !== 'cursor') setArmMode('cursor');
      if (!s.isHovering) {
        s.normX = s.smoothX;
        s.normY = s.smoothY;
      }
      if (e.key === 'ArrowLeft') s.normX = Math.max(0.1, s.normX - step);
      if (e.key === 'ArrowRight') s.normX = Math.min(0.92, s.normX + step);
      if (e.key === 'ArrowUp') s.normY = Math.max(0.12, s.normY - step);
      if (e.key === 'ArrowDown') s.normY = Math.min(0.9, s.normY + step);
      s.isHovering = true;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleGrip();
    }
  };

  return (
    <section className="relative bg-[#ECECEB] pt-8 sm:pt-12 pb-14 sm:pb-20 border-b border-[#D5D5D0]">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        {/* Hero Top Grid: Headline on Left (7 cols), 3D Gimbal & Planetary Drive on Right (5 cols) */}
        <div
          ref={heroContainerRef}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"
        >
          {/* Left Column (7 cols): Editorial Typography Headline & Bio */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
            {/* Breadcrumb Eyebrow: Field Workbench · Pune, India */}
            <div
              ref={eyebrowRef}
              className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm text-[#4E6E58] mb-4 bg-[#DFDFDC]/70 px-3 py-1 rounded border border-[#D0D0CB] shadow-sm select-none self-start"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500] animate-pulse" />
              <span className="font-semibold text-[#111111]">Field Workbench</span>
              <span className="text-[#888884]">·</span>
              <span className="text-[#555550]">Pune, India</span>
            </div>

            <div className="flex flex-col select-none">
              {/* Line 1: Bold Sans + GSAP Magnetic Hardware Highlighter */}
              <h1
                ref={line1Ref}
                className="text-4xl md:text-6xl font-extrabold text-[#111111] tracking-tight font-sans select-none"
              >
                hey, i'm{' '}
                <span
                  ref={badgeRef}
                  onClick={handleBadgeClick}
                  className="bg-[#FF5500] text-black px-2 py-0.5 rounded-sm inline-block select-none cursor-pointer transform-gpu shadow-sm hover:shadow-md transition-shadow"
                  title="Aakash Sharma · Click for tactile pulse"
                >
                  aakash.
                </span>
              </h1>

              {/* Line 2: Flowing Editorial Italic Serif */}
              <p
                ref={line2Ref}
                className="font-serif italic font-normal text-4xl md:text-6xl text-[#222222] my-2 select-none"
              >
                building autonomous machines
              </p>

              {/* Line 3: Bold Sans + Kinetic Animated Underline */}
              <div ref={line3Ref} className="relative inline-block select-none self-start">
                <p className="text-4xl md:text-6xl font-extrabold text-[#111111] tracking-tight font-sans select-none pb-1">
                  with real-time control.
                </p>
                <span
                  ref={underlineRef}
                  className="absolute left-0 bottom-0 w-full h-[3.5px] bg-[#111111] rounded-full block origin-left"
                />
              </div>
            </div>

            {/* Polished Subtitle Bio */}
            <p
              ref={bioRef}
              className="mt-6 text-base sm:text-lg text-[#555550] font-mono leading-relaxed max-w-[62ch] select-none"
            >
              {PERSONAL_PROFILE.heroSubheadline}
            </p>

            {/* Tactical Action Bar: Quick Anchors */}
            <div ref={buttonsRef} className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                onClick={() => audioEngine.playRelayClick()}
                className="btn-rocker-white inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider text-[#111111] hover:text-[#FF5500] transition-colors shadow-sm select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#4E6E58] shrink-0" />
                <span>SCHEMATICS &darr;</span>
              </a>
            </div>
          </div>

          {/* Right Column (5 cols): Stickman Robot Builder Animation */}
          <div className="lg:col-span-5 xl:col-span-4 w-full">
            <StickmanBuilder />
          </div>
        </div>

        {/* The Teenage Engineering Drafting Plate (Interactive Manipulator Stage) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: STUDIO_EASE }}
          className="mt-8 sm:mt-10"
        >
          <div
            ref={stageRef}
            role="application"
            tabIndex={0}
            aria-label="Interactive robotic arm. Move pointer or use arrow keys to guide gripper; click or press Space to grip and release components."
            onMouseMove={(e) => setPointer(e.clientX, e.clientY)}
            onMouseLeave={() => (stateRef.current.isHovering = false)}
            onTouchStart={(e) =>
              e.touches[0] && setPointer(e.touches[0].clientX, e.touches[0].clientY)
            }
            onTouchMove={(e) =>
              e.touches[0] && setPointer(e.touches[0].clientX, e.touches[0].clientY)
            }
            onClick={toggleGrip}
            onKeyDown={handleKeyDown}
            onBlur={() => (stateRef.current.isHovering = false)}
            data-dmm-target="manipulator"
            className="relative h-[330px] sm:h-[430px] w-full rounded-xl bg-[#E8E8E5] border border-[#D0D0CB] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9),0_12px_32px_-12px_rgba(0,0,0,0.08)] overflow-hidden cursor-crosshair select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500]"
          >
            <CornerCrosshairs type="crosshair" />

            {/* Top Control Strip: Clean Authentic Industrial Hardware Buttons */}
            <div className="relative z-10 px-4 sm:px-6 pt-4 sm:pt-4 flex flex-wrap items-center justify-between gap-3 bg-[#DFDFDC]/70 border-b border-[#D0D0CA] pb-3">
              <div className="flex items-center gap-2.5 pointer-events-none min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#FF5500] shadow-[0_0_6px_#FF5500] shrink-0" />
                <span className="font-sans text-xs font-bold text-[#111111] uppercase tracking-wider truncate">
                  Articulated Manipulator &amp; Gripper Stage
                </span>
                <span className="font-mono text-[9px] font-bold text-white uppercase px-2 py-0.5 rounded bg-[#111111] shadow-sm">
                  Rev 3.2
                </span>
              </div>

              {/* Physical Rocker Switch Buttons + Tactile Dial */}
              <div
                className="flex flex-wrap items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="hidden sm:flex items-center gap-2 pr-1">
                  <TactileDial color="orange" size={20} rotation={25} label="CALIB" />
                </div>

                {MODES.map((m) => {
                  const isActive = armMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handleModeChange(m.id)}
                      className={
                        isActive
                          ? 'btn-rocker-orange font-sans font-bold text-xs uppercase px-3 py-1.5'
                          : 'btn-rocker-white font-sans font-bold text-xs uppercase px-3 py-1.5'
                      }
                    >
                      {m.label}
                    </button>
                  );
                })}

                {/* Gripper Status Pill */}
                <button
                  type="button"
                  aria-pressed={isClamped}
                  onClick={toggleGrip}
                  className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    isClamped
                      ? 'bg-[#10B981] text-white shadow-[0_2px_0_#059669]'
                      : 'bg-[#DFDFDC] text-[#444440] border border-[#C8C8C2] hover:bg-[#EAEAE7]'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isClamped ? 'bg-white animate-pulse' : 'bg-[#FF5500]'
                    }`}
                  />
                  <span>{isClamped ? 'Gripper Clamped' : 'Gripper Open'}</span>
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full block"
            />

            {/* Bottom Status Ribbon */}
            <div className="absolute bottom-3 sm:bottom-3.5 left-4 sm:left-6 right-4 sm:right-6 z-10 flex items-center justify-between gap-2 pointer-events-none">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#DFDFDC]/90 border border-[#C8C8C2] font-mono text-[10px] text-[#222220] font-semibold shadow-sm max-w-full truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] shrink-0" />
                <span className="truncate">Inverse Kinematics · Real-Time IK Solver · Precision End-Effector</span>
              </span>

              <span className="font-mono text-[10px] text-[#666662] font-medium hidden sm:inline shrink-0 bg-[#DFDFDC]/80 px-2.5 py-1 rounded border border-[#C8C8C2]">
                Click or tap stage to grip · Select Pick &amp; Place for automatic cycle
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

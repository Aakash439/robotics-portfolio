import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PERSONAL_PROFILE } from '../data/projects';
import { TactileDial } from './TactileDial';
import { CornerCrosshairs } from './CornerCrosshairs';
import { StickmanBuilder } from './StickmanBuilder';
import { audioEngine } from '../utils/audio';
import { gsap } from '../utils/gsapAnimations';

const STUDIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type ArmControlMode = 'cursor' | 'orbit' | 'pick-place';

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
  | 'inspection'
  | 'conveyor_slide'
  | 'home';

interface StageObject {
  id: number;
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
  const [telemetry, setTelemetry] = useState({
    theta1: -62,
    theta2: 68,
    theta3: -12,
    tcpX: 240,
    tcpY: 140,
    vel: 0,
    mode: 'cursor' as ArmControlMode,
  });

  // GSAP Entrance Timeline: Staggered mechanical reveal
  useEffect(() => {
    if (!heroContainerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ctx: gsap.Context | null = null;

    const runTimeline = () => {
      if (ctx) ctx.revert();
      ctx = gsap.context(() => {
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
    };

    const hasBooted = typeof window !== 'undefined' && sessionStorage.getItem('boot-sequence-shown');
    let timer = 0;

    if (hasBooted) {
      runTimeline();
    } else {
      timer = window.setTimeout(runTimeline, 1200);
      window.addEventListener('portfolio-boot-complete', runTimeline, { once: true });
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('portfolio-boot-complete', runTimeline);
      if (ctx) ctx.revert();
    };
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

  // State ref for high-frequency canvas engine
  const stateRef = useRef({
    normX: 0.62,
    normY: 0.45,
    isHovering: false,
    smoothX: 0.62,
    smoothY: 0.45,
    velX: 0,
    velY: 0,
    prevTcpX: 0,
    prevTcpY: 0,
    instantSpeed: 0,
    smoothJaw: 0.2,
    mode: 'cursor' as ArmControlMode,
    clamped: false,
    prevGrip: false,
    gripArmedUntil: 0,
    heldIndex: -1,
    heldOffX: 0,
    heldOffY: 0,
    lastWristAngle: 0.8,
    lastGripX: 0,
    lastGripY: 0,
    objects: [] as StageObject[],
    conveyorOffset: 0,
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
    s.trail = []; // Clear trail on mode change to prevent visual jump lines
  }, [armMode]);

  useEffect(() => {
    stateRef.current.clamped = isClamped;
  }, [isClamped]);

  // Main Canvas Render & Kinematic Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId = 0;
    let running = false;
    let width = 0;
    let height = 0;

    const getGeo = () => {
      const minDim = Math.min(width, height);
      const scale = Math.max(0.7, Math.min(1.05, width / 580));
      // Ground table surface height
      const tableY = height * 0.83;
      // Shoulder pivot is elevated on an industrial casting riser:
      const pedestalHeight = 44 * scale;
      const baseX = width * 0.28;
      const baseY = tableY - pedestalHeight;
      // Proportional link lengths
      const L1 = minDim * 0.33; // Upper arm (~120-140px)
      const L2 = minDim * 0.27; // Forearm (~100-115px)
      const L3 = 34 * scale;    // Wrist to gripper center
      const gripDist = 26 * scale;
      // Natural reach envelope (compact sweet spot so arm stays arched)
      const reach = (L1 + L2) * 0.94;
      const minReach = Math.abs(L1 - L2) + 20 * scale;
      const maxReach = (L1 + L2) * 0.96;
      const objW = 38 * scale;
      const objH = 24 * scale;
      return { minDim, scale, tableY, pedestalHeight, baseX, baseY, L1, L2, L3, gripDist, reach, minReach, maxReach, objW, objH };
    };

    const getTargetZone = () => {
      const g = getGeo();
      // Target PCB Tray positioned comfortably in 42% reach zone
      const cx = g.baseX + g.reach * 0.42;
      const w = g.objW * 3.4;
      const h = g.objH * 1.5;
      return { cx, x0: cx - w / 2, x1: cx + w / 2, y: g.tableY - h / 2, w, h };
    };

    const inZone = (o: StageObject) => {
      const z = getTargetZone();
      return o.x >= z.x0 && o.x <= z.x1;
    };

    const layoutObjects = () => {
      const g = getGeo();
      const key = `${Math.round(width)}x${Math.round(height)}`;
      const s = stateRef.current;
      if (s.layoutKey === key) return;
      s.layoutKey = key;
      // Home positions inside the 60% - 84% reach sweet spot (never stretched flat)
      const homeFs = [0.62, 0.73, 0.84];
      s.heldIndex = -1;
      s.auto.phase = 'select';
      s.objects = ['SMD-0805', 'QFN-32', 'LM2596'].map((label, i) => ({
        id: i + 1,
        label,
        x: g.baseX + g.reach * homeFs[i],
        y: g.tableY - g.objH / 2,
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
      stateRef.current.trail = [];
    };

    // Strict Analytical Elbow-Up Inverse Kinematics Solver (Arched Industrial Geometry)
    const solveIK = (targetX: number, targetY: number, desiredWristAngle?: number) => {
      const g = getGeo();
      const { baseX, baseY, tableY, L1, L2, L3, maxReach, minReach, scale } = g;

      // Table barrier: clamp target strictly above table
      const clampedX = Math.max(baseX + 28 * scale, Math.min(baseX + maxReach, targetX));
      const clampedY = Math.max(height * 0.12, Math.min(tableY - 8 * scale, targetY));

      // Natural approach wrist angle: pitches downward (~85°-90°) when approaching table
      let wristAngle: number;
      if (desiredWristAngle !== undefined) {
        wristAngle = desiredWristAngle;
      } else {
        const heightFromTable = tableY - clampedY;
        const downBlend = Math.max(0, Math.min(1, 1 - heightFromTable / (160 * scale)));
        wristAngle = 0.2 + downBlend * 1.35; // 0.2 rad (~11°) to 1.55 rad (89° straight down)
      }

      // Wrist joint center
      const wristX = clampedX - Math.cos(wristAngle) * L3;
      const wristY = clampedY - Math.sin(wristAngle) * L3;

      const dx = wristX - baseX;
      const dy = wristY - baseY;
      const dist = Math.max(minReach, Math.min(maxReach, Math.hypot(dx, dy)));

      // Base to wrist angle (since shoulder is elevated, dy is small or negative)
      const gamma = Math.atan2(dy, dx);

      // Law of cosines for elbow interior angle
      const cosAlpha = Math.max(
        -0.96,
        Math.min(0.96, (L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2))
      );
      const alpha = Math.acos(cosAlpha);

      // Relative elbow angle (strictly positive for Elbow-Up, guaranteed between 25° and 155°)
      const thetaElbowRel = Math.PI - alpha;

      // Law of cosines for shoulder angle offset beta
      const cosBeta = Math.max(
        -0.96,
        Math.min(0.96, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist))
      );
      const beta = Math.acos(cosBeta);

      // Shoulder angle (elbow-up: subtract beta, always in arched upper quadrant [-85°, -25°])
      const theta1 = gamma - beta;

      // Joint positions
      const elbowX = baseX + Math.cos(theta1) * L1;
      const elbowY = baseY + Math.sin(theta1) * L1;

      // Forearm absolute angle
      const theta2 = theta1 + thetaElbowRel;
      const calculatedWristX = elbowX + Math.cos(theta2) * L2;
      const calculatedWristY = elbowY + Math.sin(theta2) * L2;

      // End-effector Tool Center Point (TCP)
      const tcpX = calculatedWristX + Math.cos(wristAngle) * L3;
      const tcpY = calculatedWristY + Math.sin(wristAngle) * L3;

      return {
        theta1,
        theta2,
        wristAngle,
        elbowX,
        elbowY,
        wristX: calculatedWristX,
        wristY: calculatedWristY,
        tcpX,
        tcpY,
        dist,
      };
    };

    const startTime = performance.now();
    let lastTime = startTime;
    let telemetryThrottle = 0;

    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;
      const t = (now - startTime) * 0.001;

      const s = stateRef.current;
      const g = getGeo();
      const { scale, baseX, baseY, tableY, pedestalHeight, gripDist } = g;
      const zone = getTargetZone();

      let targetNormX = s.smoothX;
      let targetNormY = s.smoothY;
      let gripCommand = s.clamped;

      const toTargetNorm = (gx: number, gy: number, angle?: number) => {
        const wa = angle !== undefined ? angle : s.lastWristAngle;
        const tx = gx - Math.cos(wa) * gripDist;
        const ty = gy - Math.sin(wa) * gripDist;
        targetNormX = tx / width;
        targetNormY = ty / height;
      };

      // ----------------- AUTONOMOUS PICK & PLACE ROUTINE -----------------
      if (s.mode === 'pick-place') {
        const a = s.auto;
        const elapsed = t - a.phaseStart;
        const go = (phase: AutoPhase) => {
          a.phase = phase;
          a.phaseStart = t;
        };
        const lift = 65 * scale;
        const atGoal = (gx: number, gy: number) =>
          Math.hypot(s.lastGripX - gx, s.lastGripY - gy) < 8 * scale;

        gripCommand =
          a.phase === 'grip' ||
          a.phase === 'lift' ||
          a.phase === 'transit' ||
          a.phase === 'lower';

        if (gripCommand !== isClamped) setIsClamped(gripCommand);

        if (a.phase === 'select') {
          gripCommand = false;
          // Find next component outside the Target PCB Tray
          const unplacedIdx = s.objects.findIndex((o) => !inZone(o));
          if (unplacedIdx >= 0) {
            const o = s.objects[unplacedIdx];
            a.index = unplacedIdx;
            a.pickX = o.x;
            a.pickY = o.y;

            // Slot spacing inside PCB tray
            const placedCount = s.objects.filter((obj) => inZone(obj)).length;
            const slotSpacing = zone.w / 3.8;
            a.destX = zone.cx - (1 - placedCount) * slotSpacing;
            a.destY = tableY - o.h / 2;

            go('approach');
            toTargetNorm(s.lastGripX, s.lastGripY);
          } else {
            // ALL 3 BLOCKS PLACED! Smooth inspection and continuous conveyor cycle
            go('inspection');
          }
        } else if (a.phase === 'approach') {
          toTargetNorm(a.pickX, a.pickY - lift);
          if (atGoal(a.pickX, a.pickY - lift) || elapsed > 1.2) go('descend');
        } else if (a.phase === 'descend') {
          toTargetNorm(a.pickX, a.pickY);
          if (atGoal(a.pickX, a.pickY) || elapsed > 1.0) {
            audioEngine.playRelayClick();
            go('grip');
          }
        } else if (a.phase === 'grip') {
          toTargetNorm(a.pickX, a.pickY);
          if (elapsed > 0.35) go('lift');
        } else if (a.phase === 'lift') {
          toTargetNorm(a.pickX, a.pickY - lift);
          if (atGoal(a.pickX, a.pickY - lift) || elapsed > 1.0) go('transit');
        } else if (a.phase === 'transit') {
          toTargetNorm(a.destX, a.destY - lift);
          if (atGoal(a.destX, a.destY - lift) || elapsed > 1.4) go('lower');
        } else if (a.phase === 'lower') {
          toTargetNorm(a.destX, a.destY);
          if (atGoal(a.destX, a.destY) || elapsed > 1.0) {
            audioEngine.playMechanicalClick();
            go('release');
          }
        } else if (a.phase === 'release') {
          toTargetNorm(a.destX, a.destY);
          if (elapsed > 0.35) go('retreat');
        } else if (a.phase === 'retreat') {
          toTargetNorm(a.destX, a.destY - lift);
          if (atGoal(a.destX, a.destY - lift) || elapsed > 1.0) {
            const unplaced = s.objects.findIndex((o) => !inZone(o));
            if (unplaced < 0) {
              go('inspection');
            } else {
              go('select');
            }
          }
        } else if (a.phase === 'inspection') {
          const homeX = baseX + g.reach * 0.55;
          const homeY = tableY - 130 * scale;
          toTargetNorm(homeX, homeY);
          if (elapsed > 1.4) {
            audioEngine.playRelayClick();
            go('conveyor_slide');
          }
        } else if (a.phase === 'conveyor_slide') {
          const homeX = baseX + g.reach * 0.55;
          const homeY = tableY - 130 * scale;
          toTargetNorm(homeX, homeY);

          // Smooth continuous conveyor slide:
          s.objects.forEach((o) => {
            o.x -= dt * 170 * scale;
          });
          s.conveyorOffset += dt * 50 * scale;

          if (elapsed > 2.0) {
            audioEngine.playMechanicalClick();
            const homeFs = [0.62, 0.73, 0.84];
            s.objects = ['SMD-0805', 'QFN-32', 'LM2596'].map((label, i) => ({
              id: Date.now() + i,
              label,
              x: baseX + g.reach * homeFs[i],
              y: tableY - g.objH / 2,
              w: g.objW,
              h: g.objH,
              vy: 0,
              homeF: homeFs[i],
            }));
            go('select');
          }
        }
      } else if (s.mode === 'orbit') {
        // LIVE KINEMATICS: Responsive cursor control with smooth orbital ambient
        if (s.isHovering) {
          targetNormX = s.normX;
          targetNormY = s.normY;
        } else {
          targetNormX = 0.60 + Math.cos(t * 1.6) * 0.12;
          targetNormY = 0.42 + Math.sin(t * 1.6) * 0.14;
        }
      } else if (s.isHovering) {
        // CAD WIREFRAME: Direct cursor guidance
        targetNormX = s.normX;
        targetNormY = s.normY;
      } else if (!reduceMotion && s.heldIndex < 0) {
        targetNormX = 0.60 + Math.cos(t * 0.8) * 0.1;
        targetNormY = 0.40 + Math.sin(t * 1.3) * 0.08;
      }

      // Kinematic spring damping
      const stiffness = s.mode === 'pick-place' ? 0.095 : 0.088;
      const damping = 0.82;
      s.velX = (s.velX + (targetNormX - s.smoothX) * stiffness) * damping;
      s.velY = (s.velY + (targetNormY - s.smoothY) * stiffness) * damping;
      s.smoothX += s.velX;
      s.smoothY += s.velY;

      // Solve inverse kinematics for current smooth position
      const rawTargetX = s.smoothX * width;
      const rawTargetY = s.smoothY * height;
      const ik = solveIK(rawTargetX, rawTargetY);

      // Gripper contact point
      const gripX = ik.tcpX + Math.cos(ik.wristAngle) * gripDist;
      const gripY = ik.tcpY + Math.sin(ik.wristAngle) * gripDist;
      s.lastWristAngle = ik.wristAngle;
      s.lastGripX = gripX;
      s.lastGripY = gripY;

      // Instantaneous speed calculation
      const distTraveled = Math.hypot(ik.tcpX - s.prevTcpX, ik.tcpY - s.prevTcpY);
      s.instantSpeed = dt > 0 ? (distTraveled / dt) * (scale > 0 ? 1 / scale : 1) : 0;
      s.prevTcpX = ik.tcpX;
      s.prevTcpY = ik.tcpY;

      // ----------------- MANUAL INTERACTIVE GRIPPER & OBJECT PHYSICS -----------------
      const findGrippable = () => {
        let best = -1;
        let bestD = Infinity;
        s.objects.forEach((o, i) => {
          const pad = 14 * scale;
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
          audioEngine.playRelayClick();
        }
      } else if (!gripCommand && s.prevGrip && s.heldIndex >= 0) {
        s.objects[s.heldIndex].vy = 0;
        s.heldIndex = -1;
        audioEngine.playMechanicalClick();
      }
      s.prevGrip = gripCommand;
      const hoverIndex = s.heldIndex < 0 ? findGrippable() : -1;

      // Update positions of objects
      s.objects.forEach((o, i) => {
        if (i === s.heldIndex) {
          s.heldOffX *= 0.85;
          s.heldOffY *= 0.85;
          o.x = gripX + s.heldOffX;
          o.y = Math.min(gripY + s.heldOffY, tableY - o.h / 2);
        } else if (s.auto.phase !== 'conveyor_slide') {
          o.y = tableY - o.h / 2;
        }
      });

      const holding = s.heldIndex >= 0;

      // Clean motion trail: only add if robot actually moved and within reasonable distance
      if (distTraveled > 1.5 && distTraveled < 40 * scale) {
        s.trail.push({ x: ik.tcpX, y: ik.tcpY });
        if (s.trail.length > 28) s.trail.shift();
      } else if (distTraveled >= 40 * scale) {
        // Discontinuity (jump): clear trail
        s.trail = [];
      }

      // Gripper Jaw Physics
      const jawTarget = gripCommand ? 0.95 : 0.15;
      s.smoothJaw += (jawTarget - s.smoothJaw) * 0.22;
      const jawGap = (1 - s.smoothJaw) * 9 * scale;

      // Throttle telemetry update to React
      telemetryThrottle += dt;
      if (telemetryThrottle > 0.065) {
        telemetryThrottle = 0;
        setTelemetry({
          theta1: Math.round((ik.theta1 * 180) / Math.PI),
          theta2: Math.round(((ik.theta2 - ik.theta1) * 180) / Math.PI),
          theta3: Math.round((ik.wristAngle * 180) / Math.PI),
          tcpX: Math.round(ik.tcpX - baseX),
          tcpY: Math.round(tableY - ik.tcpY),
          vel: Math.round(s.instantSpeed),
          mode: s.mode,
        });
      }

      // =========================================================================
      // RENDERING PIPELINE (3 DISTINCT MODES + INTERACTIVE MANUAL SANDBOX)
      // =========================================================================
      ctx.clearRect(0, 0, width, height);

      // ----------------- 1. DRAFTING PLATE GRID -----------------
      if (s.mode === 'cursor') {
        // Blueprint Technical Cyan Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
        ctx.lineWidth = 1;
        const step = 18 * scale;
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
      } else {
        // Clean Dieter Rams Industrial Workshop Grid
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
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
      }

      // ----------------- 2. TABLE SURFACE & CONVEYOR RUNNER -----------------
      // Workshop Table Ground Line
      ctx.strokeStyle = s.mode === 'cursor' ? 'rgba(0, 240, 255, 0.25)' : '#D0D0CB';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, tableY);
      ctx.lineTo(width, tableY);
      ctx.stroke();

      // Reach envelope arcs
      [0.35, 0.58, 0.82].forEach((rFactor, idx) => {
        ctx.strokeStyle = s.mode === 'cursor'
          ? `rgba(0, 240, 255, ${0.14 - idx * 0.03})`
          : `rgba(0, 0, 0, ${0.08 - idx * 0.02})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(baseX, baseY, width * rFactor, -Math.PI * 0.85, -Math.PI * 0.1);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ----------------- 3. TARGET PCB TRAY (Center-Left) -----------------
      ctx.save();
      ctx.fillStyle = s.mode === 'cursor' ? 'rgba(0, 240, 255, 0.06)' : '#E2E2DF';
      const allInZone = s.objects.length > 0 && s.objects.every((o) => inZone(o));
      ctx.strokeStyle = allInZone ? '#10B981' : '#30D158';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.roundRect(zone.x0, tableY - 14 * scale, zone.w, 18 * scale, 4 * scale);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Inspection Status Callout
      ctx.fillStyle = '#059669';
      ctx.font = `700 ${Math.round(8.5 * Math.max(scale, 0.85))}px "Geist Mono", monospace`;
      ctx.textAlign = 'center';
      if (s.auto.phase === 'inspection') {
        ctx.fillStyle = '#10B981';
        ctx.fillText('AOI: 100% PASS · QC VERIFIED', zone.cx, tableY + 16 * scale);
      } else if (s.auto.phase === 'conveyor_slide') {
        ctx.fillStyle = '#FF5C00';
        ctx.fillText('BATCH DISPATCHING · CONVEYOR ACTIVE', zone.cx, tableY + 16 * scale);
      } else {
        ctx.fillText('Target PCB Tray (Drop Components Here)', zone.cx, tableY + 16 * scale);
      }
      ctx.textAlign = 'left';

      // ----------------- 4. MOTION TRAIL (Clean, Segmented, Discontinuity-Safe) -----------------
      if (s.trail.length > 1) {
        for (let i = 1; i < s.trail.length; i++) {
          const p1 = s.trail[i - 1];
          const p2 = s.trail[i];
          const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          // Only draw continuous segment if points are adjacent (prevents screen-crossing lines)
          if (segDist < 35 * scale) {
            const alpha = (i / s.trail.length) * 0.75;
            ctx.strokeStyle = s.mode === 'cursor'
              ? `rgba(0, 240, 255, ${alpha})`
              : holding
              ? `rgba(16, 185, 129, ${alpha})`
              : `rgba(255, 92, 0, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // ----------------- 5. SMD ELECTRONIC COMPONENTS (Interactive!) -----------------
      s.objects.forEach((o, i) => {
        const isHeld = i === s.heldIndex;
        const isHover = i === hoverIndex;
        const x0 = o.x - o.w / 2;
        const y0 = o.y - o.h / 2;

        // Silver solder leads / pins
        ctx.strokeStyle = '#888884';
        ctx.lineWidth = 1.2;
        const pins = 4;
        for (let p = 0; p < pins; p++) {
          const px = x0 + (o.w / (pins + 1)) * (p + 1);
          ctx.beginPath();
          ctx.moveTo(px, y0);
          ctx.lineTo(px, y0 - 3 * scale);
          ctx.moveTo(px, y0 + o.h);
          ctx.lineTo(px, y0 + o.h + 2.5 * scale);
          ctx.stroke();
        }

        // Chip body
        ctx.save();
        ctx.shadowColor = isHeld ? 'rgba(16, 185, 129, 0.45)' : isHover ? 'rgba(255, 92, 0, 0.35)' : 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = isHeld || isHover ? 10 : 4;
        ctx.fillStyle = '#18181B';
        ctx.beginPath();
        ctx.roundRect(x0, y0, o.w, o.h, 4 * scale);
        ctx.fill();
        ctx.restore();

        // Edge stroke
        ctx.strokeStyle = isHeld ? '#10B981' : isHover ? '#FF5C00' : inZone(o) ? '#30D158' : '#3F3F46';
        ctx.lineWidth = isHeld || isHover ? 1.8 : 1.2;
        ctx.beginPath();
        ctx.roundRect(x0, y0, o.w, o.h, 4 * scale);
        ctx.stroke();

        // Pin 1 orientation dot
        ctx.fillStyle = '#FF5C00';
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

      // ----------------- 6. CAST INDUSTRIAL RISER PEDESTAL -----------------
      // Elevates shoulder pivot 44px above table for natural high-arched reach
      ctx.save();
      if (s.mode === 'cursor') {
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.4;
        // Table flanged base plate
        ctx.strokeRect(baseX - 26 * scale, tableY - 6 * scale, 52 * scale, 6 * scale);
        // Riser column
        ctx.strokeRect(baseX - 16 * scale, baseY, 32 * scale, pedestalHeight);
      } else {
        // Table flanged base plate
        ctx.fillStyle = '#18181B';
        ctx.strokeStyle = '#3F3F46';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(baseX - 28 * scale, tableY - 8 * scale, 56 * scale, 8 * scale, 2 * scale);
        ctx.fill();
        ctx.stroke();

        // Heavy ribbed casting riser pillar
        ctx.fillStyle = '#222226';
        ctx.beginPath();
        ctx.roundRect(baseX - 16 * scale, baseY, 32 * scale, pedestalHeight, 2 * scale);
        ctx.fill();
        ctx.stroke();

        // Anchor bolts
        [-18, 0, 18].forEach((bx) => {
          ctx.fillStyle = '#71717A';
          ctx.beginPath();
          ctx.arc(baseX + bx * scale, tableY - 4 * scale, 1.8 * scale, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.restore();

      // ----------------- 7. ROBOTIC ARM LINKS -----------------
      const drawLink = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        w1: number,
        w2: number
      ) => {
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
        if (s.mode === 'cursor') {
          // CAD Wireframe Blueprint Style
          ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineTo(p3x, p3y);
          ctx.lineTo(p4x, p4y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Internal CAD weight-reduction pockets
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(mx - 10 * scale, my - 5 * scale, 20 * scale, 10 * scale);

          // Neutral centerline (dash-dot)
          ctx.strokeStyle = '#FF5C00';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([6, 3, 2, 3]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // CNC Anodized Titanium Solid Style
          ctx.fillStyle = '#222225';
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineTo(p3x, p3y);
          ctx.lineTo(p4x, p4y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#444448';
          ctx.lineWidth = 1.4;
          ctx.stroke();

          ctx.strokeStyle = '#55555A';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      };

      // Draw the 3 links with guaranteed high-arched industrial geometry
      drawLink(baseX, baseY, ik.elbowX, ik.elbowY, 26 * scale, 20 * scale);
      drawLink(ik.elbowX, ik.elbowY, ik.wristX, ik.wristY, 20 * scale, 16 * scale);
      drawLink(ik.wristX, ik.wristY, ik.tcpX, ik.tcpY, 15 * scale, 12 * scale);

      // ----------------- 8. ROTARY PIVOTS & COORDINATE FRAMES -----------------
      const drawCoordinateFrame = (x: number, y: number, angle: number, label: string) => {
        const axisLen = 20 * scale;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // X-Axis (Red)
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(axisLen, 0);
        ctx.stroke();

        // Y-Axis (Green)
        ctx.strokeStyle = '#10B981';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -axisLen);
        ctx.stroke();

        ctx.fillStyle = '#00F0FF';
        ctx.font = `700 ${Math.round(8 * scale)}px "Geist Mono", monospace`;
        ctx.fillText(label, 5 * scale, -6 * scale);
        ctx.restore();
      };

      const drawPivot = (px: number, py: number, radius: number, angleText?: string) => {
        ctx.save();
        if (s.mode === 'cursor') {
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#FF5C00';
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.45, 0, Math.PI * 2);
          ctx.fill();

          if (angleText) {
            ctx.fillStyle = '#FF5C00';
            ctx.font = `700 ${Math.round(9 * Math.max(scale, 0.85))}px "Geist Mono", monospace`;
            ctx.fillText(angleText, px + radius + 4 * scale, py + 3 * scale);
          }
        } else {
          ctx.fillStyle = '#DFDFDC';
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#111111';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          ctx.fillStyle = '#FF5C00';
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.35, 0, Math.PI * 2);
          ctx.fill();

          if (angleText) {
            ctx.fillStyle = '#111111';
            ctx.font = `600 ${Math.round(9.5 * Math.max(scale, 0.85))}px "Geist Mono", monospace`;
            ctx.fillText(angleText, px + radius + 4 * scale, py + 3 * scale);
          }
        }
        ctx.restore();
      };

      // Draw Pivots with strict angles
      drawPivot(baseX, baseY, 13 * scale, `θ1 ${Math.round((ik.theta1 * 180) / Math.PI)}°`);
      drawPivot(ik.elbowX, ik.elbowY, 10 * scale, `θ2 ${Math.round(((ik.theta2 - ik.theta1) * 180) / Math.PI)}°`);
      drawPivot(ik.wristX, ik.wristY, 7 * scale, `θ3 ${Math.round((ik.wristAngle * 180) / Math.PI)}°`);

      // Draw Coordinate Frames in CAD Wireframe Mode
      if (s.mode === 'cursor') {
        drawCoordinateFrame(baseX, baseY, 0, '{0}');
        drawCoordinateFrame(ik.elbowX, ik.elbowY, ik.theta1, '{1}');
        drawCoordinateFrame(ik.wristX, ik.wristY, ik.theta2, '{2}');
        drawCoordinateFrame(ik.tcpX, ik.tcpY, ik.wristAngle, '{TCP}');

        // Dimension lines
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(baseX, baseY + 16 * scale);
        ctx.lineTo(ik.tcpX, baseY + 16 * scale);
        ctx.stroke();

        ctx.fillStyle = '#00F0FF';
        ctx.font = `600 ${Math.round(8 * scale)}px "Geist Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`ΔX: ${(ik.tcpX - baseX).toFixed(1)}mm`, (baseX + ik.tcpX) / 2, baseY + 26 * scale);
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ----------------- 9. GRIPPER END-EFFECTOR -----------------
      ctx.save();
      ctx.translate(ik.tcpX, ik.tcpY);
      ctx.rotate(ik.wristAngle);

      if (s.mode === 'cursor') {
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(4 * scale, -10 * scale - jawGap, 16 * scale, 3.5 * scale);
        ctx.strokeRect(4 * scale, 6.5 * scale + jawGap, 16 * scale, 3.5 * scale);
      } else {
        ctx.fillStyle = '#1A1A18';
        ctx.strokeStyle = holding ? '#10B981' : '#111111';
        ctx.lineWidth = 1.4;

        // Left jaw
        ctx.beginPath();
        ctx.rect(4 * scale, -11 * scale - jawGap, 16 * scale, 4 * scale);
        ctx.fill();
        ctx.stroke();

        // Right jaw
        ctx.beginPath();
        ctx.rect(4 * scale, 7 * scale + jawGap, 16 * scale, 4 * scale);
        ctx.fill();
        ctx.stroke();

        // Laser alignment crosshair
        ctx.strokeStyle = holding ? '#10B981' : '#FF5C00';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(gripDist - 6 * scale, 0);
        ctx.lineTo(gripDist + 6 * scale, 0);
        ctx.stroke();
      }
      ctx.restore();

      // Dynamic Velocity Vector in Live Kinematics
      if (s.mode === 'orbit' && s.instantSpeed > 6) {
        ctx.save();
        const vLen = Math.min(45 * scale, s.instantSpeed * 0.15 * scale);
        const vAngle = Math.atan2(ik.tcpY - s.prevTcpY, ik.tcpX - s.prevTcpX);
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ik.tcpX, ik.tcpY);
        ctx.lineTo(ik.tcpX + Math.cos(vAngle) * vLen, ik.tcpY + Math.sin(vAngle) * vLen);
        ctx.stroke();

        ctx.fillStyle = '#10B981';
        ctx.font = `700 ${Math.round(8.5 * scale)}px "Geist Mono", monospace`;
        ctx.fillText(`v: ${Math.round(s.instantSpeed)} mm/s`, ik.tcpX + Math.cos(vAngle) * vLen + 4, ik.tcpY + Math.sin(vAngle) * vLen);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        running = true;
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
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
    s.normX = Math.max(0.12, Math.min(0.92, x));
    s.normY = Math.max(0.12, Math.min(0.86, y));
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
      // In pick-place, user clicking switches to manual cursor mode so they can play freely!
      setArmMode('cursor');
      setIsClamped(true);
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
      if (e.key === 'ArrowLeft') s.normX = Math.max(0.12, s.normX - step);
      if (e.key === 'ArrowRight') s.normX = Math.min(0.92, s.normX + step);
      if (e.key === 'ArrowUp') s.normY = Math.max(0.12, s.normY - step);
      if (e.key === 'ArrowDown') s.normY = Math.min(0.86, s.normY + step);
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
              data-parkour-surface="field-workbench"
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
                aria-label="Aakash Sharma — Robotics Engineer & Autonomous Systems"
              >
                hey, i'm{' '}
                <span
                  ref={badgeRef}
                  data-parkour-surface="aakash-badge"
                  onClick={handleBadgeClick}
                  className="bg-[#FF5500] text-black px-2 py-0.5 rounded-sm inline-block select-none cursor-pointer transform-gpu shadow-sm hover:shadow-md transition-shadow"
                  title="Aakash Sharma · Click for tactile pulse"
                >
                  aakash.
                </span>
                <span className="sr-only"> Sharma - Robotics Engineer</span>
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
            aria-label="Interactive robotic arm. Move pointer to control gripper; click or press Space to grip and release components manually."
            onMouseMove={(e) => setPointer(e.clientX, e.clientY)}
            onMouseLeave={() => {
              stateRef.current.isHovering = false;
              stateRef.current.trail = [];
            }}
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
            className="relative h-[340px] sm:h-[430px] w-full rounded-xl bg-[#E8E8E5] border border-[#D0D0CB] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9),0_12px_32px_-12px_rgba(0,0,0,0.08)] overflow-hidden cursor-crosshair select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500]"
          >
            <CornerCrosshairs type="crosshair" />

            {/* Top Control Strip */}
            <div className="relative z-10 px-4 sm:px-6 pt-3.5 sm:pt-4 flex flex-wrap items-center justify-between gap-3 bg-[#DFDFDC]/85 border-b border-[#D0D0CA] pb-3 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 pointer-events-none min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#FF5500] shadow-[0_0_6px_#FF5500] shrink-0" />
                <span className="font-sans text-xs font-bold text-[#111111] uppercase tracking-wider truncate">
                  Articulated Manipulator &amp; Gripper Stage
                </span>
                <span className="font-mono text-[9px] font-bold text-white uppercase px-2 py-0.5 rounded bg-[#111111] shadow-sm">
                  REV 4.3
                </span>
              </div>

              {/* Hardware Rocker Buttons + Tactile Dial */}
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

            {/* Bottom Status Ribbon with Docked Digital Telemetry HUD (Zero Overlap!) */}
            <div className="absolute bottom-3 sm:bottom-3.5 left-4 sm:left-6 right-4 sm:right-6 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#DFDFDC]/90 border border-[#C8C8C2] font-mono text-[10px] text-[#222220] font-semibold shadow-sm max-w-full truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] shrink-0" />
                <span className="truncate">
                  {armMode === 'cursor'
                    ? 'CAD Wireframe Mode · Move mouse to guide arm · Click or Space to grab & drop chips manually'
                    : armMode === 'orbit'
                    ? 'Live Kinematics Mode · Dynamic Velocity Vector · Real-time Forward Kinematics'
                    : 'Pick & Place Mode · Autonomous Assembly Cycle · Smooth Conveyor Replenishment'}
                </span>
              </span>

              {/* Hardware LCD Telemetry Readout (Cleanly Docked in Bottom Bar) */}
              <div className="bg-[#18181B]/90 text-white backdrop-blur-md px-3 py-1 rounded border border-[#3F3F46] shadow-sm flex items-center gap-2.5 font-mono text-[10px] shrink-0">
                <span className="text-[#38BDF8] font-bold">
                  θ1: {telemetry.theta1}° · θ2: {telemetry.theta2}° · θ3: {telemetry.theta3}°
                </span>
                <span className="text-[#D4D4D8] hidden md:inline">
                  [X: {telemetry.tcpX}mm, Y: {telemetry.tcpY}mm]
                </span>
                {armMode === 'orbit' && (
                  <span className="text-[#10B981] font-bold">
                    v: {telemetry.vel} mm/s
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

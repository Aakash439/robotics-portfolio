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
  | 'aoi_scan'
  | 'dispatch'
  | 'home';

interface FeederPart {
  id: number;
  label: string;
  w: number;
  h: number;
}

const MODES: { id: ArmControlMode; label: string; badge: string }[] = [
  { id: 'cursor', label: 'CAD Wireframe', badge: 'SCHEMATIC' },
  { id: 'orbit', label: 'Live Kinematics', badge: 'TELEMETRY' },
  { id: 'pick-place', label: 'Pick & Place', badge: 'SMT CELL' },
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
  const [isEStopped, setIsEStopped] = useState(false);
  const [isTrajectoryTest, setIsTrajectoryTest] = useState(false);
  const [telemetry, setTelemetry] = useState({
    theta1: -50,
    theta2: 65,
    theta3: -15,
    tcpX: 320,
    tcpY: 180,
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

  // State ref for high-frequency 60fps canvas render loop
  const stateRef = useRef({
    normX: 0.65,
    normY: 0.42,
    isHovering: false,
    smoothX: 0.65,
    smoothY: 0.42,
    velX: 0,
    velY: 0,
    prevTcpX: 0,
    prevTcpY: 0,
    instantSpeed: 0,
    smoothJaw: 0.2,
    mode: 'cursor' as ArmControlMode,
    clamped: false,
    eStopped: false,
    trajTest: false,
    heldPart: null as FeederPart | null,
    // Pick & Place State Machine
    feederParts: [
      { id: 1, label: 'SMD-0805', w: 34, h: 22 },
      { id: 2, label: 'QFN-32', w: 38, h: 26 },
      { id: 3, label: 'LM2596', w: 42, h: 28 },
    ] as FeederPart[],
    pcbSlots: [null, null, null] as (FeederPart | null)[],
    feederBeltOffset: 0,
    pcbSlideOffset: 0, // 0 = centered, negative = exiting left, positive = entering right
    aoiScanProgress: 0,
    aoiLaserActive: false,
    dispatchPhase: 'idle' as 'idle' | 'scanning' | 'sliding_out' | 'sliding_in',
    auto: {
      phase: 'select' as AutoPhase,
      phaseStart: 0,
      activeSlotIdx: 0,
      pickX: 0,
      pickY: 0,
      destX: 0,
      destY: 0,
    },
    trail: [] as { x: number; y: number; vel: number }[],
  });

  // Sync React states to ref
  useEffect(() => {
    stateRef.current.mode = armMode;
    stateRef.current.auto.phase = 'select';
  }, [armMode]);

  useEffect(() => {
    stateRef.current.clamped = isClamped;
  }, [isClamped]);

  useEffect(() => {
    stateRef.current.eStopped = isEStopped;
  }, [isEStopped]);

  useEffect(() => {
    stateRef.current.trajTest = isTrajectoryTest;
  }, [isTrajectoryTest]);

  // Master Canvas Animation & Simulation Engine
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

    // Geometric parameters calculated dynamically
    const getGeo = () => {
      const minDim = Math.min(width, height);
      const scale = Math.max(0.68, Math.min(1.08, width / 580));
      // Anchor base securely on table
      const baseX = width * 0.28;
      const baseY = height * 0.82;
      // Proportional link lengths for smooth, realistic articulated kinematics
      const L1 = minDim * 0.32; // Upper arm
      const L2 = minDim * 0.26; // Forearm
      const L3 = 38 * scale;    // Wrist to gripper center
      const gripDist = 28 * scale;
      const maxReach = (L1 + L2) * 0.985;
      const minReach = Math.abs(L1 - L2) + 16 * scale;
      return { minDim, scale, baseX, baseY, L1, L2, L3, gripDist, maxReach, minReach };
    };

    const resizeCanvas = () => {
      const rect = stage.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Robust Analytical 3-DOF Planar Inverse Kinematics Solver (Strictly Elbow-Up)
    const solveIK = (targetX: number, targetY: number, desiredWristAngle?: number) => {
      const { baseX, baseY, L1, L2, L3, maxReach, minReach, scale } = getGeo();

      // Clamp target within workspace hemisphere above table
      const clampedX = Math.max(baseX + 28 * scale, Math.min(width * 0.94, targetX));
      const clampedY = Math.max(height * 0.12, Math.min(baseY - 10 * scale, targetY));

      // Calculate natural approach wrist angle:
      // When reaching down to table, wrist points down (~85° - 90°) to grasp parts cleanly.
      // When reaching high in the air, wrist aligns naturally with the arm.
      let wristAngle: number;
      if (desiredWristAngle !== undefined) {
        wristAngle = desiredWristAngle;
      } else {
        const heightFromTable = baseY - clampedY;
        const downBlend = Math.max(0, Math.min(1, 1 - heightFromTable / (160 * scale)));
        wristAngle = 0.25 + downBlend * 1.32; // 0.25 rad (~14°) up to 1.57 rad (90° down)
      }

      // Wrist joint center
      const wristX = clampedX - Math.cos(wristAngle) * L3;
      const wristY = clampedY - Math.sin(wristAngle) * L3;

      // 2-Link vector from base to wrist
      const dx = wristX - baseX;
      const dy = wristY - baseY;
      const dist = Math.max(minReach, Math.min(maxReach, Math.hypot(dx, dy)));

      // Angle from base to wrist (always in upper quadrant, dy is negative)
      const gamma = Math.atan2(dy, dx);

      // Law of cosines for elbow angle:
      // Interior angle alpha
      const cosAlpha = Math.max(
        -0.98,
        Math.min(0.98, (L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2))
      );
      const alpha = Math.acos(cosAlpha);

      // Relative elbow bend angle (strictly positive for Elbow-Up, guaranteed between 18° and 155°)
      const thetaElbowRel = Math.PI - alpha;

      // Law of cosines for shoulder angle offset beta
      const cosBeta = Math.max(
        -0.98,
        Math.min(0.98, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist))
      );
      const beta = Math.acos(cosBeta);

      // Shoulder angle (elbow-up: subtract beta)
      const theta1 = gamma - beta;

      // Forward kinematics for joints
      const elbowX = baseX + Math.cos(theta1) * L1;
      const elbowY = baseY + Math.sin(theta1) * L1;

      // Forearm absolute angle
      const theta2 = theta1 + thetaElbowRel;
      const calculatedWristX = elbowX + Math.cos(theta2) * L2;
      const calculatedWristY = elbowY + Math.sin(theta2) * L2;

      // End-effector TCP (Tool Center Point)
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
      const { scale, baseX, baseY, gripDist } = g;

      // Workcell Physical Layouts
      // 1. PCB Target Tray Socket (Center-Left)
      const pcbWidth = 148 * scale;
      const pcbHeight = 44 * scale;
      const pcbBaseX = baseX + (width * 0.52 - baseX);
      const pcbBaseY = baseY - pcbHeight / 2 - 2 * scale;
      const pcbSlotXPositions = [
        pcbBaseX - 44 * scale,
        pcbBaseX,
        pcbBaseX + 44 * scale,
      ];

      // 2. Incoming Feeder Track Conveyor (Right Side)
      const feederWidth = 140 * scale;
      const feederHeight = 36 * scale;
      const feederBaseX = width * 0.84;
      const feederBaseY = baseY - feederHeight / 2 - 2 * scale;
      const feederPickX = feederBaseX - 32 * scale;
      const feederPickY = baseY - 16 * scale;

      // Emergency Stop check: halts all kinematics
      if (s.eStopped) {
        s.velX = 0;
        s.velY = 0;
      } else {
        // Mode-specific Target Positioning
        let targetX = s.smoothX * width;
        let targetY = s.smoothY * height;
        let gripCommand = s.clamped;

        // ------------------ PICK & PLACE SMT WORKCELL ROUTINE ------------------
        if (s.mode === 'pick-place') {
          const a = s.auto;
          const elapsed = t - a.phaseStart;
          const go = (phase: AutoPhase) => {
            a.phase = phase;
            a.phaseStart = t;
          };
          const liftHeight = 65 * scale;
          const atGoal = (gx: number, gy: number) =>
            Math.hypot(s.prevTcpX - gx, s.prevTcpY - gy) < 8 * scale;

          if (a.phase === 'select') {
            gripCommand = false;
            // Determine which slot is empty
            const nextEmptySlot = s.pcbSlots.findIndex((slot) => slot === null);
            if (nextEmptySlot >= 0 && s.feederParts.length > 0) {
              a.activeSlotIdx = nextEmptySlot;
              a.pickX = feederPickX;
              a.pickY = feederPickY;
              a.destX = pcbSlotXPositions[nextEmptySlot];
              a.destY = pcbBaseY - 6 * scale;
              go('approach');
            } else if (nextEmptySlot < 0) {
              // All 3 blocks placed! Begin Automated Optical Inspection (AOI)
              go('aoi_scan');
            }
          } else if (a.phase === 'approach') {
            targetX = a.pickX;
            targetY = a.pickY - liftHeight;
            if (atGoal(targetX, targetY) || elapsed > 1.2) go('descend');
          } else if (a.phase === 'descend') {
            targetX = a.pickX;
            targetY = a.pickY;
            if (atGoal(targetX, targetY) || elapsed > 1.0) {
              audioEngine.playRelayClick();
              gripCommand = true;
              // Grip the part from feeder
              if (!s.heldPart && s.feederParts.length > 0) {
                s.heldPart = s.feederParts.shift() || null;
              }
              go('grip');
            }
          } else if (a.phase === 'grip') {
            targetX = a.pickX;
            targetY = a.pickY;
            gripCommand = true;
            if (elapsed > 0.35) go('lift');
          } else if (a.phase === 'lift') {
            targetX = a.pickX;
            targetY = a.pickY - liftHeight;
            gripCommand = true;
            if (atGoal(targetX, targetY) || elapsed > 1.0) go('transit');
          } else if (a.phase === 'transit') {
            targetX = a.destX;
            targetY = a.destY - liftHeight;
            gripCommand = true;
            if (atGoal(targetX, targetY) || elapsed > 1.4) go('lower');
          } else if (a.phase === 'lower') {
            targetX = a.destX;
            targetY = a.destY;
            gripCommand = true;
            if (atGoal(targetX, targetY) || elapsed > 1.0) {
              audioEngine.playMechanicalClick();
              // Place part into PCB socket slot
              if (s.heldPart) {
                s.pcbSlots[a.activeSlotIdx] = s.heldPart;
                s.heldPart = null;
              }
              gripCommand = false;
              go('release');
            }
          } else if (a.phase === 'release') {
            targetX = a.destX;
            targetY = a.destY;
            gripCommand = false;
            if (elapsed > 0.35) go('retreat');
          } else if (a.phase === 'retreat') {
            targetX = a.destX;
            targetY = a.destY - liftHeight;
            gripCommand = false;
            if (atGoal(targetX, targetY) || elapsed > 1.0) {
              // Check if all 3 are completed
              const emptyLeft = s.pcbSlots.findIndex((slot) => slot === null);
              if (emptyLeft < 0) {
                go('aoi_scan');
              } else {
                go('select');
              }
            }
          } else if (a.phase === 'aoi_scan') {
            // Move arm back to standby home
            targetX = baseX + g.maxReach * 0.45;
            targetY = baseY - 130 * scale;
            gripCommand = false;
            s.aoiLaserActive = true;
            s.aoiScanProgress = Math.min(1, elapsed / 1.5);

            if (elapsed > 1.6) {
              s.aoiLaserActive = false;
              s.dispatchPhase = 'sliding_out';
              audioEngine.playRelayClick();
              go('dispatch');
            }
          } else if (a.phase === 'dispatch') {
            targetX = baseX + g.maxReach * 0.45;
            targetY = baseY - 130 * scale;
            gripCommand = false;

            // Animate completed PCB sliding off to left, new PCB sliding in
            if (s.dispatchPhase === 'sliding_out') {
              s.pcbSlideOffset -= dt * 280 * scale;
              if (s.pcbSlideOffset < -pcbWidth * 1.5) {
                // Completed PCB has exited. Reset slots and slide fresh blank PCB from right
                s.pcbSlots = [null, null, null];
                s.pcbSlideOffset = pcbWidth * 1.5;
                s.dispatchPhase = 'sliding_in';
                // Reload 3 fresh feeder parts with conveyor indexing
                s.feederParts = [
                  { id: Date.now() + 1, label: 'SMD-0805', w: 34, h: 22 },
                  { id: Date.now() + 2, label: 'QFN-32', w: 38, h: 26 },
                  { id: Date.now() + 3, label: 'LM2596', w: 42, h: 28 },
                ];
              }
            } else if (s.dispatchPhase === 'sliding_in') {
              s.pcbSlideOffset += (0 - s.pcbSlideOffset) * 0.12;
              s.feederBeltOffset += dt * 45 * scale;
              if (Math.abs(s.pcbSlideOffset) < 1) {
                s.pcbSlideOffset = 0;
                s.dispatchPhase = 'idle';
                audioEngine.playMechanicalClick();
                go('select');
              }
            }
          }

          if (gripCommand !== isClamped) setIsClamped(gripCommand);
        } else if (s.mode === 'orbit') {
          // LIVE KINEMATICS TELEMETRY MODE
          if (s.trajTest) {
            // Precision Figure-8 / Circular Machining Trajectory Test
            const centerTx = baseX + g.maxReach * 0.62;
            const centerTy = baseY - 120 * scale;
            const rX = 70 * scale;
            const rY = 55 * scale;
            targetX = centerTx + Math.cos(t * 2.2) * rX;
            targetY = centerTy + Math.sin(t * 4.4) * 0.5 * rY;
          } else if (s.isHovering) {
            targetX = s.normX * width;
            targetY = s.normY * height;
          } else {
            // Elegant slow idle scan
            targetX = baseX + g.maxReach * 0.6 + Math.cos(t * 1.1) * 60 * scale;
            targetY = baseY - 110 * scale + Math.sin(t * 1.7) * 40 * scale;
          }
        } else {
          // CAD WIREFRAME MODE
          if (s.isHovering) {
            targetX = s.normX * width;
            targetY = s.normY * height;
          } else if (!reduceMotion) {
            targetX = baseX + g.maxReach * 0.64 + Math.cos(t * 0.85) * 50 * scale;
            targetY = baseY - 115 * scale + Math.sin(t * 1.3) * 35 * scale;
          }
        }

        // Smooth critically-damped spring kinematics
        const stiffness = s.mode === 'pick-place' ? 0.12 : 0.095;
        const damping = 0.82;
        const targetNormX = targetX / width;
        const targetNormY = targetY / height;
        s.velX = (s.velX + (targetNormX - s.smoothX) * stiffness) * damping;
        s.velY = (s.velY + (targetNormY - s.smoothY) * stiffness) * damping;
        s.smoothX += s.velX;
        s.smoothY += s.velY;
      }

      // Solve inverse kinematics for current smooth position
      const currentTargetX = s.smoothX * width;
      const currentTargetY = s.smoothY * height;
      const ik = solveIK(currentTargetX, currentTargetY);

      // Instantaneous speed calculation
      const distTraveled = Math.hypot(ik.tcpX - s.prevTcpX, ik.tcpY - s.prevTcpY);
      s.instantSpeed = dt > 0 ? (distTraveled / dt) * (scale > 0 ? 1 / scale : 1) : 0;
      s.prevTcpX = ik.tcpX;
      s.prevTcpY = ik.tcpY;

      // Update motion trail
      s.trail.push({ x: ik.tcpX, y: ik.tcpY, vel: s.instantSpeed });
      if (s.trail.length > 40) s.trail.shift();

      // Gripper Jaw Physics
      const jawTarget = s.clamped ? 0.95 : 0.15;
      s.smoothJaw += (jawTarget - s.smoothJaw) * 0.22;
      const jawGap = (1 - s.smoothJaw) * 10 * scale;

      // Throttle React state telemetry updates to 15fps
      telemetryThrottle += dt;
      if (telemetryThrottle > 0.065) {
        telemetryThrottle = 0;
        setTelemetry({
          theta1: Math.round((ik.theta1 * 180) / Math.PI),
          theta2: Math.round((ik.theta2 * 180) / Math.PI),
          theta3: Math.round((ik.wristAngle * 180) / Math.PI),
          tcpX: Math.round(ik.tcpX - baseX),
          tcpY: Math.round(baseY - ik.tcpY),
          vel: Math.round(s.instantSpeed),
          mode: s.mode,
        });
      }

      // =========================================================================
      // RENDERING PIPELINE (3 COMPLETELY DISTINCT VISUAL & FUNCTIONAL MODES)
      // =========================================================================
      ctx.clearRect(0, 0, width, height);

      // ----------------- 1. BASE TECHNICAL DRAFTING GRID -----------------
      if (s.mode === 'cursor') {
        // Blueprint CAD Grid: Crisp technical cyan grid with major/minor divisions
        ctx.strokeStyle = 'rgba(0, 180, 216, 0.08)';
        ctx.lineWidth = 1;
        const gridStep = 18 * scale;
        for (let x = 0; x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Major isometric guide lines
        ctx.strokeStyle = 'rgba(0, 180, 216, 0.14)';
        ctx.lineWidth = 1.2;
        for (let x = 0; x < width; x += gridStep * 4) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      } else {
        // Light industrial workshop grid
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 1;
        const gridStep = 22 * scale;
        for (let x = 0; x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // ----------------- 2. WORKCELL STATIONS & CONVEYORS -----------------
      if (s.mode === 'pick-place') {
        // DRAW PCB TARGET BAY (Center-Left)
        ctx.save();
        ctx.translate(s.pcbSlideOffset, 0);

        // PCB Circuit Board Substrate (FR4 Dark Emerald)
        const pcbX0 = pcbBaseX - pcbWidth / 2;
        const pcbY0 = pcbBaseY - pcbHeight / 2;

        ctx.fillStyle = '#0F2F20'; // Authentic FR4 Soldermask Green
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pcbX0, pcbY0, pcbWidth, pcbHeight, 4 * scale);
        ctx.fill();
        ctx.stroke();

        // PCB Gold Ground Plane Traces & Mounting Holes
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)'; // ENIG Gold Traces
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pcbX0 + 6 * scale, pcbY0 + 6 * scale);
        ctx.lineTo(pcbX0 + pcbWidth - 6 * scale, pcbY0 + 6 * scale);
        ctx.moveTo(pcbX0 + 6 * scale, pcbY0 + pcbHeight - 6 * scale);
        ctx.lineTo(pcbX0 + pcbWidth - 6 * scale, pcbY0 + pcbHeight - 6 * scale);
        ctx.stroke();

        // 4 Plated Mounting Screws
        [
          [pcbX0 + 6 * scale, pcbY0 + 6 * scale],
          [pcbX0 + pcbWidth - 6 * scale, pcbY0 + 6 * scale],
          [pcbX0 + 6 * scale, pcbY0 + pcbHeight - 6 * scale],
          [pcbX0 + pcbWidth - 6 * scale, pcbY0 + pcbHeight - 6 * scale],
        ].forEach(([cx, cy]) => {
          ctx.fillStyle = '#E5E7EB';
          ctx.beginPath();
          ctx.arc(cx, cy, 2.2 * scale, 0, Math.PI * 2);
          ctx.fill();
        });

        // 3 Solder Footprint Sockets
        const slotLabels = ['U1 (0805)', 'U2 (QFN)', 'U3 (REG)'];
        pcbSlotXPositions.forEach((sx, idx) => {
          const placedPart = s.pcbSlots[idx];
          const slotW = 38 * scale;
          const slotH = 24 * scale;
          const slX = sx - slotW / 2;
          const slY = pcbBaseY - slotH / 2;

          // Solder pads
          ctx.fillStyle = placedPart ? '#10B981' : '#D4AF37'; // Gold pads or soldered green
          ctx.fillRect(slX - 3 * scale, slY + 4 * scale, 2.5 * scale, slotH - 8 * scale);
          ctx.fillRect(slX + slotW + 0.5 * scale, slY + 4 * scale, 2.5 * scale, slotH - 8 * scale);

          // Silkscreen outline
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.strokeRect(slX, slY, slotW, slotH);

          if (placedPart) {
            // Render Populated Component
            ctx.fillStyle = '#18181B';
            ctx.fillRect(slX + 2 * scale, slY + 2 * scale, slotW - 4 * scale, slotH - 4 * scale);

            ctx.fillStyle = '#34D399';
            ctx.font = `700 ${Math.round(8 * scale)}px "Geist Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(placedPart.label, sx, pcbBaseY + 3 * scale);
          } else {
            // Silkscreen text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = `600 ${Math.round(7.5 * scale)}px "Geist Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(slotLabels[idx], sx, pcbBaseY + 3 * scale);
          }
        });

        // AOI Laser Scanner Sweep Animation
        if (s.aoiLaserActive) {
          const scanX = pcbX0 + s.aoiScanProgress * pcbWidth;
          const laserGrad = ctx.createLinearGradient(scanX - 12 * scale, 0, scanX + 4 * scale, 0);
          laserGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
          laserGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.45)');
          laserGrad.addColorStop(1, 'rgba(16, 185, 129, 0.95)');

          ctx.fillStyle = laserGrad;
          ctx.fillRect(scanX - 12 * scale, pcbY0 - 4 * scale, 14 * scale, pcbHeight + 8 * scale);

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(scanX, pcbY0 - 4 * scale);
          ctx.lineTo(scanX, pcbY0 + pcbHeight + 4 * scale);
          ctx.stroke();

          // Live AOI Inspection Status Badge
          ctx.fillStyle = '#10B981';
          ctx.font = `700 ${Math.round(9 * scale)}px "Geist Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('AOI 100% PASS · QC VERIFIED', pcbBaseX, pcbY0 - 10 * scale);
        } else {
          ctx.fillStyle = '#059669';
          ctx.font = `700 ${Math.round(8.5 * scale)}px "Geist Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('TARGET PCB SOCKET', pcbBaseX, pcbY0 - 8 * scale);
        }

        ctx.restore();

        // DRAW COMPONENT FEEDER CONVEYOR (Right Side)
        const fX0 = feederBaseX - feederWidth / 2;
        const fY0 = feederBaseY - feederHeight / 2;

        // Conveyor Rails
        ctx.fillStyle = '#262626';
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(fX0, fY0, feederWidth, feederHeight, 4 * scale);
        ctx.fill();
        ctx.stroke();

        // Conveyor motorized roller lines
        ctx.strokeStyle = '#525252';
        ctx.lineWidth = 1.2;
        const rollStep = 14 * scale;
        for (let rx = fX0 + (s.feederBeltOffset % rollStep); rx < fX0 + feederWidth; rx += rollStep) {
          ctx.beginPath();
          ctx.moveTo(rx, fY0 + 2 * scale);
          ctx.lineTo(rx, fY0 + feederHeight - 2 * scale);
          ctx.stroke();
        }

        // Optical Laser Presence Beam (Green sensor line)
        ctx.strokeStyle = s.feederParts.length > 0 ? '#10B981' : '#EF4444';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(feederPickX, fY0);
        ctx.lineTo(feederPickX, fY0 + feederHeight);
        ctx.stroke();

        ctx.fillStyle = s.feederParts.length > 0 ? '#10B981' : '#EF4444';
        ctx.font = `700 ${Math.round(8 * scale)}px "Geist Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(
          s.feederParts.length > 0 ? 'FEEDER: READY' : 'FEEDER: INDEXING',
          feederBaseX,
          fY0 - 8 * scale
        );

        // Draw queued parts on feeder conveyor
        s.feederParts.forEach((part, idx) => {
          const px = feederPickX + idx * 42 * scale;
          const py = feederBaseY;
          if (px > fX0 + feederWidth - 10 * scale) return;

          ctx.fillStyle = '#18181B';
          ctx.strokeStyle = '#E5E7EB';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(px - part.w / 2, py - part.h / 2, part.w, part.h, 3 * scale);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `700 ${Math.round(7.5 * scale)}px "Geist Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(part.label, px, py + 3 * scale);
        });

        // Draw currently held part at the gripper
        if (s.heldPart) {
          const hp = s.heldPart;
          ctx.save();
          ctx.translate(ik.tcpX, ik.tcpY);
          ctx.rotate(ik.wristAngle);
          ctx.fillStyle = '#18181B';
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-hp.w / 2, -hp.h / 2, hp.w, hp.h, 3 * scale);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#34D399';
          ctx.font = `700 ${Math.round(8 * scale)}px "Geist Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(hp.label, 0, 3 * scale);
          ctx.restore();
        }
      }

      // ----------------- 3. MOTION TRAIL (Live Kinematics & Wireframe) -----------------
      if (s.trail.length > 2) {
        ctx.beginPath();
        s.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });

        if (s.mode === 'cursor') {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([3, 3]);
        } else {
          const trailGrad = ctx.createLinearGradient(s.trail[0].x, s.trail[0].y, ik.tcpX, ik.tcpY);
          trailGrad.addColorStop(0, 'rgba(255, 92, 0, 0)');
          trailGrad.addColorStop(1, s.clamped ? 'rgba(16, 185, 129, 0.85)' : 'rgba(255, 92, 0, 0.9)');
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = 2.2;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ----------------- 4. ROBOT BASE PEDESTAL -----------------
      // Realistic Heavy Industrial Flanged Base
      ctx.save();
      if (s.mode === 'cursor') {
        // Wireframe Base
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(baseX - 32 * scale, baseY, 64 * scale, 14 * scale);
        ctx.strokeRect(baseX - 22 * scale, baseY - 8 * scale, 44 * scale, 8 * scale);
      } else {
        // Heavy CNC Anodized Mounting Plate
        ctx.fillStyle = '#1A1A1E';
        ctx.strokeStyle = '#3F3F46';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(baseX - 34 * scale, baseY, 68 * scale, 16 * scale, 3 * scale);
        ctx.fill();
        ctx.stroke();

        // Upper Servo Turret Hub
        ctx.fillStyle = '#27272A';
        ctx.beginPath();
        ctx.roundRect(baseX - 22 * scale, baseY - 8 * scale, 44 * scale, 9 * scale, 2 * scale);
        ctx.fill();
        ctx.stroke();

        // Anchor Bolts
        [-24, -10, 10, 24].forEach((off) => {
          ctx.fillStyle = '#71717A';
          ctx.beginPath();
          ctx.arc(baseX + off * scale, baseY + 8 * scale, 2.2 * scale, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.restore();

      // ----------------- 5. ROBOT ARMS & KINEMATIC LINKS -----------------
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
          // =================== MODE 1: CAD WIREFRAME BLUEPRINT ===================
          // Translucent chassis fill
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

          // Internal CAD lightening truss ribs (aerospace hollowed link)
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
          ctx.lineWidth = 1;
          ctx.strokeRect(midX - 12 * scale, midY - 6 * scale, 24 * scale, 12 * scale);

          // Neutral Bending Centerline (ISO Dash-Dot)
          ctx.strokeStyle = '#FF5C00';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([8, 3, 2, 3]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // =================== MODE 2 & 3: CNC MACHINED ANODIZED SOLID ===================
          // Deep graphite chassis
          ctx.fillStyle = '#18181B';
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineTo(p3x, p3y);
          ctx.lineTo(p4x, p4y);
          ctx.closePath();
          ctx.fill();

          // Chamfered Metallic Edge
          ctx.strokeStyle = '#3F3F46';
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Inset carbon/aluminum faceplate
          ctx.fillStyle = '#27272A';
          const inW1 = w1 * 0.65;
          const inW2 = w2 * 0.65;
          ctx.beginPath();
          ctx.moveTo(x1 + c * (inW1 / 2), y1 + sn * (inW1 / 2));
          ctx.lineTo(x1 - c * (inW1 / 2), y1 - sn * (inW1 / 2));
          ctx.lineTo(x2 - c * (inW2 / 2), y2 - sn * (inW2 / 2));
          ctx.lineTo(x2 + c * (inW2 / 2), y2 + sn * (inW2 / 2));
          ctx.closePath();
          ctx.fill();

          // Hairline highlight
          ctx.strokeStyle = '#52525B';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      };

      // Draw 3 Kinematic Links
      drawLink(baseX, baseY, ik.elbowX, ik.elbowY, 28 * scale, 22 * scale);
      drawLink(ik.elbowX, ik.elbowY, ik.wristX, ik.wristY, 22 * scale, 18 * scale);
      drawLink(ik.wristX, ik.wristY, ik.tcpX, ik.tcpY, 16 * scale, 14 * scale);

      // ----------------- 6. KINEMATIC PIVOTS & COORDINATE FRAMES -----------------
      const drawCoordinateFrame = (x: number, y: number, angle: number, label: string) => {
        const axisLen = 22 * scale;
        // X-Axis (Red)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(axisLen, 0);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(axisLen, 0);
        ctx.lineTo(axisLen - 5 * scale, -3 * scale);
        ctx.lineTo(axisLen - 5 * scale, 3 * scale);
        ctx.fill();

        // Y-Axis (Green)
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -axisLen);
        ctx.stroke();

        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.moveTo(0, -axisLen);
        ctx.lineTo(-3 * scale, -axisLen + 5 * scale);
        ctx.lineTo(3 * scale, -axisLen + 5 * scale);
        ctx.fill();

        ctx.fillStyle = '#00F0FF';
        ctx.font = `700 ${Math.round(8.5 * scale)}px "Geist Mono", monospace`;
        ctx.fillText(label, 6 * scale, -8 * scale);
        ctx.restore();
      };

      const drawPivot = (
        px: number,
        py: number,
        radius: number,
        angleDeg: number,
        jointLabel: string
      ) => {
        ctx.save();
        if (s.mode === 'cursor') {
          // CAD Wireframe Concentric Circles
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(px, py, radius * 0.45, 0, Math.PI * 2);
          ctx.stroke();

          // Angle dimension callout
          ctx.fillStyle = '#FF5C00';
          ctx.font = `700 ${Math.round(9.5 * scale)}px "Geist Mono", monospace`;
          ctx.fillText(`${jointLabel}: ${angleDeg}°`, px + radius + 4 * scale, py + 3 * scale);
        } else {
          // Anodized Rotary Actuator Hub
          ctx.fillStyle = '#18181B';
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#71717A';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Safety Orange Center LED
          ctx.fillStyle = '#FF5C00';
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.38, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#111111';
          ctx.font = `700 ${Math.round(9 * scale)}px "Geist Mono", monospace`;
          ctx.fillText(`${jointLabel} ${angleDeg}°`, px + radius + 5 * scale, py + 3 * scale);
        }
        ctx.restore();
      };

      // Draw Pivots
      drawPivot(baseX, baseY, 13 * scale, Math.round((ik.theta1 * 180) / Math.PI), 'θ1');
      drawPivot(ik.elbowX, ik.elbowY, 10 * scale, Math.round(((ik.theta2 - ik.theta1) * 180) / Math.PI), 'θ2');
      drawPivot(ik.wristX, ik.wristY, 7 * scale, Math.round((ik.wristAngle * 180) / Math.PI), 'θ3');

      // Draw Coordinate Frames in CAD Wireframe Mode
      if (s.mode === 'cursor') {
        drawCoordinateFrame(baseX, baseY, 0, '{0}');
        drawCoordinateFrame(ik.elbowX, ik.elbowY, ik.theta1, '{1}');
        drawCoordinateFrame(ik.wristX, ik.wristY, ik.theta2, '{2}');
        drawCoordinateFrame(ik.tcpX, ik.tcpY, ik.wristAngle, '{TCP}');

        // CAD Dimension Callouts
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        // Horizontal X-dimension line
        ctx.beginPath();
        ctx.moveTo(baseX, baseY + 18 * scale);
        ctx.lineTo(ik.tcpX, baseY + 18 * scale);
        ctx.stroke();

        ctx.fillStyle = '#00F0FF';
        ctx.font = `600 ${Math.round(8.5 * scale)}px "Geist Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`ΔX: ${(ik.tcpX - baseX).toFixed(1)}mm`, (baseX + ik.tcpX) / 2, baseY + 30 * scale);

        // Vertical Y-dimension line
        ctx.beginPath();
        ctx.moveTo(baseX - 24 * scale, baseY);
        ctx.lineTo(baseX - 24 * scale, ik.tcpY);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillText(`ΔY: ${(baseY - ik.tcpY).toFixed(1)}mm`, baseX - 28 * scale, (baseY + ik.tcpY) / 2);
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ----------------- 7. END-EFFECTOR PARALLEL GRIPPER JAWS -----------------
      ctx.save();
      ctx.translate(ik.tcpX, ik.tcpY);
      ctx.rotate(ik.wristAngle);

      if (s.mode === 'cursor') {
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.5;
        // Upper Jaw Wireframe
        ctx.strokeRect(0, -9 * scale - jawGap, 16 * scale, 3.5 * scale);
        // Lower Jaw Wireframe
        ctx.strokeRect(0, 5.5 * scale + jawGap, 16 * scale, 3.5 * scale);
      } else {
        ctx.fillStyle = '#18181B';
        ctx.strokeStyle = s.clamped ? '#10B981' : '#111111';
        ctx.lineWidth = 1.4;

        // Upper Jaw
        ctx.beginPath();
        ctx.rect(0, -10 * scale - jawGap, 18 * scale, 4 * scale);
        ctx.fill();
        ctx.stroke();

        // Lower Jaw
        ctx.beginPath();
        ctx.rect(0, 6 * scale + jawGap, 18 * scale, 4 * scale);
        ctx.fill();
        ctx.stroke();

        // Laser Crosshair
        ctx.strokeStyle = s.clamped ? '#10B981' : '#FF5C00';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(gripDist - 8 * scale, 0);
        ctx.lineTo(gripDist + 8 * scale, 0);
        ctx.stroke();
      }
      ctx.restore();

      // ----------------- 8. VELOCITY VECTOR HUD IN LIVE KINEMATICS -----------------
      if (s.mode === 'orbit' && s.instantSpeed > 8) {
        ctx.save();
        const velScale = Math.min(60 * scale, s.instantSpeed * 0.18 * scale);
        const velAngle = Math.atan2(ik.tcpY - s.prevTcpY, ik.tcpX - s.prevTcpX);

        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(ik.tcpX, ik.tcpY);
        ctx.lineTo(ik.tcpX + Math.cos(velAngle) * velScale, ik.tcpY + Math.sin(velAngle) * velScale);
        ctx.stroke();

        ctx.fillStyle = '#10B981';
        ctx.font = `700 ${Math.round(8.5 * scale)}px "Geist Mono", monospace`;
        ctx.fillText(
          `v: ${Math.round(s.instantSpeed)} mm/s`,
          ik.tcpX + Math.cos(velAngle) * velScale + 4,
          ik.tcpY + Math.sin(velAngle) * velScale
        );
        ctx.restore();
      }

      // ----------------- 9. EMERGENCY STOP OVERLAY (If Engaged) -----------------
      if (s.eStopped) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#DC2626';
        ctx.font = `700 ${Math.round(14 * scale)}px "Geist Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('⚠ EMERGENCY STOP ACTIVATED · MOTORS HALTED ⚠', width / 2, height * 0.48);

        ctx.font = `600 ${Math.round(10 * scale)}px "Geist Mono", monospace`;
        ctx.fillStyle = '#111111';
        ctx.fillText('CLICK E-STOP SWITCH TO RELEASE BRAKES', width / 2, height * 0.48 + 24 * scale);
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
    s.normY = Math.max(0.12, Math.min(0.88, y));
    s.isHovering = true;
  };

  const handleModeChange = (mode: ArmControlMode) => {
    audioEngine.playRelayClick();
    setArmMode(mode);
    setIsTrajectoryTest(false);
    if (mode !== 'pick-place') {
      setIsClamped(false);
    }
  };

  const toggleGrip = () => {
    audioEngine.playRelayClick();
    if (armMode === 'pick-place') return;
    setIsClamped((prev) => !prev);
  };

  const toggleEStop = () => {
    audioEngine.playMechanicalClick();
    setIsEStopped((prev) => !prev);
  };

  const toggleTrajectoryTest = () => {
    audioEngine.playRelayClick();
    setIsTrajectoryTest((prev) => !prev);
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
                aria-label="Aakash Sharma — Robotics Engineer & Autonomous Systems"
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
            aria-label="Interactive robotic arm. Move pointer to control manipulator; toggle modes or click to operate gripper."
            onMouseMove={(e) => setPointer(e.clientX, e.clientY)}
            onMouseLeave={() => (stateRef.current.isHovering = false)}
            onTouchStart={(e) =>
              e.touches[0] && setPointer(e.touches[0].clientX, e.touches[0].clientY)
            }
            onTouchMove={(e) =>
              e.touches[0] && setPointer(e.touches[0].clientX, e.touches[0].clientY)
            }
            onClick={toggleGrip}
            onBlur={() => (stateRef.current.isHovering = false)}
            data-dmm-target="manipulator"
            className="relative h-[360px] sm:h-[440px] w-full rounded-xl bg-[#E8E8E5] border border-[#D0D0CB] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9),0_12px_32px_-12px_rgba(0,0,0,0.08)] overflow-hidden cursor-crosshair select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500]"
          >
            <CornerCrosshairs type="crosshair" />

            {/* Top Control Strip: Authentic Industrial Hardware Buttons */}
            <div className="relative z-10 px-4 sm:px-6 pt-3.5 sm:pt-4 flex flex-wrap items-center justify-between gap-3 bg-[#DFDFDC]/80 border-b border-[#D0D0CA] pb-3 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 pointer-events-none min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#FF5500] shadow-[0_0_6px_#FF5500] shrink-0 animate-pulse" />
                <span className="font-sans text-xs font-bold text-[#111111] uppercase tracking-wider truncate">
                  Articulated Manipulator &amp; Gripper Stage
                </span>
                <span className="font-mono text-[9px] font-bold text-white uppercase px-2 py-0.5 rounded bg-[#111111] shadow-sm">
                  REV 4.0
                </span>
              </div>

              {/* Physical Rocker Switch Buttons + Tactile Controls */}
              <div
                className="flex flex-wrap items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="hidden sm:flex items-center gap-2 pr-1">
                  <TactileDial color="orange" size={20} rotation={35} label="CALIB" />
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

                {/* Live Kinematics Special: Automated Trajectory Test Button */}
                {armMode === 'orbit' && (
                  <button
                    type="button"
                    onClick={toggleTrajectoryTest}
                    className={`font-mono text-xs font-bold uppercase px-2.5 py-1.5 rounded transition-all shadow-sm ${
                      isTrajectoryTest
                        ? 'bg-[#10B981] text-white shadow-[0_2px_0_#059669]'
                        : 'bg-[#DFDFDC] text-[#333330] border border-[#C8C8C2] hover:bg-[#EAEAE7]'
                    }`}
                  >
                    {isTrajectoryTest ? 'Trajectory: Active' : 'Test Contour'}
                  </button>
                )}

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

                {/* Industrial Emergency Stop (E-STOP) Button */}
                <button
                  type="button"
                  aria-pressed={isEStopped}
                  onClick={toggleEStop}
                  title="Industrial Safety Emergency Stop"
                  className={`px-2.5 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all shadow-sm flex items-center gap-1 cursor-pointer ${
                    isEStopped
                      ? 'bg-[#DC2626] text-white animate-pulse shadow-[0_2px_0_#991B1B]'
                      : 'bg-[#DFDFDC] text-[#DC2626] border border-[#DC2626]/40 hover:bg-[#FEE2E2]'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
                  <span>{isEStopped ? 'E-STOPPED' : 'E-STOP'}</span>
                </button>
              </div>
            </div>

            {/* Live Kinematic Telemetry HUD (Top-Right Floating Overlay) */}
            <div className="absolute top-16 right-4 sm:right-6 z-10 pointer-events-none flex flex-col items-end gap-1 font-mono text-[10px]">
              <div className="bg-[#18181B]/85 text-white backdrop-blur-md px-3 py-1.5 rounded border border-[#3F3F46] shadow-sm flex items-center gap-3">
                <span className="text-[#38BDF8] font-bold">
                  θ1: {telemetry.theta1}° | θ2: {telemetry.theta2}° | θ3: {telemetry.theta3}°
                </span>
                <span className="text-[#A1A1AA]">
                  TCP [X: {telemetry.tcpX}mm, Y: {telemetry.tcpY}mm]
                </span>
                {armMode === 'orbit' && (
                  <span className="text-[#10B981] font-bold">
                    v: {telemetry.vel} mm/s
                  </span>
                )}
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
                <span className="truncate">
                  {armMode === 'cursor'
                    ? 'CAD Wireframe Mode · Real-Time Analytical Inverse Kinematics · Coordinate Frames {0,1,2,TCP}'
                    : armMode === 'orbit'
                    ? 'Live Kinematics Mode · Dynamic Velocity Vector · Forward Kinematics Telemetry'
                    : 'Autonomous SMT Assembly Workcell · Feeder Track · PCB Placement · Automated Optical Inspection'}
                </span>
              </span>

              <span className="font-mono text-[10px] text-[#666662] font-medium hidden sm:inline shrink-0 bg-[#DFDFDC]/80 px-2.5 py-1 rounded border border-[#C8C8C2]">
                {armMode === 'pick-place'
                  ? 'Continuous SMT Assembly Cycle with Automated Optical Inspection'
                  : 'Move cursor to guide arm · Tap stage to grip/release'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

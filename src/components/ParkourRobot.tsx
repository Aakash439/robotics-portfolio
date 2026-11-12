import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audio';

/**
 * Procedural 2D Parkour & Freerunning Robot Companion
 *
 * Architecture:
 * 1. Dynamic DOM Colliders: queries [data-parkour-surface], header, article, section,
 *    supporting flat & tilted surfaces (e.g. the orange "aakash." banner) via CSS transform extraction.
 * 2. 12-Joint Articulated Skeleton with Analytical 2-Bone Inverse Kinematics (IK)
 *    for legs (hip->knee->foot) and arms (shoulder->elbow->hand).
 * 3. Stance-Lock Foot Placement along surface normals (zero foot sliding).
 * 4. Harmonic Secondary Physics: spring torso lean, mouse-tracking head, and arm balance.
 * 5. Full Parkour State Machine: IDLE, RUN/SPRINT, PRE_JUMP, AIRBORNE (with mid-air flips),
 *    LEDGE_GRAB (pendulum hang & mantle climb), WALL_SLIDE (friction sparks), and LANDING_ROLL.
 * 6. High-Performance Canvas: clamped dt (<=0.033s), motion trails, and dust puff particles.
 */

// -------------------------------------------------------------
// TYPES & DATA STRUCTURES
// -------------------------------------------------------------

type BotState =
  | 'IDLE'
  | 'RUN'
  | 'PRE_JUMP'
  | 'AIRBORNE'
  | 'LEDGE_GRAB'
  | 'CLIMB_UP'
  | 'WALL_SLIDE'
  | 'LANDING_ROLL'
  | 'LANDING_SQUASH';

interface Surface {
  id: string;
  x0: number;
  x1: number;
  y0: number; // height at x0
  y1: number; // height at x1
  angle: number; // in radians
  leftWallX: number;
  rightWallX: number;
  top: number;
  bottom: number;
  normalX: number;
  normalY: number;
  tangentX: number;
  tangentY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  isDust?: boolean;
}

interface TrailPoint {
  x: number;
  y: number;
  angle: number;
  alpha: number;
}

interface FootState {
  x: number;
  y: number;
  plantedX: number;
  plantedY: number;
  isPlanted: boolean;
  swingProgress: number; // 0..1
  swingStartX: number;
  swingStartY: number;
  swingTargetX: number;
  swingTargetY: number;
}

// -------------------------------------------------------------
// TWO-BONE INVERSE KINEMATICS SOLVER
// -------------------------------------------------------------
/**
 * Analytical Two-Bone Inverse Kinematics Solver
 * @param r1 Length of upper bone (e.g. thigh / bicep)
 * @param r2 Length of lower bone (e.g. shin / forearm)
 * @param bendDir +1 for forward/natural knee, -1 for reverse
 */
function solve2BoneIK(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r1: number,
  r2: number,
  bendDir: number
): { midX: number; midY: number; reached: boolean } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);

  // Clamp distance to avoid NaN in acos
  const minD = Math.abs(r1 - r2) + 0.001;
  const maxD = (r1 + r2) * 0.998;
  const clampedD = Math.max(minD, Math.min(maxD, d));

  const baseAngle = Math.atan2(dy, dx);
  const cosAlpha = (r1 * r1 + clampedD * clampedD - r2 * r2) / (2 * r1 * clampedD);
  const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));
  const midAngle = baseAngle + bendDir * alpha;

  return {
    midX: x1 + Math.cos(midAngle) * r1,
    midY: y1 + Math.sin(midAngle) * r1,
    reached: d <= maxD,
  };
}

export const ParkourRobot: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Disable on touch devices or reduced motion to preserve battery and accessibility
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let running = true;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', resize);
    resize();

    // -------------------------------------------------------------
    // DOM COLLIDER SCANNER (Supports Tilted Surfaces)
    // -------------------------------------------------------------
    const scanSurfaces = (): Surface[] => {
      const surfaces: Surface[] = [];
      const defaultFloorY = height - 24;

      // Query elements with parkour surface tags, sections, articles, and headers
      const elements = document.querySelectorAll(
        '[data-parkour-surface], header, article, [data-dmm-target], section'
      );

      elements.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        // Ignore hidden or microscopic elements
        if (rect.width < 60 || rect.height < 15) return;
        // Ignore elements completely off screen vertically
        if (rect.bottom < 40 || rect.top > height + 60) return;

        // Extract CSS transform rotation (for tilted elements like the orange "aakash." banner)
        let angle = 0;
        try {
          const style = window.getComputedStyle(el);
          const transform = style.transform;
          if (transform && transform !== 'none') {
            const match = transform.match(/^matrix\((.+)\)$/);
            if (match) {
              const values = match[1].split(',').map(parseFloat);
              // matrix(a, b, c, d, tx, ty) -> rotation = atan2(b, a)
              angle = Math.atan2(values[1], values[0]);
            }
          }
        } catch {
          angle = 0;
        }

        const tag = el.getAttribute('data-parkour-surface') || `elem-${idx}`;

        // Top surface line segment
        let x0 = Math.max(10, rect.left);
        let x1 = Math.min(width - 10, rect.right);
        let y0 = rect.top;
        let y1 = rect.top;

        if (Math.abs(angle) > 0.01) {
          // Calculate tilted endpoints
          const cy = (rect.top + rect.bottom) / 2;
          const halfW = rect.width / 2;
          const sinA = Math.sin(angle);
          // Top edge rotated
          y0 = cy - halfW * sinA;
          y1 = cy + halfW * sinA;
        }

        const normalX = -Math.sin(angle);
        const normalY = -Math.cos(angle);
        const tangentX = Math.cos(angle);
        const tangentY = Math.sin(angle);

        surfaces.push({
          id: tag,
          x0,
          x1,
          y0,
          y1,
          angle,
          leftWallX: rect.left,
          rightWallX: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          normalX,
          normalY,
          tangentX,
          tangentY,
        });
      });

      // Default baseline floor at screen bottom
      surfaces.push({
        id: 'viewport-floor',
        x0: 10,
        x1: width - 10,
        y0: defaultFloorY,
        y1: defaultFloorY,
        angle: 0,
        leftWallX: 10,
        rightWallX: width - 10,
        top: defaultFloorY,
        bottom: defaultFloorY + 20,
        normalX: 0,
        normalY: -1,
        tangentX: 1,
        tangentY: 0,
      });

      return surfaces;
    };

    let surfaces = scanSurfaces();
    let surfaceScanTimer = 0;

    /**
     * Compute height of a surface at given X coordinate
     */
    const getSurfaceHeightAt = (s: Surface, px: number): number => {
      if (s.x1 === s.x0) return s.y0;
      const t = Math.max(0, Math.min(1, (px - s.x0) / (s.x1 - s.x0)));
      return s.y0 + t * (s.y1 - s.y0);
    };

    /**
     * Find nearest surface directly below given (px, py)
     */
    const findSurfaceBelow = (px: number, py: number): Surface => {
      let closest: Surface | null = null;
      let minDy = Infinity;

      for (const s of surfaces) {
        if (px >= s.x0 - 25 && px <= s.x1 + 25) {
          const sy = getSurfaceHeightAt(s, px);
          const dy = sy - py;
          if (dy >= -6 && dy < minDy) {
            minDy = dy;
            closest = s;
          }
        }
      }

      return (
        closest || {
          id: 'viewport-floor',
          x0: 10,
          x1: width - 10,
          y0: height - 24,
          y1: height - 24,
          angle: 0,
          leftWallX: 10,
          rightWallX: width - 10,
          top: height - 24,
          bottom: height,
          normalX: 0,
          normalY: -1,
          tangentX: 1,
          tangentY: 0,
        }
      );
    };

    // -------------------------------------------------------------
    // ROBOT ENTITY STATE
    // -------------------------------------------------------------
    const GRAVITY = 680; // px / s^2

    // Bone lengths (proportional stickman)
    const THIGH_LEN = 11;
    const SHIN_LEN = 11;
    const UPPER_ARM_LEN = 9;
    const FOREARM_LEN = 9;
    const TORSO_LEN = 15;
    const HEAD_RADIUS = 5.2;

    const bot = {
      // World position of Pelvis / Base
      x: Math.min(width * 0.72, width - 120),
      y: 180,
      vx: 60,
      vy: 0,
      facing: 1 as 1 | -1,
      targetFacing: 1 as 1 | -1,

      // State machine
      state: 'RUN' as BotState,
      stateTimer: 0,
      preJumpTimer: 0,

      // Surfaces
      currentSurface: null as Surface | null,
      targetSurface: null as Surface | null,

      // Secondary spring motion
      torsoLean: 0,
      torsoLeanVel: 0,
      headAngle: 0,
      headAngleVel: 0,
      squashScaleY: 1,

      // Mid-air flip physics
      flipAngle: 0,
      flipAngularVel: 0,
      jumpPeakY: 0,
      jumpStartY: 0,

      // Wall slide & ledge grab state
      grabCornerX: 0,
      grabCornerY: 0,
      grabSide: 1 as 1 | -1,
      dangleAngle: 0,
      dangleVel: 0,

      // Stance-Lock Foot Placement
      leftFoot: {
        x: 0,
        y: 0,
        plantedX: 0,
        plantedY: 0,
        isPlanted: true,
        swingProgress: 0,
        swingStartX: 0,
        swingStartY: 0,
        swingTargetX: 0,
        swingTargetY: 0,
      } as FootState,
      rightFoot: {
        x: 0,
        y: 0,
        plantedX: 0,
        plantedY: 0,
        isPlanted: true,
        swingProgress: 0.5,
        swingStartX: 0,
        swingStartY: 0,
        swingTargetX: 0,
        swingTargetY: 0,
      } as FootState,
      walkPhase: 0,

      // Particles & visual FX
      particles: [] as Particle[],
      motionTrails: [] as TrailPoint[],
    };

    // Initialize bot on top of nearest surface
    const initialSurface = findSurfaceBelow(bot.x, bot.y);
    bot.currentSurface = initialSurface;
    bot.y = getSurfaceHeightAt(initialSurface, bot.x);
    bot.leftFoot.x = bot.x - 4;
    bot.leftFoot.y = bot.y;
    bot.leftFoot.plantedX = bot.leftFoot.x;
    bot.leftFoot.plantedY = bot.leftFoot.y;
    bot.rightFoot.x = bot.x + 4;
    bot.rightFoot.y = bot.y;
    bot.rightFoot.plantedX = bot.rightFoot.x;
    bot.rightFoot.plantedY = bot.rightFoot.y;

    // Mouse tracking for head look-at
    const mouse = { x: width * 0.5, y: height * 0.3, active: false };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Scroll delta tracking for inertia & parkour jumps
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let timeSinceLastScroll = 10;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const dy = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      scrollVelocity = dy;
      timeSinceLastScroll = 0;

      // Refresh surface bounding boxes dynamically on scroll
      surfaces = scanSurfaces();

      // Apply vertical scroll delta to character physics
      if (bot.state === 'IDLE' || bot.state === 'RUN') {
        if (Math.abs(dy) > 14) {
          // Trigger dynamic parkour leap toward next card/surface
          triggerAdaptiveJump(dy > 0 ? 'down' : 'up');
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Spawn dust puff helper
    const spawnDustPuff = (x: number, y: number, count = 4, vxBias = 0) => {
      for (let i = 0; i < count; i++) {
        bot.particles.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y - 1,
          vx: (Math.random() - 0.5) * 40 + vxBias,
          vy: -15 - Math.random() * 35,
          life: 0,
          maxLife: 0.35 + Math.random() * 0.25,
          color: '#A1A1AA',
          size: 1.6 + Math.random() * 2,
          isDust: true,
        });
      }
    };

    // Spawn friction sparks helper
    const spawnSparks = (x: number, y: number, count = 5, dirX = 1) => {
      for (let i = 0; i < count; i++) {
        const ang = (Math.random() - 0.5) * 1.2 + (dirX > 0 ? 0 : Math.PI);
        const spd = 60 + Math.random() * 110;
        bot.particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 30,
          life: 0,
          maxLife: 0.25 + Math.random() * 0.2,
          color: Math.random() > 0.4 ? '#FF5C00' : '#FFD60A',
          size: 1.2 + Math.random() * 1.4,
          isDust: false,
        });
      }
    };

    // Parabolic leap calculation between platforms
    const triggerAdaptiveJump = (direction: 'down' | 'up' | 'forward') => {
      if (bot.state === 'AIRBORNE' || bot.state === 'PRE_JUMP') return;

      let candidate: Surface | null = null;
      if (direction === 'down') {
        // Find next platform below
        candidate = surfaces.find(
          (s) => s.y0 > bot.y + 25 && s.x1 > 40 && s.x0 < width - 40
        ) || null;
      } else if (direction === 'up') {
        // Find platform above
        const aboveSurfaces = surfaces
          .filter((s) => s.y0 < bot.y - 25 && s.x1 > 40 && s.x0 < width - 40)
          .sort((a, b) => b.y0 - a.y0);
        candidate = aboveSurfaces[0] || null;
      }

      if (!candidate) {
        // Default forward jump
        candidate = bot.currentSurface;
      }

      bot.targetSurface = candidate;
      bot.state = 'PRE_JUMP';
      bot.preJumpTimer = 0.06; // 3-4 frames anticipation crouch
      bot.squashScaleY = 0.7; // anticipation squash
    };

    // Click canvas / screen: poke character to do a stylish parkour high jump
    const onClick = (e: MouseEvent) => {
      const clickDist = Math.hypot(e.clientX - bot.x, e.clientY - (bot.y - 15));
      if (clickDist < 60) {
        audioEngine.playMechanicalClick();
        triggerAdaptiveJump('up');
      }
    };
    window.addEventListener('click', onClick);

    // -------------------------------------------------------------
    // MAIN PHYSICS & KINEMATICS ANIMATION LOOP
    // -------------------------------------------------------------
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (!running) return;

      // Clamped delta time (dt <= 0.033s) to prevent physics explosions
      const rawDt = (now - lastTime) * 0.001;
      lastTime = now;
      const dt = Math.min(rawDt, 0.033);

      timeSinceLastScroll += dt;
      scrollVelocity *= 0.88;

      // Periodic refresh of surfaces
      surfaceScanTimer += dt;
      if (surfaceScanTimer > 0.8) {
        surfaceScanTimer = 0;
        surfaces = scanSurfaces();
      }

      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 1. STATE MACHINE & PHYSICS INTEGRATION
      // -------------------------------------------------------------
      bot.stateTimer += dt;

      // Update current surface if grounded
      if (bot.state === 'IDLE' || bot.state === 'RUN' || bot.state === 'LANDING_SQUASH') {
        if (!bot.currentSurface) {
          bot.currentSurface = findSurfaceBelow(bot.x, bot.y);
        }
        const surfY = getSurfaceHeightAt(bot.currentSurface, bot.x);
        bot.y = surfY;
        bot.vy = 0;
      }

      // STATE: PRE_JUMP (Anticipation Crouch)
      if (bot.state === 'PRE_JUMP') {
        bot.preJumpTimer -= dt;
        bot.squashScaleY = 0.65; // crouch
        bot.vx *= 0.8;

        if (bot.preJumpTimer <= 0) {
          // Launch into AIRBORNE!
          bot.state = 'AIRBORNE';
          bot.stateTimer = 0;
          bot.jumpStartY = bot.y;
          bot.jumpPeakY = bot.y;
          bot.squashScaleY = 1.25; // launch stretch

          // Parabolic velocity calculation
          if (bot.targetSurface) {
            const targetX = Math.max(
              bot.targetSurface.x0 + 30,
              Math.min(bot.targetSurface.x1 - 30, bot.x + bot.facing * 120)
            );
            const targetY = getSurfaceHeightAt(bot.targetSurface, targetX);
            const dy = targetY - bot.y;
            const dx = targetX - bot.x;

            if (dy < -20) {
              // High upward leap
              bot.vy = -Math.sqrt(2 * GRAVITY * Math.min(240, Math.abs(dy) + 40));
              const tUp = Math.abs(bot.vy) / GRAVITY;
              const hPeak = (bot.vy * bot.vy) / (2 * GRAVITY);
              const tDown = Math.sqrt((2 * (hPeak + dy)) / GRAVITY);
              const totalTime = Math.max(0.3, tUp + tDown);
              bot.vx = dx / totalTime;
            } else {
              // Level or downward vault
              bot.vy = -180;
              bot.vx = bot.facing * (140 + Math.random() * 60);
            }
          } else {
            bot.vy = -260;
            bot.vx = bot.facing * 160;
          }

          bot.facing = bot.vx >= 0 ? 1 : -1;
          spawnDustPuff(bot.x, bot.y, 6, -bot.vx * 0.1);
        }
      }

      // STATE: AIRBORNE (Ballistic flight, tucks, ledge grabs)
      else if (bot.state === 'AIRBORNE') {
        // Integrate gravity and velocity
        bot.x += bot.vx * dt;
        bot.y += bot.vy * dt;
        bot.vy += GRAVITY * dt;

        if (bot.y < bot.jumpPeakY) {
          bot.jumpPeakY = bot.y;
        }

        const jumpHeight = bot.jumpStartY - bot.jumpPeakY;

        // Mid-air flip/tuck if jump height exceeds 130px
        if (jumpHeight > 130 || Math.abs(bot.vy) > 240) {
          bot.flipAngle += bot.facing * 12 * dt;
        } else {
          bot.flipAngle *= 0.9;
        }

        // Motion trails on fast leaps
        if (Math.hypot(bot.vx, bot.vy) > 220) {
          bot.motionTrails.push({
            x: bot.x,
            y: bot.y,
            angle: bot.flipAngle,
            alpha: 0.45,
          });
        }

        // Check for Ledge Grab on nearby card corners
        if (bot.vy > -60) {
          for (const s of surfaces) {
            // Check left top corner
            const dLeft = Math.hypot(bot.x - s.x0, bot.y - s.y0);
            if (dLeft < 22 && bot.vx > 0) {
              bot.state = 'LEDGE_GRAB';
              bot.stateTimer = 0;
              bot.grabCornerX = s.x0;
              bot.grabCornerY = s.y0;
              bot.grabSide = -1; // hanging on left edge
              bot.facing = 1;
              bot.dangleAngle = 0.5;
              bot.dangleVel = 0;
              bot.flipAngle = 0;
              spawnSparks(s.x0, s.y0, 4, 1);
              break;
            }
            // Check right top corner
            const dRight = Math.hypot(bot.x - s.x1, bot.y - s.y1);
            if (dRight < 22 && bot.vx < 0) {
              bot.state = 'LEDGE_GRAB';
              bot.stateTimer = 0;
              bot.grabCornerX = s.x1;
              bot.grabCornerY = s.y1;
              bot.grabSide = 1; // hanging on right edge
              bot.facing = -1;
              bot.dangleAngle = -0.5;
              bot.dangleVel = 0;
              bot.flipAngle = 0;
              spawnSparks(s.x1, s.y1, 4, -1);
              break;
            }
          }
        }

        // Check for Wall Slide along tall card edges
        if (bot.state === 'AIRBORNE' && bot.vy > 80) {
          for (const s of surfaces) {
            if (
              bot.y > s.top + 10 &&
              bot.y < s.bottom - 20 &&
              Math.abs(bot.x - s.leftWallX) < 12 &&
              bot.vx >= -10
            ) {
              bot.state = 'WALL_SLIDE';
              bot.stateTimer = 0;
              bot.x = s.leftWallX - 4;
              bot.facing = 1;
              bot.vy = Math.min(bot.vy, 120); // friction limit
              bot.flipAngle = 0;
              break;
            } else if (
              bot.y > s.top + 10 &&
              bot.y < s.bottom - 20 &&
              Math.abs(bot.x - s.rightWallX) < 12 &&
              bot.vx <= 10
            ) {
              bot.state = 'WALL_SLIDE';
              bot.stateTimer = 0;
              bot.x = s.rightWallX + 4;
              bot.facing = -1;
              bot.vy = Math.min(bot.vy, 120);
              bot.flipAngle = 0;
              break;
            }
          }
        }

        // Landing collision with surfaces
        if (bot.state === 'AIRBORNE' && bot.vy > 0) {
          const below = findSurfaceBelow(bot.x, bot.y);
          const surfY = getSurfaceHeightAt(below, bot.x);

          if (bot.y >= surfY - 4) {
            // Touchdown!
            bot.y = surfY;
            bot.currentSurface = below;
            bot.flipAngle = 0;

            if (bot.vy > 340) {
              // High velocity -> Parkour shoulder roll
              bot.state = 'LANDING_ROLL';
              bot.stateTimer = 0;
              bot.vx = bot.facing * 140;
              spawnDustPuff(bot.x, bot.y, 7, bot.vx * 0.15);
            } else {
              // Knee compression squash
              bot.state = 'LANDING_SQUASH';
              bot.stateTimer = 0;
              bot.squashScaleY = 0.65;
              bot.vx *= 0.5;
              spawnDustPuff(bot.x, bot.y, 4, 0);
            }
          }
        }
      }

      // STATE: LEDGE_GRAB & CLIMB_UP (Mantle)
      else if (bot.state === 'LEDGE_GRAB') {
        // Hands snapped to corner, body dangles with pendulum physics
        bot.x = bot.grabCornerX - bot.facing * 6;
        bot.y = bot.grabCornerY + 18;

        // Damped harmonic pendulum dangle
        const k = 18;
        const damping = 3.5;
        const springAcc = -k * bot.dangleAngle - damping * bot.dangleVel;
        bot.dangleVel += springAcc * dt;
        bot.dangleAngle += bot.dangleVel * dt;

        if (bot.stateTimer > 0.28) {
          // Begin mantle pull-up
          bot.state = 'CLIMB_UP';
          bot.stateTimer = 0;
        }
      } else if (bot.state === 'CLIMB_UP') {
        // Smoothly pull pelvis above the ledge
        const progress = Math.min(1, bot.stateTimer / 0.22);
        bot.x = bot.grabCornerX + bot.facing * (progress * 12);
        bot.y = bot.grabCornerY + 18 - progress * 18;

        if (progress >= 1) {
          bot.y = bot.grabCornerY;
          bot.state = 'RUN';
          bot.stateTimer = 0;
          bot.vx = bot.facing * 110;
          bot.currentSurface = findSurfaceBelow(bot.x, bot.y);
          spawnDustPuff(bot.x, bot.y, 3, bot.vx * 0.1);
        }
      }

      // STATE: WALL_SLIDE
      else if (bot.state === 'WALL_SLIDE') {
        bot.vy = Math.min(130, bot.vy + GRAVITY * 0.25 * dt); // wall friction
        bot.y += bot.vy * dt;

        // Generate friction sparks down the wall
        if (Math.random() < 0.35) {
          spawnSparks(bot.x + bot.facing * 5, bot.y - 10, 2, -bot.facing);
        }

        // Check if wall has ended
        const below = findSurfaceBelow(bot.x, bot.y);
        const surfY = getSurfaceHeightAt(below, bot.x);
        if (bot.y >= surfY - 4) {
          bot.y = surfY;
          bot.state = 'LANDING_SQUASH';
          bot.stateTimer = 0;
          bot.currentSurface = below;
        } else if (bot.stateTimer > 0.45) {
          // Push off wall into a leap
          bot.state = 'AIRBORNE';
          bot.facing = (bot.facing === 1 ? -1 : 1) as 1 | -1;
          bot.vx = bot.facing * 120;
          bot.vy = -160;
          spawnSparks(bot.x, bot.y, 4, bot.facing);
        }
      }

      // STATE: LANDING_ROLL
      else if (bot.state === 'LANDING_ROLL') {
        bot.flipAngle += bot.facing * 14 * dt;
        bot.x += bot.facing * 130 * dt;
        bot.y = getSurfaceHeightAt(
          bot.currentSurface || findSurfaceBelow(bot.x, bot.y),
          bot.x
        );

        if (bot.stateTimer > 0.26) {
          bot.flipAngle = 0;
          bot.state = 'RUN';
          bot.stateTimer = 0;
          bot.vx = bot.facing * 120;
        }
      }

      // STATE: LANDING_SQUASH
      else if (bot.state === 'LANDING_SQUASH') {
        bot.squashScaleY += (1 - bot.squashScaleY) * 12 * dt;
        if (bot.stateTimer > 0.14) {
          bot.squashScaleY = 1;
          bot.state = 'RUN';
          bot.stateTimer = 0;
        }
      }

      // STATE: RUN / SPRINT
      else if (bot.state === 'RUN') {
        const s = bot.currentSurface || findSurfaceBelow(bot.x, bot.y);
        bot.currentSurface = s;

        // Follow surface tilt
        const runSpeed = 135; // px/s
        bot.vx = bot.facing * runSpeed * Math.cos(s.angle);
        bot.x += bot.vx * dt;
        bot.y = getSurfaceHeightAt(s, bot.x);

        // Advance walk/stride cycle
        bot.walkPhase += dt * (runSpeed / 14);

        // Turn around or jump at ledge boundary
        const distToEdgeRight = s.x1 - bot.x;
        const distToEdgeLeft = bot.x - s.x0;

        if (bot.facing === 1 && distToEdgeRight < 24) {
          // Reaching right edge of platform
          if (Math.random() < 0.65 || s.id === 'navbar') {
            triggerAdaptiveJump('down');
          } else {
            bot.facing = -1;
          }
        } else if (bot.facing === -1 && distToEdgeLeft < 24) {
          // Reaching left edge of platform
          if (Math.random() < 0.65 || s.id === 'navbar') {
            triggerAdaptiveJump('down');
          } else {
            bot.facing = 1;
          }
        }

        // Randomly transition to IDLE when site is paused
        if (bot.stateTimer > 3.8 && timeSinceLastScroll > 1.2) {
          bot.state = 'IDLE';
          bot.stateTimer = 0;
          bot.vx = 0;
        }
      }

      // STATE: IDLE
      else if (bot.state === 'IDLE') {
        bot.vx = 0;
        // Subtle vertical breathing micro-sway
        const breathe = Math.sin(bot.stateTimer * 3.5) * 1.2;
        const s = bot.currentSurface || findSurfaceBelow(bot.x, bot.y);
        bot.y = getSurfaceHeightAt(s, bot.x) + breathe;

        // When paused for a while, resume running or explore
        if (bot.stateTimer > 3.0 || timeSinceLastScroll < 0.6) {
          bot.state = 'RUN';
          bot.stateTimer = 0;
          bot.facing = Math.random() > 0.5 ? 1 : -1;
        }
      }

      // Screen horizontal bounding
      bot.x = Math.max(20, Math.min(width - 20, bot.x));

      // -------------------------------------------------------------
      // 2. SECONDARY MOTION (Damped Springs)
      // -------------------------------------------------------------
      // Torso Lean: springs forward when accelerating, back when braking
      const targetLean =
        bot.state === 'RUN'
          ? bot.facing * 0.22
          : bot.state === 'PRE_JUMP'
          ? bot.facing * 0.35
          : 0;
      const leanSpringK = 26;
      const leanDamping = 6;
      const leanAcc = -leanSpringK * (bot.torsoLean - targetLean) - leanDamping * bot.torsoLeanVel;
      bot.torsoLeanVel += leanAcc * dt;
      bot.torsoLean += bot.torsoLeanVel * dt;

      // Head Look-At: smoothly tracks mouse cursor
      let targetHeadAngle = 0;
      if (mouse.active) {
        const dx = mouse.x - bot.x;
        const dy = mouse.y - (bot.y - 28);
        const lookAngle = Math.atan2(dy, dx);
        // Constrain head angle to natural neck limits
        targetHeadAngle = Math.max(-0.6, Math.min(0.6, lookAngle));
      }
      bot.headAngle += (targetHeadAngle - bot.headAngle) * 8 * dt;

      // -------------------------------------------------------------
      // 3. STANCE-LOCK & PROCEDURAL 2-BONE IK FOR LEGS
      // -------------------------------------------------------------
      const hipX = bot.x;
      const hipY = bot.y - TORSO_LEN * bot.squashScaleY;

      // Leg IK Foot targets
      const updateFoot = (
        foot: FootState,
        phaseOffset: number,
        surfAngle: number
      ) => {
        if (bot.state === 'RUN') {
          const strideDist = 18;
          const cycle = (bot.walkPhase + phaseOffset) % (Math.PI * 2);
          const isStance = Math.sin(cycle) >= 0;

          if (isStance) {
            // Foot firmly planted on surface
            foot.isPlanted = true;
            // Drag along surface tangent
            foot.x = foot.plantedX;
            foot.y = foot.plantedY;

            // If foot falls too far behind hip, unplant and initiate swing
            const distFromHip = (foot.x - hipX) * bot.facing;
            if (distFromHip < -strideDist * 0.7) {
              foot.isPlanted = false;
              foot.swingStartX = foot.x;
              foot.swingStartY = foot.y;
              foot.swingTargetX = hipX + bot.facing * strideDist;
              const s = bot.currentSurface || findSurfaceBelow(foot.swingTargetX, bot.y);
              foot.swingTargetY = getSurfaceHeightAt(s, foot.swingTargetX);
              foot.swingProgress = 0;
            }
          } else {
            // Foot in swing phase (parabolic lift forward along normal)
            foot.swingProgress = Math.min(1, foot.swingProgress + dt * 10);
            const t = foot.swingProgress;
            const liftHeight = Math.sin(t * Math.PI) * 7;

            foot.x = foot.swingStartX + t * (foot.swingTargetX - foot.swingStartX);
            const groundY = foot.swingStartY + t * (foot.swingTargetY - foot.swingStartY);
            // Apply lift along surface normal
            foot.x += Math.sin(surfAngle) * liftHeight;
            foot.y = groundY - Math.cos(surfAngle) * liftHeight;

            if (t >= 1) {
              // Plant foot!
              foot.isPlanted = true;
              foot.plantedX = foot.swingTargetX;
              foot.plantedY = foot.swingTargetY;
              foot.x = foot.plantedX;
              foot.y = foot.plantedY;
              spawnDustPuff(foot.x, foot.y, 2, 0);
            }
          }
        } else if (bot.state === 'IDLE') {
          // Planted side-by-side with subtle micro flex
          foot.isPlanted = true;
          const offset = phaseOffset === 0 ? -4 : 4;
          foot.x = hipX + offset;
          const s = bot.currentSurface || findSurfaceBelow(foot.x, bot.y);
          foot.y = getSurfaceHeightAt(s, foot.x);
          foot.plantedX = foot.x;
          foot.plantedY = foot.y;
        } else if (bot.state === 'AIRBORNE') {
          // Trailing or tucked legs in mid-air
          const offset = phaseOffset === 0 ? -6 : 4;
          foot.x = hipX + offset * bot.facing - bot.vx * 0.04;
          foot.y = hipY + 14 - Math.abs(bot.vy) * 0.02;
        } else if (bot.state === 'LEDGE_GRAB') {
          // Dangling legs with pendulum angle
          const dAngle = bot.dangleAngle;
          const offset = phaseOffset === 0 ? -2 : 3;
          foot.x = hipX + Math.sin(dAngle) * 16 + offset;
          foot.y = hipY + Math.cos(dAngle) * 18;
        } else if (bot.state === 'WALL_SLIDE') {
          // One foot tucked, one foot pressed against wall
          const againstWall = phaseOffset === 0;
          foot.x = againstWall ? bot.x + bot.facing * 5 : bot.x - bot.facing * 4;
          foot.y = hipY + 14;
        }
      };

      const surfAngle = bot.currentSurface ? bot.currentSurface.angle : 0;
      updateFoot(bot.leftFoot, 0, surfAngle);
      updateFoot(bot.rightFoot, Math.PI, surfAngle);

      // Solve 2-Bone IK for both legs
      const leftHipX = hipX - 2.5;
      const leftHipY = hipY;
      const leftLegIK = solve2BoneIK(
        leftHipX,
        leftHipY,
        bot.leftFoot.x,
        bot.leftFoot.y,
        THIGH_LEN,
        SHIN_LEN,
        bot.facing
      );

      const rightHipX = hipX + 2.5;
      const rightHipY = hipY;
      const rightLegIK = solve2BoneIK(
        rightHipX,
        rightHipY,
        bot.rightFoot.x,
        bot.rightFoot.y,
        THIGH_LEN,
        SHIN_LEN,
        bot.facing
      );

      // -------------------------------------------------------------
      // 4. PROCEDURAL 2-BONE IK FOR ARMS
      // -------------------------------------------------------------
      // Torso / Shoulder calculations
      const shoulderX = hipX + Math.sin(bot.torsoLean) * TORSO_LEN;
      const shoulderY = hipY - Math.cos(bot.torsoLean) * TORSO_LEN;

      let leftHandTargetX = shoulderX;
      let leftHandTargetY = shoulderY + 12;
      let rightHandTargetX = shoulderX;
      let rightHandTargetY = shoulderY + 12;

      if (bot.state === 'RUN') {
        // Arm swing counter-balances leg stride
        const armSwing = Math.sin(bot.walkPhase);
        leftHandTargetX = shoulderX - armSwing * 12 * bot.facing;
        leftHandTargetY = shoulderY + 10 + Math.abs(armSwing) * 3;
        rightHandTargetX = shoulderX + armSwing * 12 * bot.facing;
        rightHandTargetY = shoulderY + 10 - Math.abs(armSwing) * 3;
      } else if (bot.state === 'AIRBORNE') {
        // Arms reach out/up for balance
        leftHandTargetX = shoulderX - bot.facing * 8;
        leftHandTargetY = shoulderY - 8;
        rightHandTargetX = shoulderX + bot.facing * 12;
        rightHandTargetY = shoulderY - 6;
      } else if (bot.state === 'LEDGE_GRAB') {
        // Both hands locked to ledge corner via IK!
        leftHandTargetX = bot.grabCornerX - 2;
        leftHandTargetY = bot.grabCornerY - 2;
        rightHandTargetX = bot.grabCornerX + 2;
        rightHandTargetY = bot.grabCornerY - 2;
      } else if (bot.state === 'WALL_SLIDE') {
        // Hand pressed against wall
        leftHandTargetX = bot.x + bot.facing * 6;
        leftHandTargetY = shoulderY + 2;
        rightHandTargetX = shoulderX - bot.facing * 5;
        rightHandTargetY = shoulderY + 10;
      } else if (bot.state === 'IDLE') {
        // Natural relaxed arm pose
        leftHandTargetX = shoulderX - bot.facing * 3;
        leftHandTargetY = shoulderY + 13;
        rightHandTargetX = shoulderX + bot.facing * 3;
        rightHandTargetY = shoulderY + 13;
      }

      const leftArmIK = solve2BoneIK(
        shoulderX - 2,
        shoulderY,
        leftHandTargetX,
        leftHandTargetY,
        UPPER_ARM_LEN,
        FOREARM_LEN,
        -bot.facing
      );

      const rightArmIK = solve2BoneIK(
        shoulderX + 2,
        shoulderY,
        rightHandTargetX,
        rightHandTargetY,
        UPPER_ARM_LEN,
        FOREARM_LEN,
        -bot.facing
      );

      // -------------------------------------------------------------
      // 5. RENDER MOTION TRAILS
      // -------------------------------------------------------------
      for (let i = bot.motionTrails.length - 1; i >= 0; i--) {
        const trail = bot.motionTrails[i];
        trail.alpha -= dt * 1.8;
        if (trail.alpha <= 0) {
          bot.motionTrails.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(trail.x, trail.y);
        ctx.rotate(trail.angle);
        ctx.strokeStyle = `rgba(255, 92, 0, ${trail.alpha * 0.35})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, -12, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 6. RENDER 12-JOINT ARTICULATED SKELETON
      // -------------------------------------------------------------
      ctx.save();

      // Mid-air flip or roll rotation around center of mass
      if (bot.state === 'LANDING_ROLL' || (bot.state === 'AIRBORNE' && Math.abs(bot.flipAngle) > 0.05)) {
        ctx.translate(bot.x, hipY - 4);
        ctx.rotate(bot.flipAngle);
        ctx.translate(-bot.x, -(hipY - 4));
      }

      // Dieter Rams / Hardware aesthetic palette
      const SKELETON_COLOR = '#18181B'; // matte dark graphite
      const JOINT_PIN_COLOR = '#52525B';
      const HARD_HAT_COLOR = '#FF5C00'; // safety orange
      const VISOR_COLOR = '#CC4400';

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // --- Left Arm (Behind) ---
      ctx.strokeStyle = SKELETON_COLOR;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(shoulderX - 2, shoulderY);
      ctx.lineTo(leftArmIK.midX, leftArmIK.midY);
      ctx.lineTo(leftHandTargetX, leftHandTargetY);
      ctx.stroke();

      // --- Left Leg (Behind) ---
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(leftHipX, leftHipY);
      ctx.lineTo(leftLegIK.midX, leftLegIK.midY);
      ctx.lineTo(bot.leftFoot.x, bot.leftFoot.y);
      ctx.stroke();

      // Left Foot Pad
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(bot.leftFoot.x - 2.5 * bot.facing, bot.leftFoot.y);
      ctx.lineTo(bot.leftFoot.x + 3.5 * bot.facing, bot.leftFoot.y);
      ctx.stroke();

      // --- Pelvis & Torso ---
      ctx.strokeStyle = SKELETON_COLOR;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(shoulderX, shoulderY);
      ctx.stroke();

      // Pelvis cross-bar
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(leftHipX, leftHipY);
      ctx.lineTo(rightHipX, rightHipY);
      ctx.stroke();

      // Battery / Jetpack module on back
      ctx.fillStyle = '#27272A';
      ctx.fillRect(shoulderX - bot.facing * 6 - 2, shoulderY + 2, 4, 8);
      // Status indicator LED
      ctx.fillStyle = HARD_HAT_COLOR;
      ctx.fillRect(shoulderX - bot.facing * 6 - 2, shoulderY + 5, 1.5, 2.5);

      // --- Right Leg (Forefront) ---
      ctx.strokeStyle = SKELETON_COLOR;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(rightHipX, rightHipY);
      ctx.lineTo(rightLegIK.midX, rightLegIK.midY);
      ctx.lineTo(bot.rightFoot.x, bot.rightFoot.y);
      ctx.stroke();

      // Right Foot Pad
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(bot.rightFoot.x - 2.5 * bot.facing, bot.rightFoot.y);
      ctx.lineTo(bot.rightFoot.x + 3.5 * bot.facing, bot.rightFoot.y);
      ctx.stroke();

      // --- Right Arm (Forefront) ---
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(shoulderX + 2, shoulderY);
      ctx.lineTo(rightArmIK.midX, rightArmIK.midY);
      ctx.lineTo(rightHandTargetX, rightHandTargetY);
      ctx.stroke();

      // --- Joint Pivot Pins ---
      ctx.fillStyle = JOINT_PIN_COLOR;
      const drawPin = (px: number, py: number) => {
        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      };
      drawPin(leftHipX, leftHipY);
      drawPin(rightHipX, rightHipY);
      drawPin(leftLegIK.midX, leftLegIK.midY);
      drawPin(rightLegIK.midX, rightLegIK.midY);
      drawPin(shoulderX, shoulderY);
      drawPin(rightArmIK.midX, rightArmIK.midY);

      // --- Neck & Head (With Orange Hard Hat) ---
      const neckY = shoulderY - 3;
      const headX = shoulderX + Math.sin(bot.headAngle) * 3;
      const headY = neckY - 6.5;

      // Neck joint
      ctx.strokeStyle = SKELETON_COLOR;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(headX, neckY);
      ctx.stroke();

      // Head Base Sphere
      ctx.fillStyle = SKELETON_COLOR;
      ctx.beginPath();
      ctx.arc(headX, headY, HEAD_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Safety Orange Hard Hat
      ctx.save();
      ctx.translate(headX, headY);
      ctx.rotate(bot.headAngle * 0.4);

      // Hard hat dome
      ctx.fillStyle = HARD_HAT_COLOR;
      ctx.beginPath();
      ctx.arc(0, -1.2, HEAD_RADIUS + 1.2, Math.PI * 0.95, Math.PI * 2.05, false);
      ctx.fill();

      // Visor Rim
      ctx.strokeStyle = VISOR_COLOR;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-HEAD_RADIUS - 1.2, -1.2);
      ctx.lineTo(HEAD_RADIUS + 2.5 * bot.facing, -1.2);
      ctx.stroke();

      // Eye optic sensor dot
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.arc(bot.facing * 2.6, 0.5, 1.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.restore();

      // -------------------------------------------------------------
      // 7. RENDER PARTICLES (Dust Puffs & Friction Sparks)
      // -------------------------------------------------------------
      for (let i = bot.particles.length - 1; i >= 0; i--) {
        const p = bot.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;

        if (p.isDust) {
          p.vy += GRAVITY * 0.15 * dt;
          p.size += dt * 3.5; // expand puff
        } else {
          p.vy += GRAVITY * 0.45 * dt; // spark gravity
        }

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.life >= p.maxLife) {
          bot.particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-50 block"
    />
  );
};

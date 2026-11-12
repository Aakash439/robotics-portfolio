import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audio';

type BotState =
  | 'IDLE_PATROL'
  | 'RUN'
  | 'VAULT_DOWN'
  | 'ROLL'
  | 'GRAPPLE_UP'
  | 'SIT_EDGE'
  | 'WELD_INSPECT'
  | 'BACKFLIP';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Platform {
  y: number;
  x0: number;
  x1: number;
}

/**
 * ParkourRobot: A miniature stickman robotics engineer that freeruns across
 * the site's banners, dividers, and cards. It parkours down when scrolling down,
 * climbs/grapples up when scrolling up, and explores/patrols when paused!
 */
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

    // Robot physical state
    const bot = {
      x: width * 0.75,
      y: 220,
      vx: 2.2,
      vy: 0,
      facing: 1 as 1 | -1,
      state: 'IDLE_PATROL' as BotState,
      stateTimer: 0,
      currentLedgeY: 220,
      currentLedgeX0: 40,
      currentLedgeX1: width - 40,
      flipAngle: 0,
      grappleTarget: null as { x: number; y: number } | null,
      grappleLength: 0,
      walkCycle: 0,
      sparks: [] as Particle[],
      onGround: true,
    };

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let timeSinceLastScroll = 10;
    let lastTime = performance.now();

    // Collect visible horizontal platforms in viewport
    const scanPlatforms = (): Platform[] => {
      const platforms: Platform[] = [];
      const defaultFloor = height - 18;

      // Query section borders, cards, headers, dividers
      const targets = document.querySelectorAll(
        'section, header, footer, hr, [data-dmm-target], .border-b, h2'
      );

      targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Check top edge
        if (rect.top > 60 && rect.top < height - 30 && rect.width > 120) {
          platforms.push({
            y: rect.top,
            x0: Math.max(20, rect.left),
            x1: Math.min(width - 20, rect.right),
          });
        }
        // Check bottom edge
        if (rect.bottom > 60 && rect.bottom < height - 30 && rect.width > 120) {
          platforms.push({
            y: rect.bottom,
            x0: Math.max(20, rect.left),
            x1: Math.min(width - 20, rect.right),
          });
        }
      });

      // Add default screen bottom platform
      platforms.push({ y: defaultFloor, x0: 20, x1: width - 20 });
      return platforms.sort((a, b) => a.y - b.y);
    };

    let platforms = scanPlatforms();
    let platformScanTimer = 0;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const dy = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      scrollVelocity = dy;
      timeSinceLastScroll = 0;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Click on canvas to poke / high-five the robot
    const onClick = (e: MouseEvent) => {
      const clickDist = Math.hypot(e.clientX - bot.x, e.clientY - (bot.y - 20));
      if (clickDist < 45) {
        audioEngine.playMechanicalClick();
        bot.state = 'BACKFLIP';
        bot.stateTimer = 0;
        bot.flipAngle = 0;
        bot.vy = -7.5;
        // Burst of joy sparks
        for (let i = 0; i < 10; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 1.5 + Math.random() * 3;
          bot.sparks.push({
            x: bot.x,
            y: bot.y - 30,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 0,
            maxLife: 20 + Math.random() * 15,
            color: '#FF5C00',
            size: 1.5 + Math.random() * 1.5,
          });
        }
      }
    };

    window.addEventListener('click', onClick);

    // Find nearest platform below
    const findPlatformBelow = (px: number, py: number): Platform => {
      const candidates = platforms.filter(
        (p) => p.y > py + 12 && px >= p.x0 - 30 && px <= p.x1 + 30
      );
      if (candidates.length > 0) return candidates[0];
      return { y: height - 18, x0: 20, x1: width - 20 };
    };

    // Find nearest platform above
    const findPlatformAbove = (px: number, py: number): Platform => {
      const candidates = platforms.filter(
        (p) => p.y < py - 18 && px >= p.x0 - 40 && px <= p.x1 + 40
      );
      if (candidates.length > 0) return candidates[candidates.length - 1];
      return { y: 80, x0: 20, x1: width - 20 };
    };

    // Main 60fps Loop
    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;

      timeSinceLastScroll += dt;
      scrollVelocity *= 0.88; // decay

      platformScanTimer += dt;
      if (platformScanTimer > 1.2) {
        platformScanTimer = 0;
        platforms = scanPlatforms();
      }

      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 1. SCROLL DETECTION & PARKOUR STATE TRIGGERS
      // -------------------------------------------------------------
      // Scrolling DOWN fast: Trigger Vault Down
      if (scrollVelocity > 5 && bot.state !== 'VAULT_DOWN' && bot.state !== 'ROLL') {
        const nextPlat = findPlatformBelow(bot.x, bot.y);
        bot.state = 'VAULT_DOWN';
        bot.stateTimer = 0;
        bot.flipAngle = 0;
        bot.onGround = false;
        bot.vy = -3.5;
        bot.vx = bot.facing * (2.5 + Math.min(scrollVelocity * 0.2, 5));
        bot.currentLedgeY = nextPlat.y;
        bot.currentLedgeX0 = nextPlat.x0;
        bot.currentLedgeX1 = nextPlat.x1;
      }
      // Scrolling UP fast: Trigger Grapple Up
      else if (scrollVelocity < -5 && bot.state !== 'GRAPPLE_UP') {
        const upperPlat = findPlatformAbove(bot.x, bot.y);
        bot.state = 'GRAPPLE_UP';
        bot.stateTimer = 0;
        bot.onGround = false;
        bot.grappleTarget = {
          x: Math.max(upperPlat.x0 + 30, Math.min(upperPlat.x1 - 30, bot.x + bot.facing * 20)),
          y: upperPlat.y,
        };
        bot.currentLedgeY = upperPlat.y;
        bot.currentLedgeX0 = upperPlat.x0;
        bot.currentLedgeX1 = upperPlat.x1;
        audioEngine.playMechanicalClick();
      }

      // -------------------------------------------------------------
      // 2. STATE MACHINE EXECUTION
      // -------------------------------------------------------------
      bot.stateTimer += dt;

      if (bot.state === 'IDLE_PATROL') {
        // Casual patrol walking along ledge
        bot.walkCycle += dt * 4;
        bot.x += bot.facing * 1.4;

        // Turn around at ledge edges
        if (bot.x > bot.currentLedgeX1 - 15) {
          bot.facing = -1;
        } else if (bot.x < bot.currentLedgeX0 + 15) {
          bot.facing = 1;
        }

        // Randomly pick an explore stunt when paused
        if (bot.stateTimer > 4.5 && timeSinceLastScroll > 1.2) {
          bot.stateTimer = 0;
          const stunts: BotState[] = ['SIT_EDGE', 'WELD_INSPECT', 'BACKFLIP', 'RUN'];
          bot.state = stunts[Math.floor(Math.random() * stunts.length)];
        }
      } else if (bot.state === 'RUN') {
        // Fast sprint along ledge
        bot.walkCycle += dt * 9;
        bot.x += bot.facing * 3.6;

        if (bot.x > bot.currentLedgeX1 - 15) {
          bot.facing = -1;
        } else if (bot.x < bot.currentLedgeX0 + 15) {
          bot.facing = 1;
        }

        if (bot.stateTimer > 3.0) {
          bot.state = 'IDLE_PATROL';
          bot.stateTimer = 0;
        }
      } else if (bot.state === 'VAULT_DOWN') {
        // Aerial parkour flip descent
        bot.flipAngle += dt * 11 * bot.facing;
        bot.vy += 22 * dt; // gravity
        bot.x += bot.vx * dt * 45;
        bot.y += bot.vy;

        // Land on lower platform
        if (bot.y >= bot.currentLedgeY && bot.vy > 0) {
          bot.y = bot.currentLedgeY;
          bot.vy = 0;
          bot.flipAngle = 0;
          bot.state = 'ROLL';
          bot.stateTimer = 0;
          bot.onGround = true;

          // Landing impact sparks
          for (let i = 0; i < 6; i++) {
            bot.sparks.push({
              x: bot.x,
              y: bot.y,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3,
              life: 0,
              maxLife: 16,
              color: '#FF5C00',
              size: 1.2,
            });
          }
        }
      } else if (bot.state === 'ROLL') {
        // Smooth parkour shoulder roll upon landing
        bot.flipAngle += dt * 12 * bot.facing;
        bot.x += bot.facing * 3.2;
        if (bot.stateTimer > 0.35) {
          bot.flipAngle = 0;
          bot.state = 'RUN';
          bot.stateTimer = 0;
        }
      } else if (bot.state === 'GRAPPLE_UP') {
        // Winch up to ledge above
        if (bot.grappleTarget) {
          const dx = bot.grappleTarget.x - bot.x;
          const dy = bot.grappleTarget.y - bot.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 15) {
            bot.x += (dx / dist) * 9;
            bot.y += (dy / dist) * 9;
          } else {
            // Reached upper ledge! Vault over
            bot.y = bot.currentLedgeY;
            bot.grappleTarget = null;
            bot.state = 'RUN';
            bot.stateTimer = 0;
            bot.onGround = true;
          }
        } else {
          bot.state = 'IDLE_PATROL';
        }
      } else if (bot.state === 'SIT_EDGE') {
        // Sitting with legs dangling off card edge
        bot.walkCycle += dt * 2.5; // kick feet
        if (bot.stateTimer > 3.5 || timeSinceLastScroll < 0.5) {
          bot.state = 'IDLE_PATROL';
          bot.stateTimer = 0;
        }
      } else if (bot.state === 'WELD_INSPECT') {
        // Pull out welding torch and inspect ledge
        if (Math.random() < 0.4) {
          bot.sparks.push({
            x: bot.x + bot.facing * 14,
            y: bot.y - 4,
            vx: bot.facing * (1 + Math.random() * 2),
            vy: -Math.random() * 3,
            life: 0,
            maxLife: 18,
            color: Math.random() > 0.4 ? '#FF5C00' : '#FFD60A',
            size: 1.2 + Math.random(),
          });
        }
        if (bot.stateTimer > 2.8 || timeSinceLastScroll < 0.5) {
          bot.state = 'IDLE_PATROL';
          bot.stateTimer = 0;
        }
      } else if (bot.state === 'BACKFLIP') {
        bot.flipAngle -= dt * 12 * bot.facing;
        bot.vy += 22 * dt;
        bot.y += bot.vy;

        if (bot.y >= bot.currentLedgeY && bot.vy > 0) {
          bot.y = bot.currentLedgeY;
          bot.vy = 0;
          bot.flipAngle = 0;
          bot.state = 'IDLE_PATROL';
          bot.stateTimer = 0;
        }
      }

      // Keep bot in horizontal screen bounds
      bot.x = Math.max(25, Math.min(width - 25, bot.x));

      // -------------------------------------------------------------
      // 3. RENDER STICKMAN FREERUNNER
      // -------------------------------------------------------------
      ctx.save();
      ctx.translate(bot.x, bot.y);
      ctx.scale(bot.facing, 1);

      // Render Grapple Wire if climbing
      if (bot.state === 'GRAPPLE_UP' && bot.grappleTarget) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // world coords
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(bot.x, bot.y - 22);
        ctx.lineTo(bot.grappleTarget.x, bot.grappleTarget.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Grapple hook anchor
        ctx.fillStyle = '#FF5C00';
        ctx.beginPath();
        ctx.arc(bot.grappleTarget.x, bot.grappleTarget.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (bot.state === 'VAULT_DOWN' || bot.state === 'ROLL' || bot.state === 'BACKFLIP') {
        // Acrobat / Flip Rotation
        ctx.rotate(bot.flipAngle);
        ctx.translate(0, -16);

        // Tucked Torso
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Tucked limbs
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0.4, Math.PI * 1.6);
        ctx.stroke();

        // Head with Orange Helmet
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(6, -6, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF5C00';
        ctx.beginPath();
        ctx.arc(6, -7.5, 6.8, Math.PI, 0, false);
        ctx.fill();
      } else if (bot.state === 'SIT_EDGE') {
        // Sitting pose with legs dangling
        const hipX = 0;
        const hipY = -14;
        const headY = -28;

        // Torso
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX, headY + 7);
        ctx.stroke();

        // Head with Helmet
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(hipX + 1, headY, 5.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF5C00';
        ctx.beginPath();
        ctx.arc(hipX + 1, headY - 1.5, 7.2, Math.PI, 0, false);
        ctx.fill();

        // Dangling Legs with kicking animation
        const kick1 = Math.sin(bot.walkCycle) * 6;
        const kick2 = -Math.sin(bot.walkCycle) * 6;

        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX + 8, hipY);
        ctx.lineTo(hipX + 8 + kick1, hipY + 14);

        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX + 6, hipY);
        ctx.lineTo(hipX + 6 + kick2, hipY + 14);
        ctx.stroke();

        // Hands resting on ledge
        ctx.beginPath();
        ctx.moveTo(hipX, headY + 9);
        ctx.lineTo(hipX + 7, hipY);
        ctx.stroke();
      } else {
        // Normal Running / Walking / Inspecting kinematics
        const isRun = bot.state === 'RUN';
        const isWeld = bot.state === 'WELD_INSPECT';
        const cycle = bot.walkCycle;

        const hipX = 0;
        const hipY = -18;
        const headX = isRun ? 4 : isWeld ? 6 : 0;
        const headY = isWeld ? -24 : -32;

        // Torso
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(headX, headY + 8);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(headX, headY, 5.8, 0, Math.PI * 2);
        ctx.fill();

        // Safety Orange Helmet
        ctx.fillStyle = '#FF5C00';
        ctx.beginPath();
        ctx.arc(headX, headY - 1.5, 7.2, Math.PI, 0, false);
        ctx.fill();
        ctx.strokeStyle = '#CC4400';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(headX - 6.5, headY - 1.5);
        ctx.lineTo(headX + 8, headY - 1.5);
        ctx.stroke();
        ctx.lineWidth = 2.4;

        // Animated Legs
        const legSwing = isWeld ? 0 : Math.sin(cycle);
        const leg1X = hipX + legSwing * 10;
        const leg2X = hipX - legSwing * 10;

        // Leg 1
        ctx.strokeStyle = '#111111';
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX + legSwing * 5, hipY + 9);
        ctx.lineTo(leg1X, 0);
        ctx.stroke();

        // Leg 2
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX - legSwing * 5, hipY + 9);
        ctx.lineTo(leg2X, 0);
        ctx.stroke();

        // Animated Arms
        if (isWeld) {
          // Welding torch pose
          ctx.beginPath();
          ctx.moveTo(headX, headY + 9);
          ctx.lineTo(headX + 8, headY + 16);
          ctx.lineTo(headX + 14, -4);
          ctx.stroke();

          // Welding torch tip
          ctx.fillStyle = '#3F3F46';
          ctx.fillRect(headX + 12, -6, 5, 3);
        } else {
          // Running / Walking arm swing
          const armSwing = -legSwing;
          ctx.beginPath();
          ctx.moveTo(headX, headY + 9);
          ctx.lineTo(headX + armSwing * 6, headY + 16);
          ctx.lineTo(headX + armSwing * 9, headY + 23);
          ctx.stroke();
        }

        // Mini Jetpack / Battery Pack on Back
        ctx.fillStyle = '#27272A';
        ctx.fillRect(hipX - 5, headY + 8, 4, 10);
        ctx.fillStyle = '#FF5C00';
        ctx.fillRect(hipX - 5, headY + 12, 1.5, 3);
      }

      ctx.restore();

      // -------------------------------------------------------------
      // 4. RENDER SPARKS & PARTICLES
      // -------------------------------------------------------------
      for (let i = bot.sparks.length - 1; i >= 0; i--) {
        const p = bot.sparks[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life++;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.life >= p.maxLife) {
          bot.sparks.splice(i, 1);
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
      window.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-[9990] block"
    />
  );
};

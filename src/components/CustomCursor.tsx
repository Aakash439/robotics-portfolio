import React, { useEffect, useRef } from 'react';

/**
 * CustomCursor — Adapted from Aakash's previous Cursor.jsx
 * Features:
 * - Zero-React-state GPU transform follower with smooth spring trailing physics
 * - 3D projected rotating wireframe icosahedron core + counter-rotating outer aura + ember particles
 * - Automatic target lock (.cursor-shrink / interactive elements) shifting to International Orange (#FF5C00)
 */
export const CustomCursor: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Disable custom cursor on touch-only devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 96;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isShrunk = false;
    let currentScale = 1;
    let isVisible = false;

    // Golden ratio icosahedron vertices for authentic 3D wireframe core
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVertices: [number, number, number][] = [
      [-1, phi, 0],
      [1, phi, 0],
      [-1, -phi, 0],
      [1, -phi, 0],
      [0, -1, phi],
      [0, 1, phi],
      [0, -1, -phi],
      [0, 1, -phi],
      [phi, 0, -1],
      [phi, 0, 1],
      [-phi, 0, -1],
      [-phi, 0, 1],
    ];

    // Normalize vertices
    const vertices = rawVertices.map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return [x / len, y / len, z / len] as [number, number, number];
    });

    // Precompute icosahedron edges
    const edges: [number, number][] = [];
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const d = Math.hypot(
          vertices[i][0] - vertices[j][0],
          vertices[i][1] - vertices[j][1],
          vertices[i][2] - vertices[j][2]
        );
        if (d < 1.2) {
          edges.push([i, j]);
        }
      }
    }

    // Orbiting ember particles
    const embers = Array.from({ length: 14 }, (_, i) => ({
      angle: (i / 14) * Math.PI * 2,
      radius: 14 + (i % 4) * 4.5,
      speed: 1.4 + (i % 3) * 0.65,
      size: 1.1 + (i % 2) * 0.7,
    }));

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) {
        currentX = targetX;
        currentY = targetY;
        isVisible = true;
        wrapper.style.opacity = '1';
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('.cursor-shrink') ||
        target?.closest('a') ||
        target?.closest('button')
      ) {
        isShrunk = true;
      } else {
        isShrunk = false;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });

    let rotX = 0;
    let rotY = 0;
    let rotZ = 0;
    let animId: number;

    const rotatePoint = (
      [x, y, z]: [number, number, number],
      rx: number,
      ry: number,
      rz: number
    ): [number, number, number] => {
      // Rotate X
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;

      // Rotate Y
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x2 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;

      // Rotate Z
      const cosZ = Math.cos(rz);
      const sinZ = Math.sin(rz);
      const x3 = x2 * cosZ - y1 * sinZ;
      const y3 = x2 * sinZ + y1 * cosZ;

      return [x3, y3, z2];
    };

    const render = () => {
      // Smooth trailing physics (zero React state updates)
      currentX += (targetX - currentX) * 0.28;
      currentY += (targetY - currentY) * 0.28;
      wrapper.style.transform = `translate3d(${currentX - size / 2}px, ${
        currentY - size / 2
      }px, 0)`;

      const targetScale = isShrunk ? 0.58 : 1.0;
      currentScale += (targetScale - currentScale) * 0.18;

      rotX += 0.032;
      rotY += 0.042;
      rotZ -= 0.024;

      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const coreRadius = 12.5 * currentScale;
      const auraRadius = 17.5 * currentScale;

      // Subtle core glow
      const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, auraRadius * 1.6);
      if (isShrunk) {
        glow.addColorStop(0, 'rgba(255, 85, 0, 0.25)');
        glow.addColorStop(1, 'rgba(255, 85, 0, 0)');
      } else {
        glow.addColorStop(0, 'rgba(0, 0, 0, 0.04)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, auraRadius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: Counter-Rotating Outer Wireframe Aura
      const auraPts = vertices.map((v) =>
        rotatePoint(v, -rotX * 0.75, -rotY * 0.6, rotZ * 0.9)
      );
      ctx.strokeStyle = isShrunk
        ? 'rgba(255, 85, 0, 0.45)'
        : 'rgba(90, 90, 85, 0.35)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      for (const [i, j] of edges) {
        ctx.moveTo(cx + auraPts[i][0] * auraRadius, cy + auraPts[i][1] * auraRadius);
        ctx.lineTo(cx + auraPts[j][0] * auraRadius, cy + auraPts[j][1] * auraRadius);
      }
      ctx.stroke();

      // Layer 1: Inner Rotating Wireframe Core
      const corePts = vertices.map((v) => rotatePoint(v, rotX, rotY, rotZ));
      ctx.strokeStyle = isShrunk
        ? 'rgba(255, 85, 0, 0.95)'
        : 'rgba(17, 17, 17, 0.85)';
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      for (const [i, j] of edges) {
        ctx.moveTo(cx + corePts[i][0] * coreRadius, cy + corePts[i][1] * coreRadius);
        ctx.lineTo(cx + corePts[j][0] * coreRadius, cy + corePts[j][1] * coreRadius);
      }
      ctx.stroke();

      // Layer 3: Orbiting Embers
      embers.forEach((em) => {
        em.angle += 0.02 * em.speed;
        const ex = cx + Math.cos(em.angle) * em.radius * currentScale;
        const ey = cy + Math.sin(em.angle * 1.3) * em.radius * currentScale;
        ctx.fillStyle = isShrunk
          ? 'rgba(255, 85, 0, 0.9)'
          : 'rgba(255, 85, 0, 0.75)';
        ctx.beginPath();
        ctx.arc(ex, ey, em.size * currentScale, 0, Math.PI * 2);
        ctx.fill();
      });

      // Center precision dot
      ctx.fillStyle = isShrunk ? '#FF5500' : '#111111';
      ctx.beginPath();
      ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="hidden md:block fixed top-0 left-0 w-24 h-24 z-[99999] pointer-events-none opacity-0 transition-opacity duration-300"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
    </div>
  );
};

import React, { useEffect, useRef } from 'react';

interface SpinningTorusOProps {
  className?: string;
  color?: string;
}

/**
 * SpinningTorusO — Renders the 3D rotating wireframe TorusKnot (p=2, q=3)
 * as an inline typographic "o" inside "R[o]botics".
 */
export const SpinningTorusO: React.FC<SpinningTorusOProps> = ({
  className = 'w-[0.74em] h-[0.74em]',
  color = '#111111',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelSize = 120;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = pixelSize * dpr;
    canvas.height = pixelSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Precompute TorusKnot (p=2, q=3) tubular mesh vertices & wireframe segments
    // Sized to tightly fill the 120x120 canvas so inline kerning between 'R' and 'botics' is seamless
    const tubularSegments = 72;
    const radialSegments = 12;
    const p = 2;
    const q = 3;
    const scaleRadius = 26.5;
    const tubeRadius = 8.8;

    const getCenterPoint = (u: number): [number, number, number] => {
      const cu = Math.cos(u);
      const su = Math.sin(u);
      const quOverP = (q / p) * u;
      const cs = Math.cos(quOverP);
      const r = scaleRadius * (2 + cs) * 0.5;
      return [
        r * cu,
        r * su,
        scaleRadius * Math.sin(quOverP) * 0.5,
      ];
    };

    // Build 3D tubular grid rings
    const rings: [number, number, number][][] = [];
    for (let i = 0; i < tubularSegments; i++) {
      const u = (i / tubularSegments) * p * Math.PI * 2;
      const uNext = ((i + 0.5) / tubularSegments) * p * Math.PI * 2;
      const P1 = getCenterPoint(u);
      const P2 = getCenterPoint(uNext);

      // Tangent T
      let tx = P2[0] - P1[0];
      let ty = P2[1] - P1[1];
      let tz = P2[2] - P1[2];
      const tLen = Math.hypot(tx, ty, tz) || 1;
      tx /= tLen;
      ty /= tLen;
      tz /= tLen;

      // Normal N & Binormal B
      let nx = P2[0] + P1[0];
      let ny = P2[1] + P1[1];
      let nz = P2[2] + P1[2];
      const nLen = Math.hypot(nx, ny, nz) || 1;
      nx /= nLen;
      ny /= nLen;
      nz /= nLen;

      // B = T x N
      let bx = ty * nz - tz * ny;
      let by = tz * nx - tx * nz;
      let bz = tx * ny - ty * nx;
      const bLen = Math.hypot(bx, by, bz) || 1;
      bx /= bLen;
      by /= bLen;
      bz /= bLen;

      // Re-orthogonalize N = B x T
      nx = by * tz - bz * ty;
      ny = bz * tx - bx * tz;
      nz = bx * ty - by * tx;

      const ring: [number, number, number][] = [];
      for (let j = 0; j < radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;
        const cx = -tubeRadius * Math.cos(v);
        const cy = tubeRadius * Math.sin(v);
        ring.push([
          P1[0] + cx * nx + cy * bx,
          P1[1] + cx * ny + cy * by,
          P1[2] + cx * nz + cy * bz,
        ]);
      }
      rings.push(ring);
    }

    let rx = 0.4;
    let ry = 0.2;
    let rz = 0;
    let animId: number;

    const rotate3D = (pt: [number, number, number]): [number, number, number] => {
      const [x, y, z] = pt;
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;

      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x2 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;

      const cosZ = Math.cos(rz);
      const sinZ = Math.sin(rz);
      const x3 = x2 * cosZ - y1 * sinZ;
      const y3 = x2 * sinZ + y1 * cosZ;

      return [x3, y3, z2];
    };

    const render = () => {
      rx += 0.012;
      ry += 0.018;
      rz += 0.008;

      ctx.clearRect(0, 0, pixelSize, pixelSize);
      const cx = pixelSize / 2;
      const cy = pixelSize / 2;

      const projected = rings.map((ring) =>
        ring.map((pt) => {
          const [x, y, z] = rotate3D(pt);
          const perspective = 125 / (125 - z);
          return [cx + x * perspective, cy + y * perspective, z] as [
            number,
            number,
            number
          ];
        })
      );

      // Soft drafting bloom
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 54);
      grad.addColorStop(0, 'rgba(255, 85, 0, 0.16)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 54, 0, Math.PI * 2);
      ctx.fill();

      // Draw longitudinal & cross-sectional wireframe mesh
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();

      for (let i = 0; i < tubularSegments; i++) {
        const nextI = (i + 1) % tubularSegments;
        for (let j = 0; j < radialSegments; j++) {
          const nextJ = (j + 1) % radialSegments;
          const pA = projected[i][j];
          const pB = projected[nextI][j];
          const pC = projected[i][nextJ];

          ctx.moveTo(pA[0], pA[1]);
          ctx.lineTo(pB[0], pB[1]);

          if (i % 2 === 0) {
            ctx.moveTo(pA[0], pA[1]);
            ctx.lineTo(pC[0], pC[1]);
          }
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [color]);

  return (
    <span
      className={`inline-flex items-center justify-center align-baseline relative -mx-[0.03em] translate-y-[0.07em] select-none shrink-0 ${className}`}
      aria-label="o"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </span>
  );
};

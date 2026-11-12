const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// =========================================================================
// CRC32 & PNG Encoding Helpers
// =========================================================================
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

/**
 * Encodes RGBA buffer to a valid PNG buffer.
 */
function encodePng(width, height, rgbaBuffer) {
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    rawData[rowStart] = 0; // Filter: None
    const srcStart = y * rowBytes;
    rgbaBuffer.copy(rawData, rowStart + 1, srcStart, srcStart + rowBytes);
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // Bit depth
  ihdr[9] = 6;  // Color type 6: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = pngChunk('IHDR', ihdr);
  const idatChunk = pngChunk('IDAT', compressed);
  const iendChunk = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

// =========================================================================
// Distance & Geometry Helpers for Vector Rendering
// =========================================================================
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = px - x1;
    const ey = py - y1;
    return Math.sqrt(ex * ex + ey * ey);
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const rx = px - projX;
  const ry = py - projY;
  return Math.sqrt(rx * rx + ry * ry);
}

function distToRoundedRect(px, py, rx, ry, rw, rh, rad) {
  // Check if inside bounding box
  if (px < rx || px > rx + rw || py < ry || py > ry + rh) return 999;
  
  // Check four corners
  const left = px < rx + rad;
  const right = px > rx + rw - rad;
  const top = py < ry + rad;
  const bottom = py > ry + rh - rad;

  if (left && top) {
    const cx = rx + rad;
    const cy = ry + rad;
    const d = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
    return d <= rad ? 0 : d - rad;
  }
  if (right && top) {
    const cx = rx + rw - rad;
    const cy = ry + rad;
    const d = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
    return d <= rad ? 0 : d - rad;
  }
  if (left && bottom) {
    const cx = rx + rad;
    const cy = ry + rh - rad;
    const d = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
    return d <= rad ? 0 : d - rad;
  }
  if (right && bottom) {
    const cx = rx + rw - rad;
    const cy = ry + rh - rad;
    const d = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
    return d <= rad ? 0 : d - rad;
  }
  return 0; // inside non-corner region
}

/**
 * Samples the robotic arm vector at coordinate (vx, vy) in 0..32 space.
 * Returns [r, g, b, a].
 */
function sampleIcon(vx, vy) {
  // 1. Check outer rounded tile (0, 0, 32, 32, rx=7)
  const tileDist = distToRoundedRect(vx, vy, 0, 0, 32, 32, 7.0);
  if (tileDist > 0) {
    return [0, 0, 0, 0]; // Transparent outside rounded corner
  }

  // Base background: Dark Titanium #0C0D10
  let r = 12, g = 13, b = 16, a = 255;

  // Outer border: #2D3039 (0.75 margin, stroke-width 1.2)
  const innerTileDist = distToRoundedRect(vx, vy, 1.2, 1.2, 29.6, 29.6, 6.0);
  if (innerTileDist > 0) {
    r = 45; g = 48; b = 57;
  }

  // 2. Base Pedestal Platform: rect(4, 25.5, 11, 3, rx=1.2)
  const baseDist = distToRoundedRect(vx, vy, 4, 25.5, 11, 3, 1.2);
  if (baseDist === 0) {
    // Pedestal fill #272930 or stroke #A1A1AA
    if (vx <= 4.8 || vx >= 14.2 || vy <= 26.2 || vy >= 27.8) {
      r = 161; g = 161; b = 170; // #A1A1AA
    } else {
      r = 39; g = 41; b = 48;    // #272930
    }
  }

  // 3. Lower Link: (9.5, 25) to (14.5, 12.5), width 3.2, stroke #F4F4F6
  const lowerLinkDist = distToSegment(vx, vy, 9.5, 25.0, 14.5, 12.5);
  if (lowerLinkDist <= 1.6) {
    r = 244; g = 244; b = 246; // #F4F4F6
  }

  // 4. Upper Forearm Link: (14.5, 12.5) to (23, 10.5), width 2.6, stroke #D4D4D8
  const forearmDist = distToSegment(vx, vy, 14.5, 12.5, 23.0, 10.5);
  if (forearmDist <= 1.3) {
    r = 212; g = 212; b = 216; // #D4D4D8
  }

  // 5. Gripper Claws (White #FFFFFF, width 1.8)
  const upperClaw1 = distToSegment(vx, vy, 23.0, 10.5, 26.8, 7.5);
  const upperClaw2 = distToSegment(vx, vy, 26.8, 7.5, 29.2, 9.2);
  const lowerClaw1 = distToSegment(vx, vy, 23.0, 10.5, 26.8, 13.5);
  const lowerClaw2 = distToSegment(vx, vy, 26.8, 13.5, 29.2, 11.8);
  if (upperClaw1 <= 0.9 || upperClaw2 <= 0.9 || lowerClaw1 <= 0.9 || lowerClaw2 <= 0.9) {
    r = 255; g = 255; b = 255; // #FFFFFF
  }

  // 6. Base Joint Pivot: (9.5, 25)
  const dBase = Math.sqrt((vx - 9.5) * (vx - 9.5) + (vy - 25.0) * (vy - 25.0));
  if (dBase <= 2.6) {
    if (dBase <= 1.2) {
      r = 255; g = 92; b = 0; // Safety Orange #FF5C00
    } else if (dBase <= 1.7) {
      r = 24; g = 26; b = 32;  // Joint Hub #181A20
    } else {
      r = 244; g = 244; b = 246; // Outer ring #F4F4F6
    }
  }

  // 7. Elbow Joint Pivot: (14.5, 12.5)
  const dElbow = Math.sqrt((vx - 14.5) * (vx - 14.5) + (vy - 12.5) * (vy - 12.5));
  if (dElbow <= 2.5) {
    if (dElbow <= 1.15) {
      r = 16; g = 185; b = 129; // Telemetry Emerald #10B981
    } else if (dElbow <= 1.6) {
      r = 24; g = 26; b = 32;   // Joint Hub #181A20
    } else {
      r = 244; g = 244; b = 246; // Outer ring #F4F4F6
    }
  }

  // 8. Wrist Joint Pivot: (23.0, 10.5)
  const dWrist = Math.sqrt((vx - 23.0) * (vx - 23.0) + (vy - 10.5) * (vy - 10.5));
  if (dWrist <= 2.0) {
    if (dWrist <= 0.95) {
      r = 255; g = 92; b = 0;  // Safety Orange #FF5C00
    } else if (dWrist <= 1.35) {
      r = 24; g = 26; b = 32;   // Joint Hub #181A20
    } else {
      r = 244; g = 244; b = 246; // Outer ring #F4F4F6
    }
  }

  return [r, g, b, a];
}

/**
 * Super-sampled anti-aliased icon renderer (4x4 = 16 samples per pixel).
 */
function renderIcon(size) {
  const rowBytes = size * 4;
  const buf = Buffer.alloc(rowBytes * size);
  const subSamples = 4;
  const totalSub = subSamples * subSamples;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0;

      for (let sy = 0; sy < subSamples; sy++) {
        for (let sx = 0; sx < subSamples; sx++) {
          const px = x + (sx + 0.5) / subSamples;
          const py = y + (sy + 0.5) / subSamples;
          const vx = (px / size) * 32.0;
          const vy = (py / size) * 32.0;

          const [sr, sg, sb, sa] = sampleIcon(vx, vy);
          sumR += sr;
          sumG += sg;
          sumB += sb;
          sumA += sa;
        }
      }

      const offset = (y * size + x) * 4;
      buf[offset] = Math.round(sumR / totalSub);
      buf[offset + 1] = Math.round(sumG / totalSub);
      buf[offset + 2] = Math.round(sumB / totalSub);
      buf[offset + 3] = Math.round(sumA / totalSub);
    }
  }

  return encodePng(size, size, buf);
}

/**
 * Packs multiple PNG buffers into a multi-resolution Windows .ico file.
 */
function createIco(images) {
  // Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = Icon
  header.writeUInt16LE(images.length, 4); // Number of images

  let offset = 6 + images.length * 16;
  const dirEntries = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Colors (0 = >= 8bpp)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset to image data
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...images.map(img => img.buffer)
  ]);
}

// =========================================================================
// Main Generator Execution
// =========================================================================
function main() {
  const publicDir = path.resolve(__dirname, '../public');

  console.log('--- GENERATING PRODUCTION FAVICONS & SEARCH ENGINE ASSETS ---');

  // Render individual resolutions
  console.log('[+] Rendering 16x16 icon...');
  const png16 = renderIcon(16);

  console.log('[+] Rendering 32x32 icon...');
  const png32 = renderIcon(32);

  console.log('[+] Rendering 48x48 icon (Google Search Spec)...');
  const png48 = renderIcon(48);
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), png48);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), png48);

  console.log('[+] Rendering 96x96 icon...');
  const png96 = renderIcon(96);
  fs.writeFileSync(path.join(publicDir, 'favicon-96x96.png'), png96);

  console.log('[+] Rendering 180x180 Apple Touch Icon...');
  const png180 = renderIcon(180);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);

  console.log('[+] Rendering 192x192 Android / Chrome Icon...');
  const png192 = renderIcon(192);
  fs.writeFileSync(path.join(publicDir, 'favicon-192x192.png'), png192);

  // Package multi-size favicon.ico (16, 32, 48)
  console.log('[+] Packaging multi-resolution favicon.ico...');
  const icoBuffer = createIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  console.log('✅ ALL FAVICONS GENERATED SUCCESSFULLY:');
  console.log(`   - public/favicon.ico (${icoBuffer.length} bytes)`);
  console.log(`   - public/favicon-48x48.png (${png48.length} bytes)`);
  console.log(`   - public/favicon-96x96.png (${png96.length} bytes)`);
  console.log(`   - public/favicon-192x192.png (${png192.length} bytes)`);
  console.log(`   - public/apple-touch-icon.png (${png180.length} bytes)`);
}

main();

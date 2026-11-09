const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// =========================================================================
// 1. GENERATE PROFESSIONAL RESUME PDF (Clean Executive Engineering Format)
// =========================================================================
function generatePdf() {
  const width = 595.28; // A4 pt
  const height = 841.89;

  let stream = '';

  const add = (cmd) => {
    stream += cmd + '\n';
  };

  // Pure clean white background
  add('1 1 1 rg');
  add(`0 0 ${width} ${height} re f`);

  // Margins
  const marginX = 40;
  const contentWidth = width - marginX * 2;
  let y = height - 42;

  // Name Header: Bold, elegant, executive
  add('0.07 0.09 0.13 rg');
  add('BT');
  add('/F3 21 Tf');
  add(`${marginX} ${y} Td`);
  add('(AAKASH SHARMA) Tj');
  add('ET');
  y -= 15;

  // Subtitle: Role & College
  add('0.22 0.25 0.30 rg');
  add('BT');
  add('/F3 9.5 Tf');
  add(`${marginX} ${y} Td`);
  add('(Robotics & Embedded Systems Engineer  |  Third-Year B.Tech in Robotics & AI, JSPM University Pune) Tj');
  add('ET');
  y -= 13;

  // Contact & Links row
  add('0.35 0.38 0.44 rg');
  add('BT');
  add('/F1 8.5 Tf');
  add(`${marginX} ${y} Td`);
  add('(aakashsharma0439@gmail.com   |   Pune, India   |   github.com/Aakash439   |   linkedin.com/in/aakash-sharma   |   aakashsharma.dev) Tj');
  add('ET');
  y -= 10;

  // Divider line under header
  add('0.82 0.84 0.88 RG');
  add('0.75 w');
  add(`${marginX} ${y} m ${width - marginX} ${y} l S`);
  y -= 15;

  function sectionHeader(title) {
    add('0.08 0.10 0.15 rg');
    add('BT');
    add('/F3 9.5 Tf');
    add(`${marginX} ${y} Td`);
    add(`(${title}) Tj`);
    add('ET');

    // Subtle horizontal rule right after section title
    y -= 3;
    add('0.85 0.87 0.90 RG');
    add('0.5 w');
    add(`${marginX} ${y} m ${width - marginX} ${y} l S`);
    y -= 11;
  }

  // --- SECTION 1: EDUCATION ---
  sectionHeader('EDUCATION');

  // B.Tech
  add('0.08 0.10 0.15 rg');
  add('BT');
  add('/F3 8.5 Tf');
  add(`${marginX} ${y} Td`);
  add('(JSPM University Pune) Tj');
  add('ET');

  add('0.35 0.38 0.44 rg');
  add('BT');
  add('/F1 8 Tf');
  add(`${width - marginX - 110} ${y} Td`);
  add('(Pune, India   |   08/2024 - Present) Tj');
  add('ET');
  y -= 10;

  add('0.15 0.18 0.22 rg');
  add('BT');
  add('/F3 8 Tf');
  add(`${marginX} ${y} Td`);
  add('(Bachelor of Technology in Robotics & Artificial Intelligence (Third Year, Pursuing)) Tj');
  add('ET');
  y -= 10;

  add('0.3 0.33 0.38 rg');
  add('BT');
  add('/F1 7.5 Tf');
  add(`${marginX + 10} ${y} Td`);
  add('(- Core Focus: Autonomous Mobile Robotics, Closed-Loop Motor Drives, Real-Time AI, Kinematics, Embedded C/C++) Tj');
  add('ET');
  y -= 12;

  // HSC & SSC
  add('0.08 0.10 0.15 rg');
  add('BT');
  add('/F3 8 Tf');
  add(`${marginX} ${y} Td`);
  add('(K.M. Agrawal Jr. College, Kalyan, MH) Tj');
  add('ET');

  add('0.35 0.38 0.44 rg');
  add('BT');
  add('/F1 8 Tf');
  add(`${width - marginX - 90} ${y} Td`);
  add('(07/2021 - 03/2023) Tj');
  add('ET');

  add('0.25 0.28 0.32 rg');
  add('BT');
  add('/F1 7.5 Tf');
  add(`${marginX + 190} ${y} Td`);
  add('(- Higher Secondary Certificate (HSC) in Science & Mathematics) Tj');
  add('ET');
  y -= 11;

  add('0.08 0.10 0.15 rg');
  add('BT');
  add('/F3 8 Tf');
  add(`${marginX} ${y} Td`);
  add('(St. Mary\'s High School) Tj');
  add('ET');

  add('0.25 0.28 0.32 rg');
  add('BT');
  add('/F1 7.5 Tf');
  add(`${marginX + 120} ${y} Td`);
  add('(- Secondary School Certificate (SSC) | Completed foundational curriculum) Tj');
  add('ET');
  y -= 16;

  // --- SECTION 2: TECHNICAL ARSENAL ---
  sectionHeader('TECHNICAL ARSENAL');

  const skills = [
    { cat: 'Microcontrollers & Hardware', items: 'ATmega328P, STM32 (ARM Cortex), Arduino Platform, ESP32, Raspberry Pi' },
    { cat: 'Motor Drives & Power', items: 'L298N Dual H-Bridge, Star-Grounded Dual-Rail Power, Geared DC Drives, Steppers, Servos' },
    { cat: 'Firmware & Control Loops', items: 'Hardware Timer1 PWM, Lookahead PID, Exponential Moving Average (EMA), Non-blocking FSMs, UART, I2C, SPI' },
    { cat: 'Sensors & Instrumentation', items: 'LM35 Thermal, SW-420 Shock, MQ-series Gas, Ultrasonic ToF, PIR, Reflectance IR Arrays, Oscilloscopes, DMM' },
    { cat: 'Software, Simulation & CAD', items: 'Embedded C/C++, Python, KiCad EDA, SolidWorks, Logic Analyzers, Git' }
  ];

  for (const s of skills) {
    add('0.08 0.10 0.15 rg');
    add('BT');
    add('/F3 8 Tf');
    add(`${marginX} ${y} Td`);
    add(`(${s.cat}:) Tj`);
    add('ET');

    add('0.25 0.28 0.32 rg');
    add('BT');
    add('/F1 8 Tf');
    add(`${marginX + 130} ${y} Td`);
    add(`(${s.items}) Tj`);
    add('ET');
    y -= 11.5;
  }
  y -= 6;

  // --- SECTION 3: KEYSTONE ENGINEERING BUILDS ---
  sectionHeader('KEYSTONE ENGINEERING BUILDS & PROJECTS');

  const projects = [
    {
      title: 'MotorGuard - Smart Industrial Motor Protection & Condition-Based Monitoring (CBM)',
      meta: 'ATmega328P, Timer1 Hardware PWM, LM35 EMA, SW-420 Shock, 3S Dual-Rail Li-Ion',
      bullets: [
        'Engineered non-blocking FSM with dual-stage thermal derating: 65% PWM limp-home at 50 deg C, shutdown at 60 deg C (3 deg C hysteresis).',
        'Built sub-15ms casing fluid ingress cutoff and SW-420 bearing vibration lockout to prevent catastrophic field failures.',
        'Developed asymmetric (+3 / -6 step) duty-cycle slew limiting in Timer1 ISR to eliminate inrush current spikes.'
      ]
    },
    {
      title: '6WD All-Terrain Autonomous Mobile Robot Platform',
      meta: 'Skid-Steer Kinematics, 6-Motor Independent Drivetrain, 360-deg Obstacle Array',
      bullets: [
        'Designed high-torque 6-wheel-drive mobile base capable of navigating rubble and unstructured outdoor terrain.',
        'Implemented differential left/right bank velocity mixing enabling instantaneous 0-degree pivot skid turns.',
        'Integrated 360-degree ultrasonic telemetry array for continuous spatial mapping and autonomous evasion.'
      ]
    },
    {
      title: 'High-Speed Autonomous Line-Following AGV (Automated Guided Vehicle)',
      meta: 'High-Density Reflectance IR Array, Lookahead PID Loop, Microsecond ADC Polling',
      bullets: [
        'Designed front-mounted 5-channel reflectance sensor array with weighted centroid calculation (+/-0.5 mm deviation).',
        'Tuned closed-loop Kp/Ki/Kd differential steering loop executing at sub-millisecond polling rates for acute track junctions.'
      ]
    },
    {
      title: 'Vehicular Alcohol Detection & Active Braking Interlock System',
      meta: 'MQ Gas Spectrometry, Ignition Cutoff Relay, Progressive ECU Limp-Home FSM',
      bullets: [
        'Developed automotive safety interlock sampling driver breath alcohol concentration (BAC) in real-time.',
        'Constructed progressive 3-stage FSM: audible cabin alert -> 50% PWM throttle derating -> full electronic ignition lockout.'
      ]
    },
    {
      title: 'Automated Contactless Door Access & Motion System',
      meta: 'Ultrasonic Time-of-Flight, Dual PIR Arrays, Anti-Pinch Current Feedback',
      bullets: [
        'Engineered contactless entrance system fusing ultrasonic ToF ranging and PIR motion to eliminate false hallway triggers.',
        'Implemented armature current-sensing safety interlock tripping instant auto-reversal upon < 1.2A pinch resistance.'
      ]
    }
  ];

  for (const p of projects) {
    add('0.08 0.10 0.15 rg');
    add('BT');
    add('/F3 8.5 Tf');
    add(`${marginX} ${y} Td`);
    add(`(${p.title}) Tj`);
    add('ET');

    add('0.45 0.48 0.52 rg');
    add('BT');
    add('/F1 7.5 Tf');
    add(`${marginX} ${y - 9} Td`);
    add(`([Stack: ${p.meta}]) Tj`);
    add('ET');
    y -= 18;

    for (const b of p.bullets) {
      add('0.25 0.28 0.32 rg');
      add('BT');
      add('/F1 7.5 Tf');
      add(`${marginX + 10} ${y} Td`);
      add(`(- ${b}) Tj`);
      add('ET');
      y -= 9.5;
    }
    y -= 3;
  }
  y -= 3;

  // --- SECTION 4: CAMPUS EVENTS & PRACTICAL EXPERIENCE ---
  sectionHeader('CAMPUS EVENTS & PRACTICAL EXPERIENCE');

  // Campus Events
  add('0.08 0.10 0.15 rg');
  add('BT');
  add('/F3 8.5 Tf');
  add(`${marginX} ${y} Td`);
  add('(Campus Technical Events - JSPM University Pune) Tj');
  add('ET');

  add('0.35 0.38 0.44 rg');
  add('BT');
  add('/F1 8 Tf');
  add(`${width - marginX - 100} ${y} Td`);
  add('(Pune, India   |   2026) Tj');
  add('ET');
  y -= 9.5;

  add('0.15 0.18 0.22 rg');
  add('BT');
  add('/F3 8 Tf');
  add(`${marginX} ${y} Td`);
  add('(Role: Lead Technical Organizer) Tj');
  add('ET');
  y -= 9.5;

  add('0.25 0.28 0.32 rg');
  add('BT');
  add('/F1 7.5 Tf');
  add(`${marginX + 10} ${y} Td`);
  add('(- Lead Organizer: Track Titans - Intercollege Line Following Robotic Competition (23rd March 2026).) Tj');
  y -= 9;
  add(`0 -9 Td`);
  add('(- Lead Organizer: ROBOTzAI x Monster Energy BGMI Mobile Battle Game (Official Partner: Monster Energy, 16-17 Sep 2026).) Tj');
  add('ET');
  y -= 13;

  // Internship
  add('0.08 0.10 0.15 rg');
  add('BT');
  add('/F3 8.5 Tf');
  add(`${marginX} ${y} Td`);
  add('(JSPM University Pune) Tj');
  add('ET');

  add('0.35 0.38 0.44 rg');
  add('BT');
  add('/F1 8 Tf');
  add(`${width - marginX - 130} ${y} Td`);
  add('(Pune, India   |   05/2025 - 07/2025) Tj');
  add('ET');
  y -= 9.5;

  add('0.15 0.18 0.22 rg');
  add('BT');
  add('/F3 8 Tf');
  add(`${marginX} ${y} Td`);
  add('(Role: Student Intern - Machining & Precision Fabrication) Tj');
  add('ET');
  y -= 9.5;

  add('0.25 0.28 0.32 rg');
  add('BT');
  add('/F1 7.5 Tf');
  add(`${marginX + 10} ${y} Td`);
  add('(- Completed hands-on training on CNC (Computer Numerical Control) and VMC (Vertical Machining Centre) milling machinery.) Tj');
  add('ET');

  // Build PDF Objects
  const objects = [];
  function createObject(content) {
    objects.push(content);
    return objects.length;
  }

  const fontF1 = createObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontF2 = createObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  const fontF3 = createObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  const streamLen = Buffer.byteLength(stream, 'latin1');
  const contentObj = createObject(`<< /Length ${streamLen} >>\nstream\n${stream}\nendstream`);

  const pageObj = createObject(
    `<< /Type /Page /Parent 6 0 R /MediaBox [0 0 ${width} ${height}] /Contents ${contentObj} 0 R /Resources << /Font << /F1 ${fontF1} 0 R /F2 ${fontF2} 0 R /F3 ${fontF3} 0 R >> >> >>`
  );

  const pagesObj = createObject(`<< /Type /Pages /Kids [${pageObj} 0 R] /Count 1 >>`);
  const catalogObj = createObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  // Assemble cross reference table
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const off = offsets[i].toString().padStart(10, '0');
    pdf += `${off} 00000 n \n`;
  }

  pdf += 'trailer\n';
  pdf += `<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF\n';

  const outDir = path.resolve(__dirname, '../public/resume');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const resumePath = path.join(outDir, 'resume.pdf');
  fs.writeFileSync(resumePath, Buffer.from(pdf, 'latin1'));
  console.log(`[OK] Generated resume PDF at: ${resumePath} (${pdf.length} bytes)`);

  // Also write to public/resume.pdf so both paths work
  fs.writeFileSync(path.resolve(__dirname, '../public/resume.pdf'), Buffer.from(pdf, 'latin1'));
  console.log(`[OK] Copied to public/resume.pdf`);
}

// =========================================================================
// 2. GENERATE OG-PREVIEW PNG (1200x630 Social Card)
// =========================================================================
function generateOgImage() {
  const width = 1200;
  const height = 630;

  // We will build an uncompressed raw RGB buffer and format as PNG with zlib
  const rowBytes = width * 3;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const rowStart = y * (rowBytes + 1);
    const pixelStart = rowStart + 1 + x * 3;
    rawData[pixelStart] = r;
    rawData[pixelStart + 1] = g;
    rawData[pixelStart + 2] = b;
  }

  // Simple 5x7 bitmap font for crisp industrial text
  const FONT_5X7 = {
    'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    'B': [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
    'C': [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E],
    'D': [0x1C, 0x12, 0x11, 0x11, 0x11, 0x12, 0x1C],
    'E': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F],
    'F': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
    'G': [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0F],
    'H': [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
    'J': [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
    'K': [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
    'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
    'M': [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11],
    'N': [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
    'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    'P': [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
    'Q': [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D],
    'R': [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
    'S': [0x0E, 0x11, 0x10, 0x0E, 0x01, 0x11, 0x0E],
    'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
    'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
    'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0A],
    'X': [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
    'Y': [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
    'Z': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
    '0': [0x0E, 0x13, 0x15, 0x11, 0x15, 0x19, 0x0E],
    '1': [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
    '2': [0x0E, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1F],
    '3': [0x1F, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0E],
    '4': [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02],
    '5': [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
    '6': [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E],
    '7': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
    '8': [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E],
    '9': [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
    ':': [0x00, 0x04, 0x04, 0x00, 0x04, 0x04, 0x00],
    '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x04],
    '-': [0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00],
    '/': [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
    '[': [0x0E, 0x08, 0x08, 0x08, 0x08, 0x08, 0x0E],
    ']': [0x0E, 0x02, 0x02, 0x02, 0x02, 0x02, 0x0E],
    '#': [0x0A, 0x0A, 0x1F, 0x0A, 0x1F, 0x0A, 0x0A],
    '+': [0x00, 0x04, 0x04, 0x1F, 0x04, 0x04, 0x00],
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  };

  function drawText(text, startX, startY, scale, r, g, b) {
    const upper = text.toUpperCase();
    let curX = startX;
    for (let i = 0; i < upper.length; i++) {
      const char = upper[i];
      const glyph = FONT_5X7[char] || FONT_5X7[' '];
      for (let row = 0; row < 7; row++) {
        const bits = glyph[row];
        for (let col = 0; col < 5; col++) {
          if ((bits >> (4 - col)) & 1) {
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                setPixel(curX + col * scale + dx, startY + row * scale + dy, r, g, b);
              }
            }
          }
        }
      }
      curX += 6 * scale;
    }
  }

  function fillRect(x0, y0, w, h, r, g, b) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        setPixel(x, y, r, g, b);
      }
    }
  }

  // 1. Fill base dark PCB workbench (#161618)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 20, g = 21, b = 24;
      // Grid pattern (dots every 30px)
      if (x % 30 === 0 && y % 30 === 0) {
        r = 45; g = 48; b = 55;
      }
      setPixel(x, y, r, g, b);
    }
  }

  // 2. Hardware outer border
  fillRect(40, 40, width - 80, 2, 60, 64, 75);
  fillRect(40, height - 42, width - 80, 2, 60, 64, 75);
  fillRect(40, 40, 2, height - 80, 60, 64, 75);
  fillRect(width - 42, 40, 2, height - 80, 60, 64, 75);

  // 3. Top accent bar in signature orange
  fillRect(42, 42, width - 84, 6, 255, 85, 0);

  // 4. Header status banner
  fillRect(65, 75, 12, 12, 255, 85, 0); // REC dot
  drawText('LIVE FIELD WORKBENCH // PUNE, IN', 90, 77, 2, 200, 200, 205);
  drawText('SYSTEM NOMINAL - REV 3.2', 880, 77, 2, 100, 200, 120);

  // 5. Main Title: AAKASH SHARMA
  drawText('AAKASH SHARMA', 65, 130, 8, 255, 255, 255);

  // 6. Orange Role Badge
  fillRect(65, 200, 560, 40, 255, 85, 0);
  drawText('ROBOTICS & EMBEDDED SYSTEMS ENGINEER', 80, 212, 3, 10, 10, 12);

  // 7. Core Capabilities Subtitle
  drawText('CLOSED-LOOP MOTOR DRIVES // REAL-TIME SENSOR FUSION // AGV KINEMATICS', 65, 265, 2, 180, 185, 195);
  drawText('NON-BLOCKING FSM ARCHITECTURES // TIMER1 PWM SLEW // AUTONOMOUS ROBOTICS', 65, 290, 2, 140, 145, 155);

  // 8. Visual Metric Cards (3 Telemetry Modules)
  const cardY = 345;
  const cardW = 330;
  const cardH = 140;

  function drawCard(x, label, stat, desc) {
    fillRect(x, cardY, cardW, cardH, 28, 30, 35);
    // Card border
    fillRect(x, cardY, cardW, 1, 60, 65, 75);
    fillRect(x, cardY + cardH - 1, cardW, 1, 60, 65, 75);
    fillRect(x, cardY, 1, cardH, 60, 65, 75);
    fillRect(x + cardW - 1, cardY, 1, cardH, 60, 65, 75);

    // Accent top
    fillRect(x + 1, cardY + 1, cardW - 2, 2, 255, 85, 0);

    drawText(label, x + 20, cardY + 18, 2, 160, 165, 175);
    drawText(stat, x + 20, cardY + 50, 5, 255, 255, 255);
    drawText(desc, x + 20, cardY + 105, 2, 130, 135, 145);
  }

  drawCard(65, 'MOTORGUARD // SAFETY', '< 15 MS', 'EMERGENCY CUTOFF LATENCY');
  drawCard(435, 'AGV TRACKING // PID', '+/-0.5 MM', 'CLOSED-LOOP DEVIATION');
  drawCard(805, 'ALL-TERRAIN // SKID', '6WD IND', '0-DEG ZERO RADIUS TURN');

  // 9. Footer Info Strip
  fillRect(42, 530, width - 84, 1, 50, 55, 65);
  drawText('DOMAIN: ROBOTICSAAKASH.VERCEL.APP', 65, 555, 2, 180, 185, 195);
  drawText('GITHUB: GITHUB.COM/AAKASH439', 510, 555, 2, 180, 185, 195);
  drawText('STATUS: OPEN TO ROLES', 950, 555, 2, 100, 220, 120);

  // Compress into PNG with Deflate
  const compressed = zlib.deflateSync(rawData);

  // PNG Builder
  function pngChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC-32
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Precomputed CRC table
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

  // IHDR: 13 bytes
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 2; // Color type 2: RGB
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = pngChunk('IHDR', ihdr);
  const idatChunk = pngChunk('IDAT', compressed);
  const iendChunk = pngChunk('IEND', Buffer.alloc(0));

  const pngFile = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);

  const outDir = path.resolve(__dirname, '../public/images');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'og-preview.png');
  fs.writeFileSync(outPath, pngFile);
  console.log(`[OK] Generated og-preview.png at: ${outPath} (${pngFile.length} bytes)`);
}

generatePdf();
generateOgImage();

/**
 * AAKASH SHARMA — ROBOTICS & EMBEDDED SYSTEMS ENGINEER
 * Authentic personal engineering projects, Apple-scale keynote metrics, and Periodic Tech Arsenal.
 */

export interface SystemSpecCell {
  category: string;
  name: string;
  applicationNote: string;
}

export interface KeynoteStat {
  value: string;
  label: string;
}

export type ProjectVisualizerType =
  | 'motorguard-cbm'
  | 'rover-6wd'
  | 'agv-line-pid'
  | 'ecu-alcohol-safety'
  | 'contactless-door';

/** Text shown inside each project's animated hardware viewport (right side of the card). */
export interface ViewportCopy {
  /** Top-left label, e.g. 'LM35 EMA · TIMER1 PWM' */
  label: string;
  /** Top-right status in normal operation */
  status: string;
  /** Top-right status while the fault simulation is active */
  faultStatus: string;
  /** Bottom-left caption in normal operation */
  footer: string;
  /** Bottom-left caption while the fault simulation is active */
  faultFooter: string;
  /** Text on the fault-injection button */
  faultButton: string;
}

export interface ProjectWork {
  id: string;
  index: string;
  slug: string;
  isFlagship?: boolean;
  shortTitle: string;
  domainKicker: string;
  title: string;
  summary: string;
  stats: [KeynoteStat, KeynoteStat, KeynoteStat];
  tools: string[];
  visualizerType: ProjectVisualizerType;
  ledColor: 'orange' | 'green';
  viewport: ViewportCopy;
  detail: {
    overview: string;
    highlights: string[];
    systemSpecCells: SystemSpecCell[];
  };
}

export interface CoreSystemBentoColumn {
  columnLabel: string;
  header: string;
  stat: string;
  led: 'orange' | 'green';
  items: string[];
}

export interface ArsenalItem {
  name: string;
  sub: string;
  abbr: string;
  textColor: string;
  bgTint: string;
  borderTint: string;
  glowColor: string;
}

export interface ArsenalCategory {
  category: string;
  items: ArsenalItem[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  timeline: string;
  location: string;
  details: string;
  statusBadge?: string;
}

export interface ExperienceItem {
  role: string;
  organization: string;
  timeline: string;
  location: string;
  description: string;
  tag: string;
}

export interface CertificationItem {
  title: string;
  issuer: string;
  badge: string;
}

export const PERSONAL_PROFILE = {
  name: 'Aakash Sharma',
  designation: 'Aspiring Robotics Engineer (Third Year) | Developer',
  
  /**
   * Your live website address (no trailing slash). Used for the sitemap, robots.txt
   * and social-share previews. Update this once you know your domain.
   */
  siteUrl: 'https://aakashrobotics.tech',
  eyebrowLocation: 'Pune | Kalyan, India',
  heroHeadlineLine1: 'Building autonomous machines',
  heroHeadlineLine2: 'and real-time embedded control.',
  heroSubheadline:
    'Third-year Robotics & AI engineering student at JSPM University Pune. Specialized in autonomous mobile robotics, closed-loop motor drives, and real-time control.',
  stageTelemetryTag: '6-DoF Kinematics · Real-Time IK · Interactive Canvas',
  aboutEditorialImage: '/images/workshop-bench.jpg',
  contact: {
    email: 'contact@aakashrobotics.tech',
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/Aakash439',
        handle: 'github.com/Aakash439',
      },
      {
        label: 'Instagram',
        href: 'https://instagram.com/aakashsharma0439',
        handle: '@aakashsharma0439',
      },
      {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/aakash-sharma-69bbb5329/',
        handle: 'linkedin.com/in/aakash-sharma',
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  HERO STAGE — interactive robotic arm                               */
/* ------------------------------------------------------------------ */
export const HERO_STAGE = {
  title: 'ARTICULATED MANIPULATOR & GRIPPER STAGE',
  hint: 'CLICK TO GRIP · CLICK AGAIN TO RELEASE',
  dropZoneLabel: 'DROP ZONE',
  /** Labels printed on the blocks the visitor can pick up (3–4 works best). */
  objects: ['MCU', 'IMU', 'ESC'],
};

/* ------------------------------------------------------------------ */
/*  LOADING SCREEN                                                     */
/* ------------------------------------------------------------------ */
export const BOOT_SEQUENCE = {
  title: 'HARDWARE TELEMETRY BOOT',
  steps: [
    'INITIALIZING 3-DOF PLANAR IK SOLVER',
    'CALIBRATING TIMER1 PWM & SENSOR ARRAYS',
    'MOUNTING 05 EMBEDDED HARDWARE PROTOCOLS',
    'SYSTEM NOMINAL · READY',
  ],
  footerLeft: 'SYS · Jetson · STM32 · ROS 2',
};

/* ------------------------------------------------------------------ */
/*  ABOUT SECTION                                                      */
/* ------------------------------------------------------------------ */
export const ABOUT_SECTION = {
  kicker: 'Engineer Profile & Credentials',
  statusLine: 'SYS · Active & Building (Third Year)',
  pillars: [
    {
      tag: '01 · EMBEDDED',
      title: 'Hardware & Power Delivery',
      spec: 'Star-grounded dual-rail power, H-Bridge drivers, and bare-metal C/C++.',
    },
    {
      tag: '02 · CONTROL',
      title: 'Closed-Loop Kinematics',
      spec: 'Non-blocking FSMs, Timer1 PWM slew engines, and PID trajectory tracking.',
    },
    {
      tag: '03 · AUTONOMY',
      title: 'Multi-Sensor Fusion',
      spec: 'EMA thermal filtering, vibration lockouts, and optical/ultrasonic arrays.',
    },
  ],
  education: [
    {
      degree: 'B.Tech in Robotics & AI',
      institution: 'JSPM University Pune',
      timeline: '08/2024 – Pursuing',
      location: 'Pune, India',
      details: 'Third Year Undergraduate · Core focus on Autonomous Systems, AI, Kinematics & Embedded Control.',
      statusBadge: 'THIRD YEAR · ACTIVE',
    },
    {
      degree: 'Higher Secondary Certificate (HSC)',
      institution: 'K.M. Agrawal Jr. College',
      timeline: '07/2021 – 03/2023',
      location: 'Kalyan, Maharashtra',
      details: 'Higher Secondary Science & Mathematics curriculum.',
      statusBadge: 'COMPLETED',
    },
    {
      degree: 'Secondary School Certificate (SSC)',
      institution: "St. Mary's High School",
      timeline: 'Completed',
      location: 'Maharashtra',
      details: 'Foundational schooling and science education.',
      statusBadge: 'COMPLETED',
    },
  ] as EducationItem[],
  leadership: [
    {
      role: 'Track Titans — Lead Organizer',
      organization: 'Intercollege Line Following Robotic Competition',
      timeline: '23 March 2026',
      location: 'JSPM University Pune',
      description: 'Organised and directed "Track Titans", a premier intercollegiate autonomous line-following robotics competition under ROBOTzAI with multi-college engineering team participation and track benchmarking.',
      tag: '1ST EVENT',
    },
    {
      role: 'ROBOTzAI × Monster Energy BGMI Mobile Battle Game',
      organization: 'Official Partner: Monster Energy',
      timeline: '16 – 17 September 2026',
      location: 'JSPM University Pune',
      description: 'Directed high-engagement campus e-sports championship with Monster Energy as official partner. Managed tournament brackets, multi-team registrations, live staging, and sponsor activations.',
      tag: '2ND EVENT',
    },
  ] as ExperienceItem[],
  experience: [
    {
      role: 'Student Intern (Machining & Fabrication)',
      organization: 'JSPM University Pune',
      timeline: '05/2025 – 07/2025',
      location: 'Pune, India',
      description: 'Hands-on practical workshop training on CNC (Computer Numerical Control) and VMC (Vertical Machining Centre) precision milling machining.',
      tag: 'CNC / VMC FABRICATION',
    },
  ] as ExperienceItem[],
  imageAlt: 'Field Workbench at JSPM Lab, Pune with soldering iron, multimeter, and robotic chassis',
  imageCaption: 'WORKBENCH',
};

/* ------------------------------------------------------------------ */
/*  CONTACT SECTION                                                    */
/* ------------------------------------------------------------------ */
export const CONTACT_SECTION = {
  availability: 'Available for Robotics & Embedded Roles',
  cityLabel: 'PUNE, IN',
  heading: 'Get in touch.',
  blurb:
    'Direct correspondence for hardware engineering roles, robotics builds, and technical collaborations.',
  /** `id` is written into the email subject line; `label` is the button text. */
  inquiryTypes: [
    { id: 'Full-Time / Internship Role', label: 'Role / Hiring' },
    { id: 'Robotics R&D Collaboration', label: 'R&D Collab' },
    { id: 'Embedded / Hardware Prototype', label: 'Hardware Build' },
  ],
};

export const PROJECTS: ProjectWork[] = [
  {
    id: 'motorguard-cbm',
    index: '01',
    slug: 'motorguard-industrial-motor-protection-cbm',
    isFlagship: true,
    shortTitle: 'MotorGuard',
    domainKicker: 'Embedded CBM & Safety Interlocks',
    title: 'MotorGuard (Smart Industrial Motor Protection & CBM)',
    summary:
      'Intelligent condition-based monitoring with non-blocking FSM safety cutoffs and two-stage thermal derating.',
    stats: [
      { value: '< 15 ms', label: 'Cutoff Latency' },
      { value: '50 / 60°C', label: 'Two-Stage Derate' },
      { value: '115.2 kbps', label: 'Serial Diagnostics' },
    ],
    tools: ['Embedded C/C++', 'ATmega328P', 'Timer1 PWM', 'L298N', 'SW-420'],
    visualizerType: 'motorguard-cbm',
    ledColor: 'orange',
    viewport: {
      label: 'LM35 EMA · TIMER1 PWM',
      status: 'Nominal',
      faultStatus: 'Cutoff Active',
      footer: '50°C → 65% · 60°C → Cutoff',
      faultFooter: 'Emergency 0% Relay Cutoff',
      faultButton: 'Simulate 64°C Thermal Spike',
    },
    detail: {
      overview:
        'Non-blocking Finite State Machine Condition-Based Monitoring (CBM) system with dual-stage thermal derating, shock lockout, and fluid ingress protection.',
      highlights: [
        'LM35 + EMA filter (α = 0.12): 65% PWM limp-home at 50°C, full shutdown at 60°C (3°C cooling hysteresis).',
        'SW-420 shaft shock lockout & sub-15ms resistive casing fluid ingress cutoff.',
        'Hardware Timer1 PWM soft slew-rate engine (+3 / -6 step) & 3S Li-ion star-grounded dual-rail power.',
      ],
      systemSpecCells: [
        {
          category: 'Controller',
          name: 'ATmega328P + Timer1 PWM',
          applicationNote: 'Asymmetric +3 / -6 duty-cycle slew limiting at 115.2 kbps serial telemetry.',
        },
        {
          category: 'Thermal',
          name: 'LM35 + EMA (α = 0.12)',
          applicationNote: '65% PWM throttle at 50°C; full cutoff at 60°C with 3°C cooling deadband.',
        },
        {
          category: 'Fault Sensors',
          name: 'SW-420 & Fluid Seal Probe',
          applicationNote: 'Bearing shock lockout and <15ms emergency H-Bridge shutdown.',
        },
        {
          category: 'Power Rail',
          name: 'L298N & 3S Li-Ion Star-GND',
          applicationNote: '11.1V–12.6V motor rail isolated from 5V logic to eliminate brownouts.',
        },
      ],
    },
  },
  {
    id: 'rover-6wd',
    index: '02',
    slug: '6wd-all-terrain-autonomous-rover',
    shortTitle: '6WD Autonomous Rover',
    domainKicker: 'Field Robotics & Mobility',
    title: '6WD Autonomous Rover',
    summary:
      'All-terrain skid-steer mobile platform engineered for rugged traversal and obstacle mapping.',
    stats: [
      { value: '6WD', label: 'Independent Drives' },
      { value: '0°', label: 'Skid Turn Radius' },
      { value: '360°', label: 'Obstacle Telemetry' },
    ],
    tools: ['Skid-Steer Kinematics', 'Motor Drives', 'Chassis Packaging'],
    visualizerType: 'rover-6wd',
    ledColor: 'green',
    viewport: {
      label: '6WD VECTOR CHASSIS',
      status: '0° SKID-STEER',
      faultStatus: 'OBSTACLE · DIFF PIVOT',
      footer: 'INDEPENDENT BANK TORQUE',
      faultFooter: 'BANK A REVERSE · EVADING',
      faultButton: 'Simulate Terrain Lock',
    },
    detail: {
      overview:
        'Six-wheel-drive robotic platform engineered for continuous torque distribution, high obstacle clearance, and zero-radius skid-steer turns.',
      highlights: [
        'Independent six-motor drivetrain for rugged unstructured terrain traversal.',
        'Differential left/right bank velocity mixing for 0° point turns.',
        '360° multi-sensor obstacle detection and orientation telemetry payload.',
      ],
      systemSpecCells: [
        {
          category: 'Drivetrain',
          name: '6× Geared DC Drives',
          applicationNote: 'Continuous torque distribution across steep inclines and loose rubble.',
        },
        {
          category: 'Kinematics',
          name: 'Differential Skid-Steer',
          applicationNote: 'Counter-rotating bank control for zero-radius rotation in place.',
        },
      ],
    },
  },
  {
    id: 'agv-line-following',
    index: '03',
    slug: 'high-speed-autonomous-line-following-agv',
    shortTitle: 'Line-Following AGV',
    domainKicker: 'Warehouse Automation & Control',
    title: 'High-Speed Autonomous Line-Following AGV',
    summary:
      'Closed-loop PID path-tracking robot designed for warehouse AGV simulation and acute-angle navigation.',
    stats: [
      { value: 'PID', label: 'Closed-Loop Rate' },
      { value: '±0.5 mm', label: 'Tracking Deviation' },
      { value: 'Sub-ms', label: 'Sensor Polling' },
    ],
    tools: ['PID Control', 'IR Array', 'PWM Velocity'],
    visualizerType: 'agv-line-pid',
    ledColor: 'green',
    viewport: {
      label: 'CLOSED-LOOP PID TRACKING',
      status: 'IR CENTROID LOCK',
      faultStatus: 'OBSTACLE < 15CM · HALT',
      footer: '±0.5 MM DEVIATION',
      faultFooter: 'PWM ZEROED · OBSTACLE WAIT',
      faultButton: 'Inject Path Obstacle',
    },
    detail: {
      overview:
        'High-speed Automated Guided Vehicle utilizing front-mounted infrared reflectance arrays and closed-loop PID differential steering.',
      highlights: [
        'Microsecond ADC polling across front-mounted high-density IR sensor array.',
        'Tuned Kp/Ki/Kd loop minimizing cross-track error on acute-angle corners.',
        'Dynamic straightaway acceleration and inner-wheel corner braking.',
      ],
      systemSpecCells: [
        {
          category: 'Control Loop',
          name: 'Lookahead PID Controller',
          applicationNote: 'Derivative damping prevents overshoot across sharp warehouse junctions.',
        },
        {
          category: 'Sensing',
          name: 'High-Density IR Array',
          applicationNote: 'Weighted centroid calculation for sub-millimeter lateral tracking.',
        },
      ],
    },
  },
  {
    id: 'vehicular-alcohol-safety',
    index: '04',
    slug: 'smart-vehicular-alcohol-detection-engine-braking',
    shortTitle: 'Alcohol & Brake Interlock',
    domainKicker: 'Automotive Active Safety',
    title: 'Alcohol Detection & Active Braking System',
    summary:
      'Automotive safety interlock combining gas spectrometry with progressive engine throttling and ignition lockout.',
    stats: [
      { value: '3-Stage', label: 'Safety Interlock' },
      { value: '0% ECU', label: 'Progressive Lockout' },
      { value: 'MQ-Gas', label: 'Spectrometry' },
    ],
    tools: ['Automotive Safety', 'ECU Interfacing', 'State Machine'],
    visualizerType: 'ecu-alcohol-safety',
    ledColor: 'orange',
    viewport: {
      label: 'SAFETY STATE PROGRESSION',
      status: 'MQ → ECU INTERLOCK',
      faultStatus: 'BAC BREACH · LOCKED',
      footer: 'NORMAL → WARNING → LOCKOUT',
      faultFooter: 'IGNITION RELAY DISENGAGED',
      faultButton: 'Simulate BAC Trigger',
    },
    detail: {
      overview:
        'Automotive active-safety module combining real-time MQ gas spectrometry with graduated ECU throttle reduction and ignition lockout.',
      highlights: [
        'Continuous breath alcohol concentration (BAC) threshold sampling via MQ array.',
        'Progressive FSM: Cabin warning → ECU throttle derating → safe brake & ignition lockout.',
      ],
      systemSpecCells: [
        {
          category: 'Spectrometry',
          name: 'MQ-Series Gas Array',
          applicationNote: 'Real-time ethanol PPM monitoring with hysteresis threshold gating.',
        },
        {
          category: 'Intervention',
          name: 'Progressive ECU & Relay Stage',
          applicationNote: 'Graduated PWM throttle limiting followed by electronic brake interlock.',
        },
      ],
    },
  },
  {
    id: 'contactless-automated-door',
    index: '05',
    slug: 'contactless-automated-door-access-motion-system',
    shortTitle: 'Contactless Door System',
    domainKicker: 'Mechatronics & Access Control',
    title: 'Automated Contactless Door System',
    summary:
      'Touchless entrance automation utilizing ultrasonic/PIR intent detection with anti-pinch current sensing.',
    stats: [
      { value: 'ToF + PIR', label: 'Contactless Intent' },
      { value: '< 1.2 A', label: 'Anti-Pinch Trip' },
      { value: 'Low-Idle', label: 'Standby Mode' },
    ],
    tools: ['Mechatronics', 'Ultrasonic Sensing', 'High-Torque Drive'],
    visualizerType: 'contactless-door',
    ledColor: 'green',
    viewport: {
      label: 'PROXIMITY INTENT WAVE',
      status: 'ANTI-PINCH TRIP',
      faultStatus: '1.4A SPIKE · REVERSING',
      footer: 'ULTRASONIC + PIR ARRAY',
      faultFooter: 'AUTO-REVERSAL TRIGGERED',
      faultButton: 'Simulate Pinch Trip',
    },
    detail: {
      overview:
        'Sterile facility entryway automation fusing ultrasonic and PIR motion sensing with current-monitored anti-pinch motorized actuation.',
      highlights: [
        'Coincidence intent detection combining ultrasonic ToF ranging and PIR arrays.',
        'High-torque drive with armature current-sensing anti-pinch reversal and idle standby.',
      ],
      systemSpecCells: [
        {
          category: 'Sensing',
          name: 'Ultrasonic + PIR Array',
          applicationNote: 'Eliminates false cross-corridor triggers while holding door on presence.',
        },
        {
          category: 'Safety Drive',
          name: 'Anti-Pinch Current Trip',
          applicationNote: 'Instant auto-reversal upon obstacle contact with low-power sleep state.',
        },
      ],
    },
  },
];

export const SELECTED_WORK: ProjectWork[] = PROJECTS;

/** Heading text for the "Selected Projects" section on the homepage. */
export const PROJECTS_SECTION = {
  kicker: 'Selected Projects',
  heading: 'Physical Hardware & Embedded Systems.',
  counterLabel: `${String(PROJECTS.length).padStart(2, '0')} DEPLOYED PROTOCOLS`,
};

export const CORE_SYSTEMS_BENTO: CoreSystemBentoColumn[] = [
  {
    columnLabel: 'Compute & Microcontrollers',
    header: 'SBCs, Edge AI & Mini-PCs',
    stat: 'Jetson · STM32',
    led: 'orange',
    items: [
      'NVIDIA Jetson Edge AI & GPU Vision',
      'STM32 ARM Cortex-M (Bare-Metal / RTOS)',
      'Raspberry Pi 4 / 5 Compute Modules',
      'ESP32 Dual-Core Wireless & Micro-ROS',
      'CAN Bus, SPI & High-Speed UART',
    ],
  },
  {
    columnLabel: 'Autonomy & Perception',
    header: 'Robotics Middleware & Planning',
    stat: 'ROS 2 & SLAM',
    led: 'green',
    items: [
      'ROS / ROS 2 Computational Graphs',
      '2D / 3D LiDAR SLAM & Occupancy Grid',
      'Autonomous Path Planning (A*, Nav2)',
      'Sensor Fusion (EKF / IMU + Wheel Odom)',
      'OpenCV Real-Time Object Perception',
    ],
  },
  {
    columnLabel: 'Actuation & Hardware Interfaces',
    header: 'Drives, Power & Transducers',
    stat: 'Multi-Modal',
    led: 'orange',
    items: [
      'Intel RealSense Depth & ToF Ranging',
      '6-DoF IMU Inertial Kinematic Tracking',
      'BLDC, Stepper & Closed-Loop DC Drives',
      'Optical & Magnetic Quadrature Encoders',
      'Isolated Dual-Rail Power & BMS Topology',
    ],
  },
];

export const TECH_ARSENAL_CATEGORIES: ArsenalCategory[] = [
  {
    category: 'SOFTWARE & ARCHITECTURE',
    items: [
      {
        name: 'Python',
        sub: 'ADVANCED LOGIC & OOP',
        abbr: 'Py',
        textColor: 'text-sky-400',
        bgTint: 'bg-sky-500/[0.08]',
        borderTint: 'border-sky-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(56,189,248,0.22)]',
      },
      {
        name: 'C++',
        sub: 'HARDWARE LEVEL C++',
        abbr: 'C+',
        textColor: 'text-indigo-400',
        bgTint: 'bg-indigo-500/[0.08]',
        borderTint: 'border-indigo-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(129,140,248,0.22)]',
      },
      {
        name: 'JavaScript',
        sub: 'FRONTEND LOGIC',
        abbr: 'Js',
        textColor: 'text-amber-400',
        bgTint: 'bg-amber-500/[0.08]',
        borderTint: 'border-amber-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(251,191,36,0.22)]',
      },
      {
        name: 'Node.js',
        sub: 'BACKEND RUNTIME',
        abbr: 'Nd',
        textColor: 'text-emerald-400',
        bgTint: 'bg-emerald-500/[0.08]',
        borderTint: 'border-emerald-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(52,211,153,0.22)]',
      },
      {
        name: 'Express JS',
        sub: 'API FRAMEWORK',
        abbr: 'Ex',
        textColor: 'text-zinc-200',
        bgTint: 'bg-zinc-400/[0.08]',
        borderTint: 'border-zinc-400/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(228,228,231,0.18)]',
      },
      {
        name: 'PostgreSQL',
        sub: 'RELATIONAL DATABASE',
        abbr: 'Pg',
        textColor: 'text-cyan-400',
        bgTint: 'bg-cyan-500/[0.08]',
        borderTint: 'border-cyan-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(34,211,238,0.22)]',
      },
      {
        name: 'ROS',
        sub: 'In Training',
        abbr: 'Rs',
        textColor: 'text-orange-400',
        bgTint: 'bg-orange-500/[0.08]',
        borderTint: 'border-orange-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(251,146,60,0.22)]',
      },
    ],
  },
  {
    category: 'HARDWARE & EMBEDDED',
    items: [
      {
        name: 'NVIDIA Jetson',
        sub: 'EDGE AI & MINI-PC',
        abbr: 'Jt',
        textColor: 'text-lime-400',
        bgTint: 'bg-lime-500/[0.08]',
        borderTint: 'border-lime-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(163,230,53,0.22)]',
      },
      {
        name: 'STM32',
        sub: 'ARM CORTEX-M MCU',
        abbr: 'St',
        textColor: 'text-sky-400',
        bgTint: 'bg-sky-500/[0.08]',
        borderTint: 'border-sky-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(56,189,248,0.22)]',
      },
      {
        name: 'ESP32',
        sub: 'WIRELESS IOT NODES',
        abbr: 'Es',
        textColor: 'text-red-400',
        bgTint: 'bg-red-500/[0.08]',
        borderTint: 'border-red-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(248,113,113,0.22)]',
      },
      {
        name: 'Raspberry Pi',
        sub: 'EDGE COMPUTING',
        abbr: 'Rp',
        textColor: 'text-rose-400',
        bgTint: 'bg-rose-500/[0.08]',
        borderTint: 'border-rose-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(251,113,133,0.22)]',
      },
      {
        name: 'Arduino',
        sub: 'LOGIC PROCESSING',
        abbr: 'Ar',
        textColor: 'text-teal-400',
        bgTint: 'bg-teal-500/[0.08]',
        borderTint: 'border-teal-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(45,212,191,0.22)]',
      },
      {
        name: 'Sensors',
        sub: 'DATA ACQUISITION',
        abbr: 'Sn',
        textColor: 'text-yellow-300',
        bgTint: 'bg-yellow-400/[0.08]',
        borderTint: 'border-yellow-400/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(253,224,71,0.22)]',
      },
      {
        name: 'Motor Drivers',
        sub: 'POWER DELIVERY',
        abbr: 'Dr',
        textColor: 'text-purple-400',
        bgTint: 'bg-purple-500/[0.08]',
        borderTint: 'border-purple-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(192,132,252,0.22)]',
      },
      {
        name: 'Actuators & Motors',
        sub: 'PHYSICAL MOVEMENT',
        abbr: 'Ac',
        textColor: 'text-orange-400',
        bgTint: 'bg-orange-500/[0.08]',
        borderTint: 'border-orange-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(251,146,60,0.22)]',
      },
    ],
  },
  {
    category: 'FABRICATION & ENVIRONMENTS',
    items: [
      {
        name: 'Fusion 360',
        sub: 'CAD & PCB DESIGN',
        abbr: 'F3',
        textColor: 'text-orange-500',
        bgTint: 'bg-orange-500/[0.08]',
        borderTint: 'border-orange-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(249,115,22,0.22)]',
      },
      {
        name: 'Gears & Mechanics',
        sub: 'KINEMATIC TRANSMISSION',
        abbr: 'Gr',
        textColor: 'text-slate-300',
        bgTint: 'bg-slate-400/[0.08]',
        borderTint: 'border-slate-400/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(203,213,225,0.18)]',
      },
      {
        name: 'VS Code',
        sub: 'PRIMARY EDITOR',
        abbr: 'Vs',
        textColor: 'text-blue-400',
        bgTint: 'bg-blue-500/[0.08]',
        borderTint: 'border-blue-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(96,165,250,0.22)]',
      },
      {
        name: 'PyCharm',
        sub: 'PYTHON IDE',
        abbr: 'Pc',
        textColor: 'text-emerald-400',
        bgTint: 'bg-emerald-500/[0.08]',
        borderTint: 'border-emerald-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(52,211,153,0.22)]',
      },
      {
        name: 'Arduino IDE',
        sub: 'EMBEDDED C++',
        abbr: 'Ai',
        textColor: 'text-teal-400',
        bgTint: 'bg-teal-500/[0.08]',
        borderTint: 'border-teal-500/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(45,212,191,0.22)]',
      },
      {
        name: 'Atom IDE',
        sub: 'TEXT EDITOR',
        abbr: 'At',
        textColor: 'text-emerald-300',
        bgTint: 'bg-emerald-400/[0.08]',
        borderTint: 'border-emerald-400/30',
        glowColor: 'group-hover:shadow-[0_0_24px_rgba(110,231,183,0.22)]',
      },
    ],
  },
];

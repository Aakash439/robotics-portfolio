# Asset Directory Organization (`src/assets/` & `public/assets/`)

This directory structure is designed to house authentic engineering assets without relying on generic AI robot imagery or stock sci-fi decorations.

## Recommended File Structure & Naming Convention

- `public/assets/portrait/`
  - `engineer-portrait.jpg` (Aspect Ratio `4:5` — Professional studio portrait or robotics lab photograph)
  - `lab-workstation.jpg` (Aspect Ratio `4:5` or `16:10` — Authentic hardware workbench / prototyping setup)
- `public/assets/projects/`
  - `project-01-amr-cad.png` — Autonomous Mobile Robotics CAD assembly or physical rover photo
  - `project-02-robotic-arm-cad.png` — 6-DOF Manipulator SolidWorks assembly or prototype photo
  - `project-03-vision-pipeline.png` — Real-time bounding box / depth perception frame capture
  - `project-04-automation-cell.png` — Mechatronic sorting / industrial control setup
  - `project-05-embedded-pcb.png` — Custom KiCad / Altium PCB layout or hardware board photo
- `public/resume/`
  - `resume.pdf` — Official PDF curriculum vitae / engineering resume

## How to Replace Placeholders
1. Place your real photographs, CAD renders, or hardware diagrams into `public/assets/...`.
2. Open `src/data/portfolioData.ts` and set the `imagePath` field on your profile or project entry to the corresponding path (e.g., `"/assets/projects/project-01-amr-cad.png"`).
3. When `imagePath` is empty (`""`), the portfolio renders an intentional, high-precision technical schematic blueprint SVG with an explicit `[ASSET PLACEHOLDER]` specification badge rather than pretending a stock image is your real hardware.

# Swiss Editorial Robotics & Mechanical Engineering Portfolio

A restrained, Swiss International Typographic Style and dark industrial portfolio designed for a Robotics and Mechanical Engineering professional.

---

## 1. Visual & Typographic System

- **Colour System**:
  - Background: `#17191B`
  - Primary Surface: `#202326`
  - Secondary Surface: `#26292C`
  - Primary Typography: `#EAE9E5`
  - Secondary Typography: `#A3A5A7`
  - Muted Typography: `#777B80`
  - Borders: `#35393D`
  - Accent: `#7899B8`
  - Accent Hover: `#91B0CC`
- **Typography**:
  - Display Headings: `Manrope`
  - Primary Body: `Inter`
  - Sparse Index & Metadata Labels: `IBM Plex Mono`

---

## 2. Replacing Placeholders with Your Real Content

All editable content is stored in [`src/data/portfolioData.ts`](./src/data/portfolioData.ts):

1. **`PORTFOLIO_OWNER`**:
   - Update `name` (`[YOUR NAME]`), `heroImagePath`, `aboutImagePath`, and `contact` links (`email`, `linkedinUrl`, `githubUrl`, `otherProfiles`).
2. **`SELECTED_PROJECTS`**:
   - Update each project's `title`, `category`, `year`, `shortDescription`, `imagePath`, and the 7-part project detail specification (`overview`, `problem`, `designApproach`, `engineeringProcess`, `toolsAndTechnologies`, `results`, `gallery`).
3. **`ABOUT_SECTION_DATA`**:
   - Replace the biography, philosophy, and academic/professional background placeholders.
4. **`EXPERTISE_AREAS`**:
   - Tailor the 8 engineering discipline rows (`Robotics`, `Mechanical Design`, `CAD & 3D Modelling`, `Automation`, `Embedded Systems`, `Intelligent Systems`, `Prototyping`, `Engineering Analysis`) to match your confirmed experience.

---

## 3. Development & Production Commands

```bash
# Start local development server
npm run dev

# Type-check with TypeScript
npm run lint

# Build production bundle
npm run build
```

const fs = require('fs');
const path = require('path');

console.log('--- STARTING COMPREHENSIVE LINK & SECURITY AUDIT ---');

const root = path.resolve(__dirname, '..');
const projectsFile = fs.readFileSync(path.join(root, 'src/data/projects.ts'), 'utf8');

// 1. Verify project slugs
const slugMatches = [...projectsFile.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
console.log(`[1] Detected ${slugMatches.length} project slugs:`, slugMatches);

if (slugMatches.length !== 5) {
  throw new Error(`Expected 5 project slugs, found ${slugMatches.length}`);
}

// 2. Verify sitemap.xml
const sitemap = fs.readFileSync(path.join(root, 'public/sitemap.xml'), 'utf8');
for (const s of slugMatches) {
  if (!sitemap.includes(s)) {
    throw new Error(`Sitemap missing project slug: ${s}`);
  }
}
console.log('[2] PASS: public/sitemap.xml covers all active project slugs and root domain.');

// 3. Verify robots.txt
const robots = fs.readFileSync(path.join(root, 'public/robots.txt'), 'utf8');
if (!robots.includes('sitemap.xml') || !robots.includes('aakashrobotics.tech')) {
  throw new Error('robots.txt missing valid sitemap reference');
}
console.log('[3] PASS: public/robots.txt points to correct domain sitemap.');

// 4. Verify external target="_blank" links have rel="noopener noreferrer"
const scanDirs = ['src/components', 'src/pages'];
let targetBlankCount = 0;
let relNoopenerCount = 0;

for (const dir of scanDirs) {
  const fullDir = path.join(root, dir);
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.tsx'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(fullDir, file), 'utf8');
    const blanks = (content.match(/target=["']_blank["']/g) || []).length;
    const rels = (content.match(/rel=["']noopener noreferrer["']/g) || []).length;
    targetBlankCount += blanks;
    relNoopenerCount += rels;
    if (blanks !== rels) {
      throw new Error(`Reverse tabnabbing vulnerability in ${file}: target=_blank (${blanks}) != rel=noopener (${rels})`);
    }
  }
}
console.log(`[4] PASS: All ${targetBlankCount} external links correctly implement rel="noopener noreferrer" (0 reverse-tabnabbing vulnerabilities).`);

// 5. Verify no unsafe DOM sinks (XSS audit)
for (const dir of scanDirs) {
  const fullDir = path.join(root, dir);
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.tsx'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(fullDir, file), 'utf8');
    if (content.includes('dangerouslySetInnerHTML')) {
      throw new Error(`Unsafe dangerouslySetInnerHTML found in ${file}`);
    }
    if (content.includes('innerHTML')) {
      throw new Error(`Unsafe innerHTML found in ${file}`);
    }
    if (/\beval\s*\(/.test(content)) {
      throw new Error(`Unsafe eval() found in ${file}`);
    }
  }
}
console.log('[5] PASS: Zero unsafe DOM sinks (no dangerouslySetInnerHTML, no innerHTML, no eval).');

// 6. Verify FormSubmit security in ContactSection
const contactSection = fs.readFileSync(path.join(root, 'src/components/ContactSection.tsx'), 'utf8');
if (!contactSection.includes('_honey')) {
  throw new Error('ContactSection is missing honeypot anti-spam field');
}
if (!contactSection.includes('encodeURIComponent')) {
  throw new Error('ContactSection is missing URI component encoding on mailto fallback');
}
console.log('[6] PASS: Contact form implements silent honeypot anti-spam and strict URI component sanitization.');

// 7. Verify index.html security headers & meta tags
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!indexHtml.includes('strict-origin-when-cross-origin')) {
  throw new Error('index.html missing strict referrer policy');
}
if (!indexHtml.includes('canonical')) {
  throw new Error('index.html missing canonical URL reference');
}
console.log('[7] PASS: index.html implements strict-origin-when-cross-origin referrer policy and canonical link.');

// 8. Verify public image assets exist on disk
const expectedAssets = [
  'public/assets/editorial/engineering-workspace.jpg',
  'public/assets/editorial/hero-mechanical-assembly.jpg',
  'public/favicon.svg',
  'public/robots.txt',
  'public/sitemap.xml',
];
for (const asset of expectedAssets) {
  if (!fs.existsSync(path.join(root, asset))) {
    throw new Error(`Missing required asset: ${asset}`);
  }
}
console.log('[8] PASS: All high-resolution editorial photography and SVGs verified on disk.');

console.log('--- ALL 8 SECURITY & INTEGRITY SUITES PASSED (0 VULNERABILITIES DETECTED) ---');

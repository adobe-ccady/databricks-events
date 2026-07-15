/* eslint-disable no-console */
/**
 * Generates content/databricks/asset-share-commons.plain.html — a demo page for
 * the asset-library block. Emits the same authored block-table structure the
 * importer produces, so the block decorates identically in preview and UE.
 *
 * Thumbnails are self-contained inline-SVG data URIs so the demo always renders
 * without depending on expiring external asset URLs.
 *
 * Run: node tools/demo/build-asset-share-commons.js
 */
const fs = require('fs');
const path = require('path');

const BRAND = '#ff6200';
const INK = '#1b3139';

// Simple deterministic SVG thumbnail generator (label + accent block).
function thumb(label, bg, fg) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">'
    + `<rect width="320" height="240" fill="${bg}"/>`
    + `<rect x="24" y="24" width="272" height="120" rx="8" fill="${fg}" opacity="0.15"/>`
    + `<circle cx="80" cy="84" r="26" fill="${fg}" opacity="0.5"/>`
    + `<rect x="120" y="70" width="150" height="12" rx="6" fill="${fg}" opacity="0.5"/>`
    + `<rect x="120" y="94" width="110" height="12" rx="6" fill="${fg}" opacity="0.3"/>`
    + `<text x="24" y="196" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${fg}">${label}</text>`
    + '</svg>';
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Config rows (order must match the asset-library model: title, breadcrumb,
// searchPlaceholder, pageSize).
const config = {
  title: 'Brand Asset Library',
  breadcrumb: 'Home / Databricks / Brand Assets',
  searchPlaceholder: 'Search assets, logos, templates…',
  pageSize: '12',
};

// Asset items (order matches asset-item model:
// image, imageAlt, title, type, category, format, date, download).
const categories = {
  'Event Logos': { bg: '#fff2ea', fg: BRAND },
  Graphics: { bg: '#eef1f6', fg: INK },
  Web: { bg: '#eafaf3', fg: '#127c53' },
  Presentations: { bg: '#f4eefc', fg: '#6c3fb5' },
  Video: { bg: '#fdeef0', fg: '#c0324a' },
  Templates: { bg: '#fff8e6', fg: '#a9791a' },
};

const seed = [
  ['DAIS 2026 Primary Logo', 'Logo', 'Event Logos', 'SVG', '2026-06-01'],
  ['DAIS 2026 Horizontal Logo', 'Logo', 'Event Logos', 'PNG', '2026-06-02'],
  ['Customer Awards Badge', 'Logo', 'Event Logos', 'PNG', '2026-05-20'],
  ['Women in Data + AI Logo', 'Logo', 'Event Logos', 'SVG', '2026-05-18'],
  ['Databricks Brand Mark', 'Logo', 'Graphics', 'SVG', '2026-04-10'],
  ['Data Intelligence Diagram', 'Image', 'Graphics', 'PNG', '2026-04-22'],
  ['Lakehouse Architecture', 'Image', 'Graphics', 'PNG', '2026-03-30'],
  ['Social Banner — Summit', 'Image', 'Web', 'JPG', '2026-06-05'],
  ['Hero Takeover 1150x650', 'Image', 'Web', 'JPG', '2026-06-06'],
  ['Email Signature Banner', 'Image', 'Web', 'PNG', '2026-05-11'],
  ['Keynote Template', 'Template', 'Presentations', 'PPTX', '2026-05-02'],
  ['Executive Deck Template', 'Template', 'Presentations', 'PPTX', '2026-04-18'],
  ['Session Promo Reel', 'Video', 'Video', 'MP4', '2026-06-08'],
  ['Genie Product Demo', 'Video', 'Video', 'MP4', '2026-05-27'],
  ['Booth Panel 40x40', 'Image', 'Graphics', 'PDF', '2026-03-14'],
  ['Gift Card Design', 'Image', 'Templates', 'PDF', '2026-02-28'],
  ['Zoom Background — Coral', 'Image', 'Templates', 'PNG', '2026-02-20'],
  ['Zoom Background — Navy', 'Image', 'Templates', 'PNG', '2026-02-21'],
  ['Partner Co-brand Kit', 'Document', 'Templates', 'PDF', '2026-01-30'],
  ['Print Mechanical — Poster', 'Document', 'Graphics', 'PDF', '2026-01-15'],
];

function cell(inner) {
  return `<div>${inner}</div>`;
}

// A field cell wraps its value in a <p> (matching importer output). Image cells
// wrap a <picture><img>.
function fieldCell(value) {
  return cell(`<p>${value}</p>`);
}

function imageCell(src, alt) {
  return cell(`<p><picture><img src="${src}" alt="${alt}"></picture></p>`);
}

function configRow(value) {
  // config rows are single-cell rows
  return `<div>${cell(`<p>${value}</p>`)}</div>`;
}

function itemRow([name, type, category, format, date]) {
  const c = categories[category] || { bg: '#eee', fg: '#333' };
  const src = thumb(format, c.bg, c.fg);
  const dl = `/content/dam/databricks/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${format.toLowerCase()}`;
  return `<div>${
    imageCell(src, name)
  }${fieldCell(name) // imageAlt reuse omitted; alt already on img — but model expects alt cell next
  }${fieldCell(name)
  }${fieldCell(type)
  }${fieldCell(category)
  }${fieldCell(format)
  }${fieldCell(date)
  }${cell(`<p><a href="${dl}">${dl}</a></p>`)
  }</div>`;
}

const rows = [];
// config rows first
rows.push(configRow(config.title));
rows.push(configRow(config.breadcrumb));
rows.push(configRow(config.searchPlaceholder));
rows.push(configRow(config.pageSize));
// item rows
seed.forEach((s) => rows.push(itemRow(s)));

const block = `<div class="asset-library">${rows.join('')}</div>`;
const html = `<div>${block}</div>`;

const outDir = path.join(process.cwd(), 'content', 'databricks');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'asset-share-commons.plain.html');
fs.writeFileSync(outFile, html);
console.log(`Wrote ${outFile} (${seed.length} assets)`);

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

// A hinted field cell: <!-- field:name --> before the content, per the UE
// field-hinting rules, so Universal Editor can bind the cell to the model.
function fieldCell(name, value) {
  return `<div><!-- field:${name} --><p>${value}</p></div>`;
}

// Image cell: hint + <picture><img alt>. The alt collapses onto the <img>
// (imageAlt is a collapsed field — it must NOT get its own cell).
function imageCell(name, src, alt) {
  return `<div><!-- field:${name} --><p><picture><img src="${src}" alt="${alt}"></picture></p></div>`;
}

// Config rows are single-cell rows carrying one container field each.
function configRow(name, value) {
  return `<div>${fieldCell(name, value)}</div>`;
}

// One asset-item row. Field order/hints mirror the asset-item model:
// image (alt collapsed), title, type, category, format, date, download.
// imageAlt is intentionally omitted as a cell — it rides on <img alt>.
function itemRow([name, type, category, format, date]) {
  const c = categories[category] || { bg: '#eee', fg: '#333' };
  const src = thumb(format, c.bg, c.fg);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const dl = `/content/dam/databricks/${slug}.${format.toLowerCase()}`;
  return `<div>${
    imageCell('image', src, name)
  }${fieldCell('title', name)
  }${fieldCell('type', type)
  }${fieldCell('category', category)
  }${fieldCell('format', format)
  }${fieldCell('date', date)
  }<div><!-- field:download --><p><a href="${dl}">${dl}</a></p></div>`
  + '</div>';
}

const rows = [];
// config rows first (asset-library container fields)
rows.push(configRow('title', config.title));
rows.push(configRow('breadcrumb', config.breadcrumb));
rows.push(configRow('searchPlaceholder', config.searchPlaceholder));
rows.push(configRow('pageSize', config.pageSize));
// item rows
seed.forEach((s) => rows.push(itemRow(s)));

const block = `<div class="asset-library">${rows.join('')}</div>`;
const html = `<div>${block}</div>`;

const outDir = path.join(process.cwd(), 'content', 'databricks');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'asset-share-commons.plain.html');
fs.writeFileSync(outFile, html);
console.log(`Wrote ${outFile} (${seed.length} assets)`);

// --- JCR XML (Universal Editor authoring source) --------------------------
// Mirrors the rendered content as JCR nodes so Universal Editor can bind each
// block/item to its model. Structure matches the project's franklin JCR
// conventions (page > jcr:content > root > section > block > item_N).
function xmlAttr(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const RT_BLOCK = 'core/franklin/components/block/v1/block';
const RT_ITEM = 'core/franklin/components/block/v1/block/item';

const itemNodes = seed.map(([name, type, category, format, date], i) => {
  const c = categories[category] || { bg: '#eee', fg: '#333' };
  const src = thumb(format, c.bg, c.fg);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const dl = `/content/dam/databricks/${slug}.${format.toLowerCase()}`;
  const attrs = [
    'jcr:primaryType="nt:unstructured"',
    `sling:resourceType="${RT_ITEM}"`,
    'name="Asset Item"',
    'model="asset-item"',
    'modelFields="[image,imageAlt,title,type,category,format,date,download]"',
    `image="${xmlAttr(src)}"`,
    `imageAlt="${xmlAttr(name)}"`,
    `title="${xmlAttr(name)}"`,
    `type="${xmlAttr(type)}"`,
    `category="${xmlAttr(category)}"`,
    `format="${xmlAttr(format)}"`,
    `date="${xmlAttr(date)}"`,
    `download="${xmlAttr(dl)}"`,
  ].join(' ');
  return `        <item_${i} ${attrs}></item_${i}>`;
}).join('\n');

const blockAttrs = [
  `sling:resourceType="${RT_BLOCK}"`,
  'jcr:primaryType="nt:unstructured"',
  'filter="asset-library"',
  'model="asset-library"',
  'modelFields="[title,breadcrumb,searchPlaceholder,pageSize]"',
  'name="Asset Library"',
  `title="${xmlAttr(config.title)}"`,
  `breadcrumb="${xmlAttr(config.breadcrumb)}"`,
  `searchPlaceholder="${xmlAttr(config.searchPlaceholder)}"`,
  `pageSize="${xmlAttr(config.pageSize)}"`,
].join(' ');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="${xmlAttr(config.title)}" modelFields="[jcr:title,jcr:description,keywords]">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" model="section" modelFields="[name,style]">
        <block ${blockAttrs}>
${itemNodes}
        </block>
      </section>
    </root>
  </jcr:content>
</jcr:root>
`;

const jcrDir = path.join(process.cwd(), 'migration-work', 'jcr-content', 'databricks');
fs.mkdirSync(jcrDir, { recursive: true });
const xmlFile = path.join(jcrDir, 'asset-share-commons.xml');
fs.writeFileSync(xmlFile, xml);
console.log(`Wrote ${xmlFile} (UE-authorable JCR)`);

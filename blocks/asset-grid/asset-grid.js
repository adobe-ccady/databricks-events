import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const PAGE_SIZE = 32;

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// A "header" row has no image (section name + count); a card row has a <picture>.
function isHeaderRow(row) {
  return !row.querySelector('picture, img');
}

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'asset-card';
  moveInstrumentation(row, li);

  const cells = [...row.children];
  // cell order (from parser): image, title, attachments, download
  const [imageCell, titleCell, attCell, downloadCell] = cells;

  const titleText = (titleCell?.textContent || '').trim();

  // Thumbnail tile (checkered background, image centered). No overlay controls —
  // the source keeps the checkbox and attachment count in the caption bar below.
  const thumb = document.createElement('div');
  thumb.className = 'asset-card-thumb';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'asset-card-img';
  if (imageCell) {
    while (imageCell.firstChild) imgWrap.append(imageCell.firstChild);
  }
  thumb.append(imgWrap);

  // Caption bar: checkbox + name (left), paperclip attachment count (right)
  const body = document.createElement('div');
  body.className = 'asset-card-body';

  const cap = document.createElement('label');
  cap.className = 'asset-card-caption';
  cap.innerHTML = `<input type="checkbox" aria-label="Select ${titleText}"><span class="asset-card-check asset-card-check-sm" aria-hidden="true"></span>`;
  const name = document.createElement('span');
  name.className = 'asset-card-title';
  name.textContent = titleText;
  name.title = titleText;
  cap.append(name);
  body.append(cap);

  const attText = (attCell?.textContent || '').trim();
  if (attText) {
    const pill = document.createElement('span');
    pill.className = 'asset-card-pill';
    pill.innerHTML = `<span class="asset-card-clip" aria-hidden="true"></span>${attText}`;
    pill.setAttribute('aria-label', `${attText} files`);
    body.append(pill);
  }

  li.append(thumb, body);

  // Optional download link
  const href = downloadCell?.querySelector('a')?.getAttribute('href') || '';
  if (href) {
    const dl = document.createElement('a');
    dl.className = 'asset-card-download';
    dl.href = href;
    dl.setAttribute('download', '');
    dl.setAttribute('aria-label', `Download ${titleText}`);
    dl.innerHTML = '<span class="asset-card-download-icon" aria-hidden="true"></span>';
    li.append(dl);
  }

  return li;
}

export default function decorate(block) {
  const rows = [...block.children];

  // First row without an image is the section header (name + count).
  let sectionName = '';
  let assetCount = '';
  const cardRows = [];
  rows.forEach((row) => {
    if (!sectionName && isHeaderRow(row)) {
      const c = [...row.children];
      sectionName = (c[0]?.textContent || '').trim();
      assetCount = (c[1]?.textContent || '').trim();
    } else {
      cardRows.push(row);
    }
  });

  block.textContent = '';

  if (sectionName) {
    block.id = `section-${slugify(sectionName)}`;
    block.dataset.section = sectionName;
  }

  // Section header
  const header = document.createElement('div');
  header.className = 'asset-grid-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'asset-grid-title-wrap';
  const selAll = document.createElement('label');
  selAll.className = 'asset-grid-selectall';
  selAll.innerHTML = `<input type="checkbox" aria-label="Select all in ${sectionName}"><span class="asset-card-check" aria-hidden="true"></span>`;
  const h2 = document.createElement('h2');
  h2.className = 'asset-grid-section-title';
  h2.textContent = sectionName;
  titleWrap.append(selAll, h2);

  const countEl = document.createElement('p');
  countEl.className = 'asset-grid-count';
  countEl.textContent = assetCount;

  header.append(titleWrap, countEl);
  block.append(header);

  // Grid
  const ul = document.createElement('ul');
  ul.className = 'asset-grid-items';
  cardRows.forEach((row) => ul.append(buildCard(row)));
  block.append(ul);

  // Pagination — shown when the collection total exceeds one page of loaded cards.
  const totalMatch = assetCount.match(/(\d+)/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : cardRows.length;
  if (total > PAGE_SIZE) {
    const pages = Math.ceil(total / PAGE_SIZE);
    const nav = document.createElement('nav');
    nav.className = 'asset-grid-pagination';
    nav.setAttribute('aria-label', `${sectionName} pagination`);

    const mkBtn = (label, cls, disabled) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.textContent = label;
      if (disabled) b.disabled = true;
      return b;
    };

    nav.append(mkBtn('Previous', 'asset-grid-page-prev', true));
    const shown = Math.min(pages, 3);
    for (let i = 1; i <= shown; i += 1) {
      const b = mkBtn(String(i), 'asset-grid-page-num', false);
      if (i === 1) b.classList.add('is-active');
      nav.append(b);
    }
    nav.append(mkBtn('Next', 'asset-grid-page-next', false));
    header.append(nav);
  }

  // Optimize only same-origin thumbnails; leave external (Brandfolder CDN) URLs intact
  // and suppress referrer to bypass hotlink protection (foreign Referer → 422).
  ul.querySelectorAll('picture > img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (/\.svg(\?|$)/i.test(src)) return;
    let isExternal = false;
    try {
      isExternal = new URL(img.src, window.location.href).origin !== window.location.origin;
    } catch (e) {
      isExternal = true;
    }
    if (isExternal) {
      img.setAttribute('referrerpolicy', 'no-referrer');
      return;
    }
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
}

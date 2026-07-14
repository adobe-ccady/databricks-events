import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// Derive a short file-type label from a download href or explicit value.
function fileTypeLabel(explicit, href) {
  if (explicit) return explicit.toUpperCase();
  if (!href) return '';
  const clean = href.split('?')[0];
  const ext = clean.slice(clean.lastIndexOf('.') + 1);
  return ext && ext.length <= 5 ? ext.toUpperCase() : '';
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'asset-grid-items';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'asset-card';
    moveInstrumentation(row, li);

    const cells = [...row.children];
    // cell order (from model / import table): image, title, file type, download
    const [imageCell, titleCell, typeCell, downloadCell] = cells;

    const figure = document.createElement('div');
    figure.className = 'asset-card-thumb';
    if (imageCell) {
      while (imageCell.firstChild) figure.append(imageCell.firstChild);
    }

    const body = document.createElement('div');
    body.className = 'asset-card-body';

    const titleText = (titleCell?.textContent || '').trim();
    const downloadLink = downloadCell?.querySelector('a');
    const href = downloadLink?.getAttribute('href') || '';
    const typeText = fileTypeLabel((typeCell?.textContent || '').trim(), href);

    const title = document.createElement('span');
    title.className = 'asset-card-title';
    title.textContent = titleText;
    title.title = titleText;

    body.append(title);

    if (typeText) {
      const badge = document.createElement('span');
      badge.className = 'asset-card-type';
      badge.textContent = typeText;
      body.append(badge);
    }

    li.append(figure, body);

    if (href) {
      const dl = document.createElement('a');
      dl.className = 'asset-card-download';
      dl.href = href;
      dl.setAttribute('download', '');
      dl.setAttribute('aria-label', `Download ${titleText}`);
      dl.innerHTML = '<span class="asset-card-download-icon" aria-hidden="true"></span>';
      li.append(dl);
    }

    ul.append(li);
  });

  // optimize raster thumbnails; leave SVGs untouched
  ul.querySelectorAll('picture > img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (/\.svg(\?|$)/i.test(src)) return;
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  block.textContent = '';
  block.append(ul);
}

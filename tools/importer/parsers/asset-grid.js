/* eslint-disable */
/* global WebImporter */
/**
 * Parser for asset-grid. Base: asset-grid (custom container block).
 * Source: https://brandfolder.com/databricks/dais-2026
 *
 * Emits a leading HEADER row [sectionName, assetCount] followed by one row per
 * asset-card. Card columns: image, title, attachments (paperclip count), download.
 * asset-grid.js treats the first row (no <picture>) as the section header.
 */
export default function parse(element, { document }) {
  // --- Section header (title + total count) ---
  const sectionName = (element.querySelector('h2.section-title, .section-title')?.textContent || '').replace(/\s+/g, ' ').trim();
  const assetCount = (element.querySelector('p.asset-count, .asset-count')?.textContent || '').replace(/\s+/g, ' ').trim();

  const cards = Array.from(element.querySelectorAll('li.card-wrapper'));

  // Empty-block guard: nothing meaningful to build.
  if (!cards.length && !sectionName) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Header row: two cells (section name, count). No image → asset-grid.js reads it as header.
  const nameCell = document.createDocumentFragment();
  if (sectionName) {
    nameCell.appendChild(document.createComment(' field:sectionName '));
    nameCell.appendChild(document.createTextNode(sectionName));
  }
  const countCell = document.createDocumentFragment();
  if (assetCount) {
    countCell.appendChild(document.createComment(' field:assetCount '));
    countCell.appendChild(document.createTextNode(assetCount));
  }
  cells.push([nameCell, countCell]);

  cards.forEach((card) => {
    // Image: prefer the real lazy-loaded thumbnail (img.image-div) over the placeholder.
    const img = card.querySelector('.card-thumbnail img.image-div')
      || card.querySelector('.card-thumbnail img[alt]')
      || card.querySelector('.card-thumbnail img')
      || card.querySelector('img');

    // Title: <button class="asset-name">. Prefer innermost tooltip label if present.
    const titleBtn = card.querySelector('button.asset-name, .asset-name');
    let title = '';
    if (titleBtn) {
      const tooltipLabel = titleBtn.querySelector('.tooltip-component > span');
      title = (tooltipLabel ? tooltipLabel.textContent : titleBtn.textContent)
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Attachments: <span class="file-type-pill"> ... <paperclip icon> 4 </span>.
    // The numeric text after the icon is the attachment/file count.
    const pill = card.querySelector('.file-type-pill');
    let attachments = '';
    if (pill) {
      const m = pill.textContent.replace(/\s+/g, ' ').match(/(\d+)/);
      if (m) attachments = m[1];
    }

    // Download: source has no per-asset download URL in the card; leave empty.

    // Image cell: field hint + <picture><img> so alt collapses onto the image.
    const imageCell = document.createDocumentFragment();
    if (img) {
      imageCell.appendChild(document.createComment(' field:image '));
      const picture = document.createElement('picture');
      const newImg = document.createElement('img');
      newImg.setAttribute('src', img.getAttribute('src') || '');
      const altText = img.getAttribute('alt') || title;
      if (altText) newImg.setAttribute('alt', altText);
      picture.appendChild(newImg);
      imageCell.appendChild(picture);
    }

    // Title cell.
    const titleCell = document.createDocumentFragment();
    if (title) {
      titleCell.appendChild(document.createComment(' field:title '));
      titleCell.appendChild(document.createTextNode(title));
    }

    // Attachments cell.
    const attCell = document.createDocumentFragment();
    if (attachments) {
      attCell.appendChild(document.createComment(' field:attachments '));
      attCell.appendChild(document.createTextNode(attachments));
    }

    // Download cell (empty).
    const downloadCell = document.createDocumentFragment();

    cells.push([imageCell, titleCell, attCell, downloadCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'asset-grid', cells });
  element.replaceWith(block);
}

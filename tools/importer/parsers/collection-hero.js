/* eslint-disable */
/* global WebImporter */
/**
 * Parser for collection-hero. Base: collection-hero (custom block).
 * Source: https://brandfolder.com/databricks/dais-2026
 * Model fields: title, assetCount, collectionsLabel, shareLabel, backLabel, backHref.
 * Simple block: 1 column, one row per field. xwalk field hints required.
 */
export default function parse(element, { document }) {
  // Title: <h1 class="j-collection-name">DAIS 2026</h1>
  const titleEl = element.querySelector('h1.j-collection-name, h1, [class*="collection-name"]');
  const title = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';

  // Asset count: <p class="asset-count-container"><span class="qty">448</span><span class="assets">Assets</span></p>
  const assetCountEl = element.querySelector('.asset-count-container, [class*="asset-count"]');
  let assetCount = '';
  if (assetCountEl) {
    const parts = Array.from(assetCountEl.querySelectorAll('span'))
      .map((s) => s.textContent.trim())
      .filter(Boolean);
    assetCount = parts.length
      ? parts.join(' ')
      : assetCountEl.textContent.replace(/\s+/g, ' ').trim();
  }

  // Collections dropdown label: <span class="search-dropdown__title">3 Collections</span>
  const collectionsLabel = (element.querySelector('.search-dropdown__title, .collections-dropdown')?.textContent || '')
    .replace(/\s+/g, ' ').trim();

  // Share action: <a class="share-button"><span>Share Collection</span></a>
  const shareEl = element.querySelector('.share-button, [class*="share"]');
  const shareLabel = shareEl ? (shareEl.textContent.replace(/\s+/g, ' ').trim() || 'Share Collection') : '';

  // Back link: <div class="m-brandfolder-tagline"><a href="...">Back to Brand Portal homepage</a></div>
  const backEl = element.querySelector('.m-brandfolder-tagline a, a[href*="portals"]');
  const backLabel = backEl ? backEl.textContent.replace(/\s+/g, ' ').trim() : '';
  const backHref = backEl ? (backEl.getAttribute('href') || '') : '';

  // Empty-block guard.
  if (!title && !assetCount) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  const push = (name, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${name} `));
    frag.appendChild(document.createTextNode(value || ''));
    cells.push([frag]);
  };

  push('title', title);
  push('assetCount', assetCount);
  push('collectionsLabel', collectionsLabel);
  push('shareLabel', shareLabel);
  push('backLabel', backLabel);

  // backHref as a link so it survives as an aem-content reference.
  const hrefFrag = document.createDocumentFragment();
  hrefFrag.appendChild(document.createComment(' field:backHref '));
  if (backHref) {
    const a = document.createElement('a');
    a.setAttribute('href', backHref);
    a.textContent = backHref;
    hrefFrag.appendChild(a);
  }
  cells.push([hrefFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'collection-hero', cells });
  element.replaceWith(block);
}

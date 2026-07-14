/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import collectionHeroParser from './parsers/collection-hero.js';
import assetGridParser from './parsers/asset-grid.js';

// TRANSFORMER IMPORTS
import brandfolderCleanupTransformer from './transformers/brandfolder-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'collection-hero': collectionHeroParser,
  'asset-grid': assetGridParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  brandfolderCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'asset-collection',
  description: 'Brandfolder digital asset library page: a branded hero header with title/asset count/collections, followed by a series of asset-collection sections, each with a section heading and a responsive grid of asset cards (image thumbnails with titles).',
  urls: [
    'https://brandfolder.com/databricks/dais-2026',
  ],
  blocks: [
    {
      name: 'collection-hero',
      instances: [
        '#m-brandfolder-show-container > div.s-brandfolder-show > div.m-brandfolder-header-container',
      ],
    },
    {
      name: 'asset-grid',
      instances: [
        'article.section-container.card-view',
      ],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  /**
   * Brandfolder virtualizes the asset grid: only sections near the viewport keep
   * their cards mounted. A single scroll-to-bottom leaves middle sections empty.
   * Scroll each collection section into view sequentially and wait for its cards
   * to lazy-load; once loaded they remain mounted for the capture that follows.
   */
  onLoad: async ({ document }) => {
    const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });
    const sections = Array.from(document.querySelectorAll('article.section-container.card-view'));
    for (let i = 0; i < sections.length; i += 1) {
      const art = sections[i];
      art.scrollIntoView({ block: 'center' });
      // Wait (up to ~5s) for this section's cards to appear.
      for (let t = 0; t < 10; t += 1) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(500);
        if (art.querySelectorAll('li.card-wrapper').length > 0) break;
      }
    }
    // Return to top and give the DOM a moment to settle before capture.
    window.scrollTo(0, 0);
    await sleep(1000);
  },

  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};

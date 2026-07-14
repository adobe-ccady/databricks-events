/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Brandfolder digital asset library cleanup.
 *
 * Brandfolder is a dynamic React app whose scraped DOM is dominated by app chrome.
 * The only authorable content is:
 *   1. The collection hero header:
 *      #m-brandfolder-show-container > div.s-brandfolder-show > div.m-brandfolder-header-container
 *   2. The asset collection sections:
 *      div.section-results-container > article.section-container.card-view
 *
 * IMPORTANT nesting facts verified in migration-work/cleaned.html:
 *   - <main id="main"> is a sibling AFTER the nav (#navbar-static) inside .l-navbar-region,
 *     so we remove #navbar-static (the nav) and NOT .l-navbar-region (which also wraps <main>).
 *   - .section-results-container (real content) lives INSIDE #showpage-search-container,
 *     so we remove the search/filter chrome children individually and keep the results container.
 *
 * All selectors below are taken from the captured DOM in migration-work/cleaned.html.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie / privacy consent banner (Ketch) and its wrapper root — captured DOM:
    //   <div id="lanyard_root"> ... <div id="ketch-banner"> / <div id="ketch-consent-banner">
    // #lanyard_root wraps only the consent banner and header globals, none of it authorable.
    WebImporter.DOMUtils.remove(element, [
      '#lanyard_root',
      '#ketch-banner',
      '#ketch-consent-banner',
      '.j-header-resource-globals',
    ]);

    // Modal dialog + cookie/noscript overlays that can block block parsing — captured DOM:
    //   <div class="modal fade" id="dialog"> ... , <div id="no-cookies">, <div class="s-noscript-overlay">
    WebImporter.DOMUtils.remove(element, [
      '#dialog',
      '.modal.fade',
      '#close-modal',
      '#no-cookies',
      '.s-noscript-overlay',
    ]);

    // Brandfolder engagement / lanyard widgets and floating layers — captured DOM:
    //   <div id="engagement-wrapper">, <div id="layers">
    WebImporter.DOMUtils.remove(element, [
      '#engagement-wrapper',
      '#layers',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Site nav / header chrome — captured DOM: <div class="navbar ..." id="navbar-static"> inside
    // .l-navbar-region. Remove the nav only (NOT .l-navbar-region, which also wraps <main id="main">).
    WebImporter.DOMUtils.remove(element, [
      '#navbar-static',
      '.skip',
    ]);

    // Color bar (decorative) — captured DOM: <div class="m-color-bar">
    WebImporter.DOMUtils.remove(element, [
      '.m-color-bar',
    ]);

    // Section-filter pill bar and empty custom title — captured DOM:
    //   <ul class="display-sections-buttons" id="section-sort-list">, <div class="custom_section_title">
    WebImporter.DOMUtils.remove(element, [
      '#section-sort-list',
      '.custom_section_title',
    ]);

    // Labels/filters drawer (left filter nav) — captured DOM: <nav class="filters-drawer open">
    WebImporter.DOMUtils.remove(element, [
      'nav.filters-drawer',
      '.advanced-filters-container',
    ]);

    // Search + view-options chrome that lives inside #showpage-search-container, positioned BEFORE
    // .section-results-container. Remove these children individually so the results container (the
    // real asset content) is preserved. Captured DOM:
    //   <div class="filter-button-container">, <div class="search-input-container">,
    //   <div class="search-and-view-details">
    WebImporter.DOMUtils.remove(element, [
      '.filter-button-container',
      '.search-input-container',
      '.search-and-view-details',
    ]);

    // Pagination controls and loading spinners — captured DOM:
    //   <ul class="pagination">, <div class="processing-loader-container">, <... class="loading">
    WebImporter.DOMUtils.remove(element, [
      '.pagination',
      '.processing-loader-container',
      '.loading',
    ]);

    // Brandfolder footer — captured DOM: <div class="brandfolder-footer">
    WebImporter.DOMUtils.remove(element, [
      '.brandfolder-footer',
    ]);

    // Safe leftover / non-authorable elements.
    WebImporter.DOMUtils.remove(element, [
      'link',
      'iframe',
      'noscript',
      'script',
      'style',
    ]);
  }
}

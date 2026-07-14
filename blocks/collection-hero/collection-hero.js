function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildSidebar() {
  const aside = document.createElement('aside');
  aside.className = 'dam-sidebar';

  const head = document.createElement('div');
  head.className = 'dam-sidebar-head';
  const heading = document.createElement('h2');
  heading.className = 'dam-sidebar-title';
  heading.textContent = 'LABELS';
  const collapse = document.createElement('button');
  collapse.type = 'button';
  collapse.className = 'dam-sidebar-collapse';
  collapse.setAttribute('aria-label', 'Collapse sidebar');
  collapse.innerHTML = '<span aria-hidden="true">«</span>';
  head.append(heading, collapse);
  aside.append(head);

  // Folder tree: DAIS 2026 > Brickster Assets, Events, Campaign
  const tree = document.createElement('ul');
  tree.className = 'dam-tree';

  const rootLi = document.createElement('li');
  rootLi.className = 'dam-tree-node dam-tree-root is-open is-active';
  const rootBtn = document.createElement('button');
  rootBtn.type = 'button';
  rootBtn.className = 'dam-tree-toggle';
  rootBtn.setAttribute('aria-expanded', 'true');
  rootBtn.innerHTML = '<span class="dam-tree-label">DAIS 2026</span>';
  rootLi.append(rootBtn);

  const childUl = document.createElement('ul');
  childUl.className = 'dam-tree-children';
  ['Brickster Assets', 'Events', 'Campaign'].forEach((label) => {
    const li = document.createElement('li');
    li.className = 'dam-tree-node';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dam-tree-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `<span class="dam-tree-caret" aria-hidden="true"></span><span class="dam-tree-folder" aria-hidden="true"></span><span class="dam-tree-label">${label}</span>`;
    btn.addEventListener('click', () => {
      const open = li.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    li.append(btn);
    childUl.append(li);
  });
  rootLi.append(childUl);

  rootBtn.addEventListener('click', () => {
    const open = rootLi.classList.toggle('is-open');
    rootBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  tree.append(rootLi);
  aside.append(tree);

  collapse.addEventListener('click', () => {
    const body = aside.closest('.dam-body');
    if (body) body.classList.toggle('is-sidebar-collapsed');
  });

  return aside;
}

function buildToolbar() {
  const bar = document.createElement('div');
  bar.className = 'dam-toolbar';

  const left = document.createElement('div');
  left.className = 'dam-toolbar-left';
  const filters = document.createElement('button');
  filters.type = 'button';
  filters.className = 'dam-filters-btn';
  filters.innerHTML = '<span class="dam-filters-icon" aria-hidden="true"></span>Filters';

  const matchWrap = document.createElement('div');
  matchWrap.className = 'dam-select dam-match';
  matchWrap.innerHTML = '<button type="button" class="dam-select-toggle"><span>All of these terms</span><span class="dam-select-caret" aria-hidden="true"></span></button>';

  const search = document.createElement('div');
  search.className = 'dam-search';
  search.innerHTML = '<span class="dam-search-icon" aria-hidden="true"></span><input type="search" placeholder="Search" aria-label="Search assets">';

  left.append(filters, matchWrap, search);

  const right = document.createElement('div');
  right.className = 'dam-toolbar-right';

  const organize = document.createElement('label');
  organize.className = 'dam-toggle';
  organize.innerHTML = '<input type="checkbox" checked aria-label="Organize by section"><span class="dam-toggle-track" aria-hidden="true"></span><span class="dam-toggle-label">Organize by section</span>';

  const sort = document.createElement('div');
  sort.className = 'dam-select dam-sort';
  sort.innerHTML = '<button type="button" class="dam-select-toggle"><span class="dam-select-prefix">Sort by:</span><span>Name (A-Z)</span><span class="dam-select-caret" aria-hidden="true"></span></button>';

  const viewOpts = document.createElement('button');
  viewOpts.type = 'button';
  viewOpts.className = 'dam-viewopts-btn';
  viewOpts.innerHTML = '<span class="dam-viewopts-icon" aria-hidden="true"></span>View Options';

  right.append(organize, sort, viewOpts);

  bar.append(left, right);
  return bar;
}

export default function decorate(block) {
  const rows = [...block.children];
  // Row order (from parser): title, assetCount, collectionsLabel, shareLabel, backLabel, backHref
  const title = (rows[0]?.textContent || '').trim();
  const count = (rows[1]?.textContent || '').trim();
  const collectionsLabel = (rows[2]?.textContent || '').trim();
  const shareLabel = (rows[3]?.textContent || '').trim() || 'Share Collection';

  block.textContent = '';

  // --- Hero row: title (left) + meta (right) ---
  const heroRow = document.createElement('div');
  heroRow.className = 'collection-hero-row';

  const left = document.createElement('div');
  left.className = 'collection-hero-left';
  const heading = document.createElement('h1');
  heading.className = 'collection-hero-title';
  heading.textContent = title;
  left.append(heading);

  const meta = document.createElement('div');
  meta.className = 'collection-hero-meta';
  if (count) {
    const countEl = document.createElement('span');
    countEl.className = 'collection-hero-count';
    countEl.textContent = count;
    meta.append(countEl);
  }
  if (collectionsLabel) {
    const coll = document.createElement('button');
    coll.type = 'button';
    coll.className = 'collection-hero-collections';
    coll.innerHTML = `<span>${collectionsLabel}</span><span class="collection-hero-caret" aria-hidden="true"></span>`;
    meta.append(coll);
  }
  const share = document.createElement('button');
  share.type = 'button';
  share.className = 'collection-hero-share';
  share.innerHTML = `<span class="collection-hero-share-icon" aria-hidden="true"></span><span>${shareLabel}</span>`;
  share.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: title || document.title, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        const label = share.querySelector('span:last-child');
        const original = label.textContent;
        label.textContent = 'Link copied!';
        setTimeout(() => { label.textContent = original; }, 2000);
      }
    } catch (e) { /* dismissed */ }
  });
  meta.append(share);

  heroRow.append(left, meta);
  block.append(heroRow);

  // --- Sections pill bar (built from the asset-grid blocks on the page) ---
  const main = block.closest('main');
  const grids = main ? [...main.querySelectorAll('.asset-grid')] : [];
  // Read the section name robustly whether or not the asset-grid has decorated yet:
  // decorated → data-section / .asset-grid-section-title; raw → first cell of first row.
  const sectionNameOf = (g) => {
    if (g.dataset.section) return g.dataset.section.trim();
    const decorated = g.querySelector('.asset-grid-section-title');
    if (decorated) return decorated.textContent.trim();
    const firstCell = g.querySelector(':scope > div:first-child > div:first-child');
    return (firstCell?.textContent || '').trim();
  };
  const sections = grids.map(sectionNameOf).filter(Boolean);

  const pillBar = document.createElement('div');
  pillBar.className = 'collection-hero-sections';
  const pillLabel = document.createElement('h3');
  pillLabel.className = 'collection-hero-sections-label';
  pillLabel.textContent = 'Sections:';
  pillBar.append(pillLabel);

  const pillList = document.createElement('div');
  pillList.className = 'collection-hero-pills';
  const makePill = (label, target, active) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'collection-hero-pill';
    if (active) b.classList.add('is-active');
    b.textContent = label;
    b.addEventListener('click', () => {
      pillList.querySelectorAll('.collection-hero-pill').forEach((p) => p.classList.remove('is-active'));
      b.classList.add('is-active');
      if (target) {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    return b;
  };
  pillList.append(makePill('All', '', true));
  sections.forEach((name) => pillList.append(makePill(name, `section-${slugify(name)}`, false)));
  pillBar.append(pillList);
  block.append(pillBar);

  // --- DAM body: sidebar (left) + content column (right) ---
  // Relocate the sibling asset-grid section wrappers into the content column.
  if (main && grids.length) {
    const body = document.createElement('div');
    body.className = 'dam-body';

    const sidebar = buildSidebar();

    const content = document.createElement('div');
    content.className = 'dam-content';
    content.append(buildToolbar());

    const results = document.createElement('div');
    results.className = 'dam-results';
    // Move each asset-grid's section wrapper (its EDS .section or wrapper) into results.
    grids.forEach((grid) => {
      const wrapper = grid.closest('.asset-grid-wrapper') || grid;
      results.append(wrapper);
    });
    content.append(results);

    body.append(sidebar, content);

    // Place the DAM body inside the collection-hero's section wrapper so it sits
    // directly under the pill bar.
    const heroWrapper = block.closest('.collection-hero-wrapper') || block.parentElement;
    heroWrapper.append(body);
  }
}

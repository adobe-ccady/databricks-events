import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// --- Helpers ---------------------------------------------------------------

function cellText(cell) {
  return cell ? cell.textContent.replace(/\s+/g, ' ').trim() : '';
}

// The first rows carry the block's own config fields (title, breadcrumb,
// searchPlaceholder, pageSize) as single-cell rows; asset items are multi-cell
// rows led by an image. We detect an item row by the presence of a picture/img.
function isItemRow(row) {
  return !!row.querySelector('picture, img');
}

function icon(name) {
  const paths = {
    search: '<path d="M10 2a8 8 0 1 0 5 14.3l5.3 5.3 1.4-1.4-5.3-5.3A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/>',
    download: '<path d="M12 3v10l3-3 1.4 1.4L12 16.8 6.6 11.4 8 10l3 3V3zM5 19h14v2H5z"/>',
    share: '<path d="M18 16a3 3 0 0 0-2.4 1.2L9 13.5a3 3 0 0 0 0-3l6.6-3.7A3 3 0 1 0 15 4a3 3 0 0 0 .1.8L8.5 8.5a3 3 0 1 0 0 7l6.6 3.7A3 3 0 1 0 18 16z"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || ''}</svg>`;
}

function makeExternalSafe(img) {
  // External thumbnails (e.g. brand CDNs) must keep their URL intact and send no
  // referrer to avoid hotlink protection; same-origin images get EDS optimization.
  let external = false;
  try {
    external = new URL(img.src, window.location.href).origin !== window.location.origin;
  } catch (e) {
    external = true;
  }
  if (external) {
    img.setAttribute('referrerpolicy', 'no-referrer');
    img.setAttribute('loading', 'lazy');
    return null;
  }
  return createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]);
}

// --- Data model ------------------------------------------------------------

function parseAssets(block) {
  const config = {
    title: '', breadcrumb: '', searchPlaceholder: 'Search assets', pageSize: 12,
  };
  const configOrder = ['title', 'breadcrumb', 'searchPlaceholder', 'pageSize'];
  const assets = [];
  let configIdx = 0;

  [...block.children].forEach((row) => {
    if (isItemRow(row)) {
      const cells = [...row.children];
      // Field order mirrors the asset-item model.
      const [imageCell, altCell, titleCell, typeCell,
        categoryCell, formatCell, dateCell, downloadCell] = cells;
      const img = imageCell?.querySelector('img') || null;
      assets.push({
        img,
        alt: cellText(altCell) || (img?.getAttribute('alt') || ''),
        title: cellText(titleCell),
        type: cellText(typeCell) || 'Image',
        category: cellText(categoryCell),
        format: cellText(formatCell),
        date: cellText(dateCell),
        download: downloadCell?.querySelector('a')?.getAttribute('href') || cellText(downloadCell),
        instrRow: row,
      });
    } else {
      // config row (single cell)
      const key = configOrder[configIdx];
      const val = cellText(row);
      if (key) {
        config[key] = key === 'pageSize' ? (parseInt(val, 10) || 12) : val;
      }
      configIdx += 1;
    }
  });

  return { config, assets };
}

// --- State -----------------------------------------------------------------

export default function decorate(block) {
  const { config, assets } = parseAssets(block);

  const state = {
    query: '',
    facets: { type: new Set(), category: new Set(), format: new Set() },
    sort: 'name-asc',
    page: 1,
    pageSize: config.pageSize || 12,
  };

  // Distinct facet values (in first-seen order).
  const distinct = (key) => {
    const seen = [];
    assets.forEach((a) => { if (a[key] && !seen.includes(a[key])) seen.push(a[key]); });
    return seen;
  };
  const facetDefs = [
    { key: 'type', label: 'Asset Type', values: distinct('type') },
    { key: 'category', label: 'Category', values: distinct('category') },
    { key: 'format', label: 'File Format', values: distinct('format') },
  ].filter((f) => f.values.length);

  // --- Build shell ---------------------------------------------------------
  block.textContent = '';

  if (config.breadcrumb) {
    const crumb = document.createElement('nav');
    crumb.className = 'asset-library-breadcrumb';
    crumb.setAttribute('aria-label', 'Breadcrumb');
    const parts = config.breadcrumb.split('/').map((s) => s.trim()).filter(Boolean);
    crumb.innerHTML = parts
      .map((p, i) => (i < parts.length - 1
        ? `<a href="#">${p}</a><span class="asset-library-crumb-sep" aria-hidden="true">/</span>`
        : `<span aria-current="page">${p}</span>`))
      .join('');
    block.append(crumb);
  }

  if (config.title) {
    const h = document.createElement('h1');
    h.className = 'asset-library-title';
    h.textContent = config.title;
    block.append(h);
  }

  // Toolbar: search (left) + result count + sort (right)
  const toolbar = document.createElement('div');
  toolbar.className = 'asset-library-toolbar';

  const searchWrap = document.createElement('div');
  searchWrap.className = 'asset-library-search';
  searchWrap.innerHTML = `<span class="asset-library-search-icon">${icon('search')}</span>`;
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = config.searchPlaceholder || 'Search assets';
  searchInput.setAttribute('aria-label', 'Search assets');
  searchWrap.append(searchInput);

  const toolbarRight = document.createElement('div');
  toolbarRight.className = 'asset-library-toolbar-right';
  const count = document.createElement('span');
  count.className = 'asset-library-count';
  const sortWrap = document.createElement('label');
  sortWrap.className = 'asset-library-sort';
  sortWrap.innerHTML = '<span>Sort by:</span>';
  const sortSelect = document.createElement('select');
  sortSelect.setAttribute('aria-label', 'Sort assets');
  [
    ['name-asc', 'Name (A–Z)'],
    ['name-desc', 'Name (Z–A)'],
    ['date-desc', 'Newest'],
    ['date-asc', 'Oldest'],
  ].forEach(([v, l]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = l; sortSelect.append(o);
  });
  sortWrap.append(sortSelect);
  toolbarRight.append(count, sortWrap);

  toolbar.append(searchWrap, toolbarRight);
  block.append(toolbar);

  // Body: facet sidebar + results
  const body = document.createElement('div');
  body.className = 'asset-library-body';

  const sidebar = document.createElement('aside');
  sidebar.className = 'asset-library-facets';
  sidebar.setAttribute('aria-label', 'Filters');

  const facetsHead = document.createElement('div');
  facetsHead.className = 'asset-library-facets-head';
  facetsHead.innerHTML = '<h2>Filters</h2>';
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'asset-library-clear';
  clearBtn.textContent = 'Clear all';
  facetsHead.append(clearBtn);
  sidebar.append(facetsHead);

  facetDefs.forEach((facet) => {
    const group = document.createElement('div');
    group.className = 'asset-library-facet-group';
    const gh = document.createElement('h3');
    gh.className = 'asset-library-facet-title';
    gh.textContent = facet.label;
    group.append(gh);
    facet.values.forEach((val) => {
      const id = `facet-${facet.key}-${val.replace(/\W+/g, '-').toLowerCase()}`;
      const lbl = document.createElement('label');
      lbl.className = 'asset-library-facet-option';
      lbl.htmlFor = id;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.value = val;
      cb.dataset.facet = facet.key;
      const box = document.createElement('span');
      box.className = 'asset-library-facet-box';
      const text = document.createElement('span');
      text.className = 'asset-library-facet-label';
      text.textContent = val;
      const num = document.createElement('span');
      num.className = 'asset-library-facet-count';
      lbl.append(cb, box, text, num);
      group.append(lbl);
    });
    sidebar.append(group);
  });

  const results = document.createElement('div');
  results.className = 'asset-library-results';

  const grid = document.createElement('ul');
  grid.className = 'asset-library-grid';
  results.append(grid);

  const empty = document.createElement('p');
  empty.className = 'asset-library-empty';
  empty.textContent = 'No assets match your filters.';
  empty.hidden = true;
  results.append(empty);

  const pagination = document.createElement('nav');
  pagination.className = 'asset-library-pagination';
  pagination.setAttribute('aria-label', 'Pagination');
  results.append(pagination);

  body.append(sidebar, results);
  block.append(body);

  // --- Filtering / sorting -------------------------------------------------

  function matches(asset) {
    if (state.query) {
      const q = state.query.toLowerCase();
      const hay = `${asset.title} ${asset.category} ${asset.type} ${asset.format}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return Object.entries(state.facets)
      .every(([key, set]) => set.size === 0 || set.has(asset[key]));
  }

  function sorted(list) {
    const arr = [...list];
    const byName = (a, b) => a.title.localeCompare(b.title);
    const byDate = (a, b) => (a.date || '').localeCompare(b.date || '');
    if (state.sort === 'name-asc') arr.sort(byName);
    else if (state.sort === 'name-desc') arr.sort((a, b) => byName(b, a));
    else if (state.sort === 'date-desc') arr.sort((a, b) => byDate(b, a));
    else if (state.sort === 'date-asc') arr.sort(byDate);
    return arr;
  }

  function buildCard(asset) {
    const li = document.createElement('li');
    li.className = 'asset-library-card';
    if (asset.instrRow) moveInstrumentation(asset.instrRow, li);

    const thumb = document.createElement('div');
    thumb.className = 'asset-library-card-thumb';
    const imgHolder = document.createElement('div');
    imgHolder.className = 'asset-library-card-img';
    if (asset.img) {
      const clone = asset.img.cloneNode(true);
      const optimized = makeExternalSafe(clone);
      imgHolder.append(optimized || clone);
    }
    const typeBadge = document.createElement('span');
    typeBadge.className = 'asset-library-card-type';
    typeBadge.textContent = asset.type;
    thumb.append(imgHolder, typeBadge);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'asset-library-card-body';
    const name = document.createElement('span');
    name.className = 'asset-library-card-name';
    name.textContent = asset.title;
    name.title = asset.title;
    const meta = document.createElement('span');
    meta.className = 'asset-library-card-meta';
    meta.textContent = [asset.category, asset.format].filter(Boolean).join(' · ');
    bodyEl.append(name, meta);

    const actions = document.createElement('div');
    actions.className = 'asset-library-card-actions';
    const dl = document.createElement('a');
    dl.className = 'asset-library-action asset-library-download';
    dl.href = asset.download || '#';
    dl.setAttribute('download', '');
    dl.setAttribute('aria-label', `Download ${asset.title}`);
    dl.innerHTML = `${icon('download')}<span>Download</span>`;
    const share = document.createElement('button');
    share.type = 'button';
    share.className = 'asset-library-action asset-library-share';
    share.setAttribute('aria-label', `Share ${asset.title}`);
    share.innerHTML = `${icon('share')}<span>Share</span>`;
    share.addEventListener('click', async () => {
      const url = asset.download && /^https?:/.test(asset.download)
        ? asset.download : window.location.href;
      const shareData = { title: asset.title, url };
      try {
        if (navigator.share) await navigator.share(shareData);
        else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          const s = share.querySelector('span');
          const orig = s.textContent;
          s.textContent = 'Copied!';
          setTimeout(() => { s.textContent = orig; }, 1500);
        }
      } catch (e) { /* dismissed */ }
    });
    actions.append(dl, share);

    li.append(thumb, bodyEl, actions);
    return li;
  }

  function renderFacetCounts() {
    sidebar.querySelectorAll('.asset-library-facet-option input').forEach((cb) => {
      const { facet } = cb.dataset;
      const val = cb.value;
      // Count assets matching the query + all OTHER facet groups, then this value.
      const n = assets.filter((a) => {
        if (state.query) {
          const q = state.query.toLowerCase();
          const hay = `${a.title} ${a.category} ${a.type} ${a.format}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return Object.entries(state.facets).every(([k, set]) => {
          if (k === facet) return true;
          return set.size === 0 || set.has(a[k]);
        }) && a[facet] === val;
      }).length;
      const countEl = cb.parentElement.querySelector('.asset-library-facet-count');
      countEl.textContent = n ? `(${n})` : '(0)';
      cb.parentElement.classList.toggle('is-empty', n === 0 && !cb.checked);
    });
  }

  function renderPagination(total) {
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > pages) state.page = pages;
    pagination.innerHTML = '';
    if (pages <= 1) return;

    const mk = (label, page, opts = {}) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.className = opts.cls || 'asset-library-page';
      if (opts.active) b.classList.add('is-active');
      if (opts.disabled) {
        b.disabled = true;
      } else {
        b.addEventListener('click', () => {
          state.page = page;
          render(); // eslint-disable-line no-use-before-define
          results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return b;
    };

    pagination.append(mk('Previous', state.page - 1, { cls: 'asset-library-page-prev', disabled: state.page === 1 }));
    for (let i = 1; i <= pages; i += 1) {
      pagination.append(mk(String(i), i, { active: i === state.page }));
    }
    pagination.append(mk('Next', state.page + 1, { cls: 'asset-library-page-next', disabled: state.page === pages }));
  }

  function render() {
    const filtered = sorted(assets.filter(matches));
    const total = filtered.length;

    count.textContent = `${total} ${total === 1 ? 'asset' : 'assets'}`;
    renderFacetCounts();

    const start = (state.page - 1) * state.pageSize;
    const pageItems = filtered.slice(start, start + state.pageSize);

    grid.innerHTML = '';
    pageItems.forEach((a) => grid.append(buildCard(a)));
    empty.hidden = total !== 0;
    grid.hidden = total === 0;

    renderPagination(total);
  }

  // --- Events --------------------------------------------------------------
  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.query = searchInput.value.trim();
      state.page = 1;
      render();
    }, 150);
  });

  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; state.page = 1; render(); });

  sidebar.addEventListener('change', (e) => {
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    const set = state.facets[cb.dataset.facet];
    if (cb.checked) set.add(cb.value); else set.delete(cb.value);
    state.page = 1;
    render();
  });

  clearBtn.addEventListener('click', () => {
    state.query = '';
    searchInput.value = '';
    Object.values(state.facets).forEach((s) => s.clear());
    sidebar.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
    state.page = 1;
    render();
  });

  render();
}

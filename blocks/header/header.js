// DAM-style top navigation bar (Databricks brand portal).
// Self-contained: renders brand wordmark (left) and Learn More / language / Sign In (right).

const LEARN_MORE_HREF = 'https://help.smartsheet.com/brandfolder';
const SIGN_IN_HREF = '/organizations/databricks-brandfolder/signin';
const BRAND_HREF = 'https://brandfolder.com/portals/databricks';

function buildDropdown(label, items) {
  const wrap = document.createElement('div');
  wrap.className = 'nav-dropdown';

  const toggle = document.createElement('button');
  toggle.className = 'nav-dropdown-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.innerHTML = `<span>${label}</span><span class="nav-caret" aria-hidden="true"></span>`;

  const menu = document.createElement('ul');
  menu.className = 'nav-dropdown-menu';
  items.forEach((it) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = it.href || '#';
    a.textContent = it.label;
    if (it.href && /^https?:/.test(it.href)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    li.append(a);
    menu.append(li);
  });

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = toggle.getAttribute('aria-expanded') === 'true';
    // close any other open dropdowns
    document.querySelectorAll('.nav-dropdown-toggle[aria-expanded="true"]').forEach((t) => {
      if (t !== toggle) t.setAttribute('aria-expanded', 'false');
    });
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
  });

  wrap.append(toggle, menu);
  return wrap;
}

export default async function decorate(block) {
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'dam-nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // Brand (left)
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const brandLink = document.createElement('a');
  brandLink.href = BRAND_HREF;
  brandLink.className = 'nav-brand-link';
  brandLink.setAttribute('aria-label', 'Databricks Brand Portal home');
  brandLink.innerHTML = '<span class="nav-brand-logo" aria-hidden="true"></span><span class="nav-brand-name">databricks</span>';
  brand.append(brandLink);

  // Tools (right)
  const tools = document.createElement('div');
  tools.className = 'nav-tools';

  const learnMore = buildDropdown('Learn More', [
    { label: 'Brandfolder Help', href: LEARN_MORE_HREF },
    { label: 'Getting Started', href: LEARN_MORE_HREF },
  ]);
  learnMore.classList.add('nav-learn-more');

  const language = buildDropdown('English (EN)', [
    { label: 'English (EN)', href: '#' },
    { label: 'Deutsch (DE)', href: '#' },
    { label: 'Français (FR)', href: '#' },
    { label: '日本語 (JA)', href: '#' },
  ]);
  language.classList.add('nav-language');
  // globe icon before the label
  language.querySelector('.nav-dropdown-toggle').insertAdjacentHTML('afterbegin', '<span class="nav-globe" aria-hidden="true"></span>');

  const signIn = document.createElement('a');
  signIn.className = 'nav-signin';
  signIn.href = SIGN_IN_HREF;
  signIn.textContent = 'Sign In';

  tools.append(learnMore, language, signIn);

  nav.append(brand, tools);

  // close dropdowns on outside click / escape
  document.addEventListener('click', () => {
    nav.querySelectorAll('.nav-dropdown-toggle[aria-expanded="true"]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      nav.querySelectorAll('.nav-dropdown-toggle[aria-expanded="true"]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}

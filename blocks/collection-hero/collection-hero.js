export default function decorate(block) {
  const rows = [...block.children];
  // Row order (from model): title, breadcrumb, asset count
  const title = (rows[0]?.textContent || '').trim();
  const breadcrumb = (rows[1]?.textContent || '').trim();
  const count = (rows[2]?.textContent || '').trim();

  block.textContent = '';

  const inner = document.createElement('div');
  inner.className = 'collection-hero-inner';

  if (breadcrumb) {
    const crumb = document.createElement('nav');
    crumb.className = 'collection-hero-breadcrumb';
    crumb.setAttribute('aria-label', 'Breadcrumb');
    crumb.textContent = breadcrumb.split('/').map((s) => s.trim()).filter(Boolean).join(' / ');
    inner.append(crumb);
  }

  const heading = document.createElement('h1');
  heading.className = 'collection-hero-title';
  heading.textContent = title;
  inner.append(heading);

  const meta = document.createElement('div');
  meta.className = 'collection-hero-meta';

  if (count) {
    const countEl = document.createElement('span');
    countEl.className = 'collection-hero-count';
    countEl.textContent = count;
    meta.append(countEl);
  }

  const share = document.createElement('button');
  share.type = 'button';
  share.className = 'collection-hero-share';
  share.innerHTML = '<span class="collection-hero-share-icon" aria-hidden="true"></span><span>Share Collection</span>';
  share.addEventListener('click', async () => {
    const shareData = { title: title || document.title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        share.classList.add('is-copied');
        const label = share.querySelector('span:last-child');
        const original = label.textContent;
        label.textContent = 'Link copied!';
        setTimeout(() => { label.textContent = original; share.classList.remove('is-copied'); }, 2000);
      }
    } catch (e) {
      // user dismissed the share sheet — no action needed
    }
  });
  meta.append(share);

  inner.append(meta);
  block.append(inner);
}

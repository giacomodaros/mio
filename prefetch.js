// Warm the browser's HTTP cache after the homepage has finished loading.
window.addEventListener('load', () => {
  const connection = navigator.connection;
  if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))) return;

  const pending = [];
  const seen = new Set([location.href.split('#')[0]]);

  function collectLinks(doc, base) {
    doc.querySelectorAll('a[href]').forEach((link) => {
      let url;
      try {
        url = new URL(link.getAttribute('href'), base);
      } catch {
        return;
      }
      if (url.origin !== location.origin || !url.pathname.endsWith('.html') ||
          url.pathname.endsWith('/robe-viste.html') || url.search) return;
      url.hash = '';
      if (!seen.has(url.href)) {
        seen.add(url.href);
        pending.push(url.href);
      }
    });
  }

  async function prefetchPages() {
    collectLinks(document, location.href);
    while (pending.length && document.visibilityState === 'visible') {
      const url = pending.shift();
      try {
        const response = await fetch(url, { credentials: 'same-origin', priority: 'low' });
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) continue;
        const html = await response.text();
        const page = new DOMParser().parseFromString(html, 'text/html');
        collectLinks(page, response.url);
      } catch {
        // A failed prefetch should never affect ordinary navigation.
      }
    }
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetchPages, { timeout: 3000 });
  } else {
    setTimeout(prefetchPages, 1000);
  }
});

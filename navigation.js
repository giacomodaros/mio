(() => {
  if (!window.fetch || !window.DOMParser || !history.pushState) return;

  let navigation = 0;
  let swappedPage = false;
  let scrollTimer;
  let restoring = false;
  let headingReservation;
  const initialState = { ...(history.state || {}), ortoScroll: [scrollX, scrollY] };
  history.replaceState(initialState, '', location.href);
  history.scrollRestoration = 'manual';

  // The article pages normally install this handler when loaded directly.
  document.addEventListener('input', (event) => {
    if (!swappedPage || !event.target.matches('textarea#comment')) return;
    event.target.style.height = 'auto';
    event.target.style.height = `${event.target.scrollHeight}px`;
  });

  function saveScroll() {
    history.replaceState({ ...(history.state || {}), ortoScroll: [scrollX, scrollY] }, '', location.href);
  }

  function clearHeadingReservation() {
    if (!headingReservation) return;
    if (headingReservation.placeholder.isConnected) {
      headingReservation.placeholder.replaceWith(headingReservation.original);
    }
    headingReservation = null;
  }

  function reserveHeadingSpace(nextHeading) {
    const heading = document.querySelector('body > h1');
    if (!heading) return;

    // Keep the destination title in the actual layout, but reveal it only after scrolling.
    const placeholder = nextHeading.cloneNode(true);
    placeholder.style.visibility = 'hidden';
    placeholder.setAttribute('aria-hidden', 'true');
    heading.replaceWith(placeholder);
    headingReservation = { original: heading, placeholder };
  }

  window.addEventListener('scroll', () => {
    if (restoring || scrollTimer) return;
    scrollTimer = setTimeout(() => {
      scrollTimer = null;
      if (!restoring) saveScroll();
    }, 400);
  }, { passive: true });

  function scrollToTop(id) {
    const startY = window.scrollY;
    if (startY < 20 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let started;
      function step(time) {
        if (id !== navigation) return resolve();
        if (started === undefined) started = time;
        const progress = Math.min((time - started) / 320, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, startY * (1 - ease));
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  async function navigate(url, isHistoryNavigation = false, scroll = [0, 0]) {
    const id = ++navigation;
    clearHeadingReservation();
    try {
      const response = await fetch(url.href, { credentials: 'same-origin' });
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html') ||
          new URL(response.url).origin !== location.origin) throw new Error('Page unavailable');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (!page.querySelector('body > h1') || !page.querySelector('body > main') ||
          !page.querySelector('link[href$="style.css"]')) throw new Error('Unsupported page');
      if (id !== navigation) return;

      // Resolve paths against the fetched page before moving its contents into this document.
      page.body.querySelectorAll('[href], [src], [action]').forEach((element) => {
        for (const attribute of ['href', 'src', 'action']) {
          const value = element.getAttribute(attribute);
          if (value) element.setAttribute(attribute, new URL(value, response.url).href);
        }
      });
      page.body.querySelectorAll('script').forEach((script) => script.remove());

      if (!isHistoryNavigation) {
        clearTimeout(scrollTimer);
        scrollTimer = null;
        saveScroll();
        restoring = true;
        reserveHeadingSpace(page.querySelector('body > h1'));
        await scrollToTop(id);
        if (id !== navigation) return;
      }

      const update = () => {
        if (!isHistoryNavigation) {
          history.pushState({ ortoScroll: [0, 0] }, '', url.href);
        }
        document.title = page.title;
        document.body.replaceChildren(...page.body.childNodes);
        headingReservation = null;
        swappedPage = true;
        if (url.hash) {
          const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
          if (target) target.scrollIntoView();
          else window.scrollTo(...scroll);
        } else {
          window.scrollTo(...scroll);
        }
        restoring = false;
      };

      update();
    } catch {
      if (id !== navigation) return;
      clearHeadingReservation();
      if (isHistoryNavigation) location.reload();
      else location.href = url.href;
    }
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    const lastSegment = url.pathname.split('/').pop();
    const isPage = !lastSegment.includes('.') || lastSegment.endsWith('.html');
    if (url.origin !== location.origin || !isPage || url.search ||
        (url.pathname === location.pathname && url.hash)) return;
    event.preventDefault();
    navigate(url);
  });

  window.addEventListener('popstate', (event) => {
    clearTimeout(scrollTimer);
    scrollTimer = null;
    restoring = true;
    navigate(new URL(location.href), true, event.state?.ortoScroll || [0, 0]);
  });
})();

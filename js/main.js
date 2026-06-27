const nav = document.getElementById('nav');
const CALL_PHONE_NUMBER = '+17863962640';
const CALL_ARIA_LABEL = 'Call EcoTech Electrical Group at +1 786 396 2640';

window.addEventListener('scroll', () => {
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
});

function enhanceCallLinks() {
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.setAttribute('href', `tel:${CALL_PHONE_NUMBER}`);
    link.setAttribute('title', 'Call EcoTech now');
    link.setAttribute('aria-label', CALL_ARIA_LABEL);
  });
}

function initRevealSequences() {
  const revealBlocks = document.querySelectorAll('.reveal-sequence');

  if (!revealBlocks.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    revealBlocks.forEach((block) => block.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.2,
  });

  revealBlocks.forEach((block) => observer.observe(block));
}

function initMainNavActiveState() {
  const navLinks = Array.from(document.querySelectorAll('#mainNav .nav-link'));

  if (!navLinks.length) {
    return;
  }

  const path = window.location.pathname.toLowerCase();
  const isServicePage = path.includes('/services/');
  const isFreeQuotePage = path.includes('/free-quote/');
  const isHomePage = !isServicePage && !isFreeQuotePage;

  const sectionPriority = ['hurricane-top', 'services', 'about', 'reviews', 'areas', 'quote-form'];

  const keyFromHref = (href) => {
    if (!href) {
      return null;
    }

    const normalized = href.toLowerCase();

    if (normalized.includes('#services')) {
      return 'services';
    }
    if (normalized.includes('#about')) {
      return 'about';
    }
    if (normalized.includes('#reviews')) {
      return 'reviews';
    }
    if (normalized.includes('#areas')) {
      return 'areas';
    }
    if (normalized.includes('#quote-form') || normalized.includes('free-quote')) {
      return 'free-quote';
    }
    if (normalized.includes('#hurricane-top') || normalized.includes('#hero-section') || normalized.endsWith('index.html') || normalized === '#') {
      return 'home';
    }

    return null;
  };

  const keyFromSectionId = (sectionId) => {
    if (sectionId === 'hurricane-top') {
      return 'home';
    }
    if (sectionId === 'quote-form') {
      return 'free-quote';
    }
    return sectionId;
  };

  const setActiveKey = (activeKey) => {
    navLinks.forEach((link) => {
      const linkKey = keyFromHref(link.getAttribute('href') || '');
      const isActive = linkKey === activeKey;

      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  if (isServicePage) {
    setActiveKey('services');
    return;
  }

  if (isFreeQuotePage) {
    setActiveKey('free-quote');
    return;
  }

  const sectionElements = sectionPriority
    .map((id) => document.getElementById(id))
    .filter((section) => section);

  const updateByViewport = () => {
    const triggerLine = window.innerHeight * 0.35;
    let currentSectionId = 'hurricane-top';

    sectionElements.forEach((section) => {
      const top = section.getBoundingClientRect().top;
      if (top <= triggerLine) {
        currentSectionId = section.id;
      }
    });

    setActiveKey(keyFromSectionId(currentSectionId));
  };

  const hash = (window.location.hash || '').replace('#', '').toLowerCase();
  if (hash) {
    setActiveKey(keyFromSectionId(hash));
  } else if (isHomePage) {
    setActiveKey('home');
  }

  window.addEventListener('scroll', updateByViewport, { passive: true });
  window.addEventListener('hashchange', () => {
    const newHash = (window.location.hash || '').replace('#', '').toLowerCase();
    if (newHash) {
      setActiveKey(keyFromSectionId(newHash));
    }
  });

  updateByViewport();
}

enhanceCallLinks();
initRevealSequences();
initMainNavActiveState();

function submitForm() {
  const target = window.location.pathname.includes('/services/') ? '../free-quote/' : 'free-quote/';
  window.location.href = target;
}

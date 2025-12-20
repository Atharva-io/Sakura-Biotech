// Enhanced animations and interactions for Sakura Biotech website

// Existing functionality from original script.js
const navToggle = document.querySelector('.nav__toggle');
const navMenu = document.getElementById('navMenu');
const navLinks = navMenu ? Array.from(navMenu.querySelectorAll('a[href^="#"]')) : [];
const panelOrder = ['#algae', '#mushroom', '#plant'];
const themeToggle = document.getElementById('themeToggle');
const header = document.querySelector('.site-header');
const homeSection = document.getElementById('home');
const homeVideos = Array.from(document.querySelectorAll('.home__bgVideo'));
const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

const THEME_KEY = 'sakura-theme';

const applyTheme = (theme) => {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nextTheme);
  if (themeToggle) {
    themeToggle.textContent = nextTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    themeToggle.setAttribute('aria-label', nextTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
};

const initTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved);
    return;
  }
  applyTheme('light');
};

initTheme();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

const updateHeaderHeight = () => {
  if (!header) return;
  const height = header.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-h', `${height.toFixed(2)}px`);
};

updateHeaderHeight();
window.addEventListener('resize', () => {
  requestAnimationFrame(updateHeaderHeight);
});

const setHomeVideosPlaying = (shouldPlay) => {
  if (!homeVideos.length) return;
  homeVideos.forEach((video) => {
    if (!(video instanceof HTMLVideoElement)) return;
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    if (video.preload !== 'auto') video.preload = 'auto';

    if (shouldPlay && video.readyState === 0) {
      video.load();
    }
    if (shouldPlay) {
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => { });
      }
    } else {
      video.pause();
    }
  });
};

if (homeSection && homeVideos.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      setHomeVideosPlaying(Boolean(entry && entry.isIntersecting && entry.intersectionRatio > 0.15));
    },
    { threshold: [0, 0.15, 0.4, 0.8] }
  );
  observer.observe(homeSection);
  setHomeVideosPlaying(true);
} else {
  setHomeVideosPlaying(true);
}

if (homeVideos.length) {
  const retryOnGesture = () => {
    setHomeVideosPlaying(true);
    window.removeEventListener('pointerdown', retryOnGesture);
    window.removeEventListener('keydown', retryOnGesture);
  };
  window.addEventListener('pointerdown', retryOnGesture, { once: true });
  window.addEventListener('keydown', retryOnGesture, { once: true });
}

const setActiveNavLink = () => {
  const hash = window.location.hash || '#home';
  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === hash;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

setActiveNavLink();
window.addEventListener('hashchange', setActiveNavLink);

const toggleMenu = () => {
  if (!navMenu || !navToggle) return;
  const isOpen = navMenu.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
};

const closeMenu = () => {
  if (!navMenu || !navToggle) return;
  navMenu.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open menu');
};

if (navToggle) {
  navToggle.addEventListener('click', toggleMenu);
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    closeMenu();
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    closeMenu();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
  }

  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  if (document.activeElement && document.activeElement.closest('#navMenu')) return;

  const current = window.location.hash || '#home';
  if (current === '#home') {
    window.location.hash = event.key === 'ArrowRight' ? panelOrder[0] : panelOrder[panelOrder.length - 1];
    return;
  }

  const currentIndex = panelOrder.indexOf(current);
  if (currentIndex === -1) return;

  const delta = event.key === 'ArrowRight' ? 1 : -1;
  const nextIndex = (currentIndex + delta + panelOrder.length) % panelOrder.length;
  window.location.hash = panelOrder[nextIndex];
});

window.addEventListener('click', (event) => {
  if (!navMenu || !navToggle) return;
  if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
    closeMenu();
  }
});

const homePanel = document.querySelector('.home__panel');
const homeItems = homePanel ? Array.from(homePanel.querySelectorAll('.home__item')) : [];
const desktopPanels = window.matchMedia('(min-width: 768px)');

const parseCssAngle = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const match = raw.match(/-?\\d*\\.?\\d+/);
  if (!match) return 0;
  const number = Number(match[0]);
  if (Number.isNaN(number)) return 0;
  if (raw.endsWith('deg')) return (number * Math.PI) / 180;
  if (raw.endsWith('rad')) return number;
  return (number * Math.PI) / 180;
};

const updateDividerSlant = () => {
  if (!homePanel) return;
  const styles = getComputedStyle(homePanel);
  const tilt = parseCssAngle(styles.getPropertyValue('--tilt'));
  const height = homePanel.getBoundingClientRect().height;
  if (!height) return;
  const slantPx = Math.tan(tilt) * height;
  homePanel.style.setProperty('--slantPx', `${slantPx.toFixed(2)}px`);
};

const getActivePanelFromPoint = (clientX, clientY) => {
  if (!homePanel) return null;
  const rect = homePanel.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;

  if (!desktopPanels.matches) {
    const third = rect.height / 3;
    if (y < third) return 'algae';
    if (y < third * 2) return 'mushroom';
    return 'plant';
  }

  const styles = getComputedStyle(homePanel);
  const col1 = parseFloat(styles.getPropertyValue('--col1'));
  const col2 = parseFloat(styles.getPropertyValue('--col2'));
  const col1Frac = Number.isFinite(col1) ? col1 / 100 : 1 / 3;
  const col2Frac = Number.isFinite(col2) ? col2 / 100 : 1 / 3;
  const x1Top = col1Frac;
  const x2Top = col1Frac + col2Frac;
  const slant = parseFloat(styles.getPropertyValue('--slantPx')) || 0;
  const t = rect.height ? y / rect.height : 0;
  const x1 = x1Top * rect.width + slant * t;
  const x2 = x2Top * rect.width + slant * t;
  if (x < x1) return 'algae';
  if (x < x2) return 'mushroom';
  return 'plant';
};

const setPanelActive = (value) => {
  if (!homePanel) return;
  if (!value) {
    delete homePanel.dataset.active;
    return;
  }
  homePanel.dataset.active = value;
};

const normalizeHash = (hash) => {
  if (!hash) return '';
  return hash.replace('#', '').trim();
};

const setActiveFromHash = () => {
  const hash = window.location.hash || '#home';
  const id = normalizeHash(hash);
  const allowed = new Set(['algae', 'mushroom', 'plant']);
  if (allowed.has(id)) {
    setPanelActive(id);
  } else {
    setPanelActive('');
  }
};

setActiveFromHash();
window.addEventListener('hashchange', setActiveFromHash);

if (homePanel) {
  let rafId = 0;
  let slantRafId = 0;

  updateDividerSlant();

  homePanel.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    homePanel.dataset.hover = 'true';
    const active = getActivePanelFromPoint(event.clientX, event.clientY);
    if (active) setPanelActive(active);
  });

  const updateGlow = (event) => {
    const rect = homePanel.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      homePanel.style.setProperty('--mx', `${x.toFixed(2)}%`);
      homePanel.style.setProperty('--my', `${y.toFixed(2)}%`);
    });

    if (event.pointerType === 'mouse') {
      homePanel.dataset.hover = 'true';
      const active = getActivePanelFromPoint(event.clientX, event.clientY);
      if (active) setPanelActive(active);
    }
  };

  homePanel.addEventListener('pointermove', updateGlow);
  homePanel.addEventListener('pointerleave', () => {
    delete homePanel.dataset.hover;
    homePanel.style.removeProperty('--mx');
    homePanel.style.removeProperty('--my');
    setActiveFromHash();
  });

  homePanel.addEventListener('click', (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (!event.isTrusted) return;
    if (!desktopPanels.matches) return;
    const active = getActivePanelFromPoint(event.clientX, event.clientY);
    if (!active) return;
    if (event.target && event.target.closest('a')) {
      event.preventDefault();
    }
    window.location.hash = `#${active}`;
  });

  window.addEventListener('resize', () => {
    cancelAnimationFrame(slantRafId);
    slantRafId = requestAnimationFrame(updateDividerSlant);
  });
}

homeItems.forEach((item) => {
  const activate = () => setPanelActive(item.dataset.panel);
  item.addEventListener('focus', activate);
});

if (homePanel) {
  homePanel.addEventListener('blur', () => {
    setActiveFromHash();
  });
}

// ============================================
// NEW ENHANCEMENTS FOR PREMIUM EXPERIENCE
// ============================================

// Scroll Reveal Animation
const revealElements = () => {
  const reveals = document.querySelectorAll('.reveal, .detail__card, .card');

  if (!('IntersectionObserver' in window) || reducedMotion.matches) {
    reveals.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => revealObserver.observe(el));
};

// Card Mouse Tracking for Glow Effect
const setupCardTracking = () => {
  const cards = document.querySelectorAll('.card, .detail__card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    });
  });
};

// Smooth scroll with offset for sticky header
const setupSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#top') return;

      const targetEl = document.querySelector(href);
      if (!targetEl) return;

      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = targetEl.offsetTop - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // Update URL hash
      setTimeout(() => {
        history.pushState(null, null, href);
        setActiveNavLink();
      }, 100);
    });
  });
};

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', () => {
  revealElements();
  setupCardTracking();
  setupSmoothScroll();
});

// Re-initialize on dynamic content
window.addEventListener('load', () => {
  revealElements();
  setupCardTracking();
});

// ============================================
// CORE SYSTEM MODULES - CLICK TO TOGGLE DETAILS
// ============================================
const setupModuleInteractions = () => {
  const moduleNodes = document.querySelectorAll('.module-node');

  if (!moduleNodes.length) return;

  moduleNodes.forEach(node => {
    // Add tabindex for keyboard accessibility
    const circle = node.querySelector('.module-circle');
    if (circle && !circle.hasAttribute('tabindex')) {
      circle.setAttribute('tabindex', '0');
      circle.setAttribute('role', 'button');
      circle.setAttribute('aria-expanded', 'false');
    }

    // Click handler (for touch devices)
    node.addEventListener('click', (e) => {
      e.stopPropagation();

      // On desktop with mouse, hover handles it
      // On touch/mobile, we toggle active state
      const isTouch = !window.matchMedia('(hover: hover)').matches;

      if (isTouch || window.innerWidth < 1024) {
        const wasActive = node.classList.contains('is-active');

        // Close all other modules first
        moduleNodes.forEach(n => {
          n.classList.remove('is-active');
          const c = n.querySelector('.module-circle');
          if (c) c.setAttribute('aria-expanded', 'false');
        });

        // Toggle this one
        if (!wasActive) {
          node.classList.add('is-active');
          if (circle) circle.setAttribute('aria-expanded', 'true');
        }
      }
    });

    // Keyboard support
    if (circle) {
      circle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          node.click();
        }
        if (e.key === 'Escape') {
          node.classList.remove('is-active');
          circle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });

  // Close modules when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.module-node')) {
      moduleNodes.forEach(n => {
        n.classList.remove('is-active');
        const c = n.querySelector('.module-circle');
        if (c) c.setAttribute('aria-expanded', 'false');
      });
    }
  });
};

// Initialize module interactions
document.addEventListener('DOMContentLoaded', setupModuleInteractions);
window.addEventListener('load', setupModuleInteractions);

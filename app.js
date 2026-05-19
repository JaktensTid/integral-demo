/* ====================================
   Integral — App Logic
   - Theme toggle (persisted)
   - Lang toggle (persisted) RU <-> EN
   - Reveal-on-scroll
   ==================================== */

(function () {
  const root = document.documentElement;

  /* ---------- Cookie helpers (in-memory + cookie persistence; iframes block localStorage) ---------- */
  function getCookie(name) {
    try {
      const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }
  function setCookie(name, value) {
    try {
      document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=31536000; SameSite=Lax';
    } catch (e) { /* noop */ }
  }

  /* ---------- Theme ---------- */
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = getCookie('integral_theme');
  if (savedTheme) {
    root.setAttribute('data-theme', savedTheme);
  } else {
    // System preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      root.setAttribute('data-theme', 'light');
    }
  }
  themeToggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    setCookie('integral_theme', next);
  });

  /* ---------- Language ---------- */
  // Cache original RU strings on first load
  const ruCache = new Map();
  const ruNamesCache = new Map();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    ruCache.set(el, el.innerHTML);
  });
  // Cache team member names + avatar text
  document.querySelectorAll('.member h3, .member__avatar').forEach((el) => {
    ruNamesCache.set(el, el.textContent.trim());
  });

  function setLang(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);

    const dict = window.I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (lang === 'ru') {
        // restore original RU
        el.innerHTML = ruCache.get(el) ?? el.innerHTML;
      } else if (dict && dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    // Names + avatar text
    const namesMap = window.I18N_NAMES[lang] || {};
    document.querySelectorAll('.member h3, .member__avatar').forEach((el) => {
      const original = ruNamesCache.get(el);
      if (lang === 'ru') {
        el.textContent = original;
      } else if (namesMap[original]) {
        el.textContent = namesMap[original];
      }
    });

    // Toggle visual state
    document.querySelectorAll('.toggle__option[data-lang-opt]').forEach((opt) => {
      opt.classList.toggle('is-active', opt.dataset.langOpt === lang);
    });

    // Update <title>
    document.title = lang === 'en'
      ? 'Integral — From manual spend to managed profit growth'
      : 'Integral — Из ручного управления спендом в управляемый рост прибыли';

    setCookie('integral_lang', lang);
  }

  // Init lang
  const savedLang = getCookie('integral_lang');
  if (savedLang === 'en') setLang('en');
  // Wire toggle clicks
  document.querySelectorAll('.toggle__option[data-lang-opt]').forEach((opt) => {
    opt.addEventListener('click', () => setLang(opt.dataset.langOpt));
  });

  /* ---------- Reveal on scroll ---------- */
  // Only animate small inner items, never sections (avoids jumpy hidden sections)
  const targets = document.querySelectorAll('.card, .step, .vertical, .member, .cta-card, .flow__step, .principle');
  targets.forEach((t) => t.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 200px 0px' });
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add('is-visible'));
  }

  // Fail-safe: if not visible after a short delay (e.g., headless screenshot), force visible
  setTimeout(() => {
    targets.forEach((t) => t.classList.add('is-visible'));
  }, 1500);
})();

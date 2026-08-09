// ==========================================================================
// INSAF Finance — comportements globaux (nav, newsletter, toast, modal ebook)
// ==========================================================================

const EMAIL_STORAGE_KEY = 'insaf_emails';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function saveEmail(email) {
  const emails = JSON.parse(localStorage.getItem(EMAIL_STORAGE_KEY) || '[]');
  if (!emails.includes(email)) {
    emails.push(email);
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(emails));
  }
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ---- Mobile nav ----
function initNav() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  const current = document.body.dataset.page;
  document.querySelectorAll('.nav-links a[data-page]').forEach((link) => {
    if (link.dataset.page === current) {
      link.classList.add('active');
    }
  });
}

// ---- Newsletter forms (all pages) ----
function initNewsletterForms() {
  document.querySelectorAll('.newsletter-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const email = input.value.trim();
      if (!isValidEmail(email)) {
        input.focus();
        showToast('Merci d’entrer un email valide');
        return;
      }
      saveEmail(email);
      showToast('Bienvenue chez INSAF 🌱');
      form.reset();
    });
  });
}

// ---- E-book download modal ----
function initEbookModal() {
  const overlay = document.querySelector('#ebook-modal');
  if (!overlay) return;

  const form = overlay.querySelector('form');
  const titleEl = overlay.querySelector('#ebook-modal-title');
  const closeBtn = overlay.querySelector('.modal-close');
  let currentBook = '';

  document.querySelectorAll('[data-ebook]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentBook = btn.dataset.ebook;
      titleEl.textContent = `Télécharger "${currentBook}"`;
      overlay.classList.add('open');
    });
  });

  function closeModal() {
    overlay.classList.remove('open');
    form.reset();
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const email = input.value.trim();
    if (!isValidEmail(email)) return;
    saveEmail(email);
    closeModal();
    showToast('Téléchargement disponible bientôt !');
  });
}

// ---- Filter pills (contenu page) ----
function initFilters() {
  document.querySelectorAll('.filter-pills').forEach((group) => {
    const pills = group.querySelectorAll('.filter-pill');
    const targetSelector = group.dataset.target;
    const cards = targetSelector ? document.querySelectorAll(targetSelector) : [];

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.dataset.filter;
        cards.forEach((card) => {
          if (filter === 'tous' || card.dataset.topic === filter) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  });
}

// ---- Scroll reveal (fade-up, staggered) ----
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const groups = new Map();
  targets.forEach((el) => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  groups.forEach((siblings) => {
    siblings.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 90, 360)}ms`;
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el) => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initNewsletterForms();
  initEbookModal();
  initFilters();
  initScrollReveal();
});

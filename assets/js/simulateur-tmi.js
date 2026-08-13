// ==========================================================================
// Simulateur de TMI — barème progressif, quotient familial, détail par tranche
// ==========================================================================

const EMAIL_STORAGE_KEY = 'insaf_emails';

const BRACKETS = [
  { min: 0, max: 11497, rate: 0, color: '#DCE7E3' },
  { min: 11497, max: 29315, rate: 11, color: '#33CAC2' },
  { min: 29315, max: 83823, rate: 30, color: '#00BE62' },
  { min: 83823, max: 180294, rate: 41, color: '#D5B661' },
  { min: 180294, max: Infinity, rate: 45, color: '#00333C' },
];

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

function formatEUR(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatRange(b) {
  if (b.min === 0) return `jusqu'à ${formatEUR(b.max)}`;
  if (b.max === Infinity) return `au-delà de ${formatEUR(b.min)}`;
  return `${formatEUR(b.min)} – ${formatEUR(b.max)}`;
}

// Détail progressif de l'impôt sur le quotient familial (1 part)
function computeBreakdown(quotient) {
  const rows = [];
  for (const b of BRACKETS) {
    if (quotient <= b.min) break;
    const taxable = Math.min(quotient, b.max) - b.min;
    const tax = taxable * (b.rate / 100);
    rows.push({ ...b, taxable, tax });
  }
  return rows;
}

function simulateTMI(revenu, parts) {
  const quotient = parts > 0 ? revenu / parts : 0;
  const rows = computeBreakdown(quotient);
  const impotParPart = rows.reduce((sum, r) => sum + r.tax, 0);
  const impotTotal = impotParPart * parts;
  const tmi = rows.length ? rows[rows.length - 1].rate : 0;
  const tauxMoyen = revenu > 0 ? (impotTotal / revenu) * 100 : 0;
  const revenuNet = revenu - impotTotal;
  return { quotient, parts, rows, impotTotal, tmi, tauxMoyen, revenuNet };
}

function initSimulateurTMI() {
  const form = document.querySelector('#tmi-form');
  if (!form) return;

  const modal = document.querySelector('#tmi-modal');
  const modalForm = modal.querySelector('form');
  const modalClose = modal.querySelector('.modal-close');
  const resultsSection = document.querySelector('#tmi-results-section');

  let pendingResults = null;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const revenu = parseFloat(form.querySelector('#tmi-revenu-input').value) || 0;
    const parts = parseFloat(form.querySelector('#tmi-parts-select').value);

    pendingResults = simulateTMI(revenu, parts);
    modal.classList.add('open');
  });

  modalClose.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = modalForm.querySelector('input[type="email"]');
    const email = input.value.trim();
    if (!isValidEmail(email) || !pendingResults) return;

    saveEmail(email);
    modal.classList.remove('open');
    modalForm.reset();

    renderResults(pendingResults);
    resultsSection.classList.add('revealed');
    setTimeout(() => resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  });

  function renderResults(r) {
    document.querySelector('#tmi-metric-tmi').innerHTML = `${r.tmi}<span class="accent">%</span>`;
    document.querySelector('#tmi-metric-impot').textContent = formatEUR(r.impotTotal);
    document.querySelector('#tmi-metric-moyen').innerHTML = `${r.tauxMoyen.toFixed(1)}<span class="accent">%</span>`;
    document.querySelector('#tmi-metric-net').textContent = formatEUR(r.revenuNet);

    const bar = document.querySelector('#tmi-bracket-bar');
    const list = document.querySelector('#tmi-bracket-list');
    bar.innerHTML = '';
    list.innerHTML = '';

    r.rows.forEach((row, i) => {
      const widthPct = r.quotient > 0 ? (row.taxable / r.quotient) * 100 : 0;
      const segment = document.createElement('span');
      segment.className = 'bracket-bar-segment';
      segment.style.width = `${widthPct}%`;
      segment.style.background = row.color;
      bar.appendChild(segment);

      const isMarginal = i === r.rows.length - 1;
      const rowEl = document.createElement('div');
      rowEl.className = `bracket-row${isMarginal ? ' active-tmi' : ''}`;
      rowEl.innerHTML = `
        <span class="label"><span class="swatch" style="background:${row.color}"></span>${row.rate}% <span class="range">(${formatRange(row)})</span>${isMarginal ? '<span class="bracket-tmi-pill">TMI</span>' : ''}</span>
        <span class="amount">${formatEUR(row.tax * r.parts)}</span>
      `;
      list.appendChild(rowEl);
    });
  }
}

document.addEventListener('DOMContentLoaded', initSimulateurTMI);

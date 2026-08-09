// ==========================================================================
// Simulateur PER — logique de calcul, formulaire, graphique Chart.js
// ==========================================================================

import Chart from 'chart.js/auto';

const EMAIL_STORAGE_KEY = 'insaf_emails';
const PLAFOND_MIN = 4637;
const PLAFOND_MAX_SALARIE = 37094;
const PLAFOND_MAX_TNS = 85780;

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

function calculateTMI(revenuImposable, parts) {
  const quotient = revenuImposable / parts;
  if (quotient <= 11497) return 0;
  if (quotient <= 29315) return 11;
  if (quotient <= 83823) return 30;
  if (quotient <= 180294) return 41;
  return 45;
}

function calculatePlafond(revenu, situation) {
  const plafondMax = situation === 'tns' ? PLAFOND_MAX_TNS : PLAFOND_MAX_SALARIE;
  const plafond10pct = revenu * 0.10;
  return Math.min(Math.max(plafond10pct, PLAFOND_MIN), plafondMax);
}

function calculateEconomie(versements, tmi, plafondDisponible) {
  const versementsDeductibles = Math.min(versements, plafondDisponible);
  return versementsDeductibles * (tmi / 100);
}

function projectCapital(versementAnnuel, tauxRendement, annees) {
  const r = tauxRendement / 100;
  if (r === 0) return versementAnnuel * annees;
  return versementAnnuel * ((Math.pow(1 + r, annees) - 1) / r);
}

function formatEUR(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function initSimulateur() {
  const form = document.querySelector('#per-form');
  if (!form) return;

  const versementsInput = form.querySelector('#versements-input');
  const versementsSlider = form.querySelector('#versements-slider');
  const rendementSlider = form.querySelector('#rendement-slider');
  const rendementValue = form.querySelector('#rendement-value');

  versementsSlider.addEventListener('input', () => {
    versementsInput.value = versementsSlider.value;
  });
  versementsInput.addEventListener('input', () => {
    versementsSlider.value = versementsInput.value;
  });
  rendementSlider.addEventListener('input', () => {
    rendementValue.textContent = `${rendementSlider.value}%`;
  });

  const modal = document.querySelector('#results-modal');
  const modalForm = modal.querySelector('form');
  const modalClose = modal.querySelector('.modal-close');
  const resultsSection = document.querySelector('#results-section');

  let chartInstance = null;
  let pendingResults = null;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const situation = form.querySelector('input[name="situation"]:checked').value;
    const revenu = parseFloat(form.querySelector('#revenu-input').value) || 0;
    const partsSelect = form.querySelector('#situation-familiale');
    const parts = parseFloat(partsSelect.value);
    const tmiSelect = form.querySelector('#tmi-select');
    const versements = parseFloat(versementsInput.value) || 0;
    const plafondReporte = parseFloat(form.querySelector('#plafond-reporte').value) || 0;
    const ageActuel = parseFloat(form.querySelector('#age-actuel').value) || 0;
    const ageRetraite = parseFloat(form.querySelector('#age-retraite').value) || 0;
    const rendement = parseFloat(rendementSlider.value);

    const tmi = tmiSelect.value === 'auto' ? calculateTMI(revenu, parts) : parseFloat(tmiSelect.value);
    const plafondBase = calculatePlafond(revenu, situation);
    const plafondDisponible = plafondBase + plafondReporte;
    const economie = calculateEconomie(versements, tmi, plafondDisponible);
    const effortReel = versements - economie;
    const tauxOptimisation = versements > 0 ? (economie / versements) * 100 : 0;
    const annees = Math.max(ageRetraite - ageActuel, 1);

    const sansPER = [];
    const avecPER = [];
    const labels = [];
    for (let i = 0; i <= annees; i++) {
      labels.push(`+${i} an${i > 1 ? 's' : ''}`);
      sansPER.push(Math.round(versements * i));
      avecPER.push(Math.round(projectCapital(versements, rendement, i)));
    }

    pendingResults = {
      economie, effortReel, tauxOptimisation, versements,
      labels, sansPER, avecPER,
      capitalFinal: avecPER[avecPER.length - 1],
      tmi, plafondDisponible,
    };

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
    document.querySelector('#metric-economie').innerHTML = `${formatEUR(r.economie)}`;
    document.querySelector('#metric-effort').innerHTML = `${formatEUR(r.effortReel)}`;
    document.querySelector('#metric-taux').innerHTML = `${r.tauxOptimisation.toFixed(1)}<span class="accent">%</span>`;
    document.querySelector('#capital-final').textContent = formatEUR(r.capitalFinal);

    const ctx = document.querySelector('#per-chart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: r.labels,
        datasets: [
          {
            label: 'Sans PER',
            data: r.sansPER,
            borderColor: '#A9D4C4',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            tension: 0,
          },
          {
            label: 'Avec PER',
            data: r.avecPER,
            borderColor: '#D4A017',
            backgroundColor: 'rgba(212, 160, 23, 0.12)',
            borderWidth: 3,
            fill: true,
            pointRadius: 0,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#1B2E1F', font: { family: 'Plus Jakarta Sans' } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label} : ${formatEUR(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            ticks: { callback: (v) => formatEUR(v) },
            grid: { color: 'rgba(27,67,50,0.08)' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }
}

document.addEventListener('DOMContentLoaded', initSimulateur);

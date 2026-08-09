// ==========================================================================
// Simulateur de capitalisation — intérêts composés, formulaire, graphique
// ==========================================================================

import Chart from 'chart.js/auto';

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

function formatEUR(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

// Valeur future avec versements mensuels et intérêts composés mensuellement
function projectCapitalMensuel(capitalInitial, versementMensuel, tauxAnnuel, mois) {
  const rMensuel = tauxAnnuel / 100 / 12;
  if (rMensuel === 0) {
    return capitalInitial + versementMensuel * mois;
  }
  const fvInitial = capitalInitial * Math.pow(1 + rMensuel, mois);
  const fvVersements = versementMensuel * ((Math.pow(1 + rMensuel, mois) - 1) / rMensuel);
  return fvInitial + fvVersements;
}

function initSimulateurCapitalisation() {
  const form = document.querySelector('#capi-form');
  if (!form) return;

  const versementInput = form.querySelector('#capi-versement-input');
  const versementSlider = form.querySelector('#capi-versement-slider');
  const dureeInput = form.querySelector('#capi-duree-input');
  const dureeSlider = form.querySelector('#capi-duree-slider');
  const rendementSlider = form.querySelector('#capi-rendement-slider');
  const rendementValue = form.querySelector('#capi-rendement-value');

  versementSlider.addEventListener('input', () => { versementInput.value = versementSlider.value; });
  versementInput.addEventListener('input', () => { versementSlider.value = versementInput.value; });
  dureeSlider.addEventListener('input', () => { dureeInput.value = dureeSlider.value; });
  dureeInput.addEventListener('input', () => { dureeSlider.value = dureeInput.value; });
  rendementSlider.addEventListener('input', () => {
    rendementValue.textContent = `${rendementSlider.value}%`;
  });

  const modal = document.querySelector('#capi-modal');
  const modalForm = modal.querySelector('form');
  const modalClose = modal.querySelector('.modal-close');
  const resultsSection = document.querySelector('#capi-results-section');

  let chartInstance = null;
  let pendingResults = null;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const capitalInitial = parseFloat(form.querySelector('#capi-capital-input').value) || 0;
    const versementMensuel = parseFloat(versementInput.value) || 0;
    const duree = parseFloat(dureeInput.value) || 1;
    const rendement = parseFloat(rendementSlider.value);

    const labels = [];
    const sansInterets = [];
    const avecInterets = [];
    for (let i = 0; i <= duree; i++) {
      labels.push(`+${i} an${i > 1 ? 's' : ''}`);
      sansInterets.push(Math.round(capitalInitial + versementMensuel * 12 * i));
      avecInterets.push(Math.round(projectCapitalMensuel(capitalInitial, versementMensuel, rendement, i * 12)));
    }

    const capitalFinal = avecInterets[avecInterets.length - 1];
    const totalVerse = sansInterets[sansInterets.length - 1];
    const interetsGeneres = capitalFinal - totalVerse;

    pendingResults = { labels, sansInterets, avecInterets, capitalFinal, totalVerse, interetsGeneres };

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
    document.querySelector('#capi-metric-final').innerHTML = formatEUR(r.capitalFinal);
    document.querySelector('#capi-metric-verse').innerHTML = formatEUR(r.totalVerse);
    document.querySelector('#capi-metric-interets').innerHTML = `${formatEUR(r.interetsGeneres)}`;

    const ctx = document.querySelector('#capi-chart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: r.labels,
        datasets: [
          {
            label: 'Total versé',
            data: r.sansInterets,
            borderColor: '#79A7A8',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            tension: 0,
          },
          {
            label: 'Avec intérêts composés',
            data: r.avecInterets,
            borderColor: '#00BE62',
            backgroundColor: 'rgba(0, 190, 98, 0.12)',
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
          legend: { position: 'bottom', labels: { color: '#0E2624', font: { family: 'Bricolage Grotesque' } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label} : ${formatEUR(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            ticks: { callback: (v) => formatEUR(v) },
            grid: { color: 'rgba(0,51,60,0.08)' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }
}

document.addEventListener('DOMContentLoaded', initSimulateurCapitalisation);

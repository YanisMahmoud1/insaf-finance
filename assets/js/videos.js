// ==========================================================================
// Chargement des vidéos YouTube réelles — chaîne "Parlons Finance Islamique"
// ==========================================================================

const RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCBMfv3gyYeWAPCeL5Ss17nQ';
const CORS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

const FALLBACK_VIDEOS = [
  {
    title: 'Les bases de la finance islamique',
    url: 'https://www.youtube.com/@ParlonsFinanceIslamique',
    thumbnail: '',
    date: '',
  },
  {
    title: 'Halal ou haram : la crypto ?',
    url: 'https://www.youtube.com/@ParlonsFinanceIslamique',
    thumbnail: '',
    date: '',
  },
  {
    title: 'Investir en bourse en étant musulman',
    url: 'https://www.youtube.com/@ParlonsFinanceIslamique',
    thumbnail: '',
    date: '',
  },
];

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
}

async function fetchVideos() {
  const res = await fetch(CORS_PROXY + encodeURIComponent(RSS_URL));
  if (!res.ok) throw new Error('RSS fetch failed');
  const data = await res.json();
  if (!data.items || !data.items.length) throw new Error('No items');
  return data.items.map((item) => ({
    title: item.title,
    url: item.link,
    thumbnail: item.thumbnail,
    date: item.pubDate,
    videoId: (item.link.split('v=')[1] || '').split('&')[0],
  }));
}

function skeletonCardHTML() {
  return `
    <div class="skeleton-card">
      <div class="skeleton-thumb"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>`;
}

function videoCardHTML(video) {
  const thumb = video.thumbnail
    ? `<img src="${video.thumbnail}" alt="${escapeHTML(video.title)}" loading="lazy">`
    : '';
  return `
    <a class="video-card" href="${video.url}" target="_blank" rel="noopener">
      <div class="video-thumb">
        ${thumb}
        <span class="video-play"></span>
      </div>
      <div class="video-body">
        <span class="video-badge pfi-badge">PFI</span>
        <h4>${escapeHTML(video.title)}</h4>
        <div class="video-meta"><span>${formatDate(video.date)}</span></div>
      </div>
    </a>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function renderVideosInto(selector, count) {
  const container = document.querySelector(selector);
  if (!container) return;

  container.innerHTML = Array.from({ length: count }).map(skeletonCardHTML).join('');

  try {
    const videos = await fetchVideos();
    container.innerHTML = videos.slice(0, count).map(videoCardHTML).join('');
  } catch (err) {
    container.innerHTML = FALLBACK_VIDEOS.slice(0, count).map(videoCardHTML).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-video-container]').forEach((el) => {
    const count = parseInt(el.dataset.count, 10) || 3;
    renderVideosInto(`#${el.id}`, count);
  });
});

const o="https://www.youtube.com/feeds/videos.xml?channel_id=UCBMfv3gyYeWAPCeL5Ss17nQ",r="https://api.rss2json.com/v1/api.json?rss_url=",l=[{title:"Les bases de la finance islamique",url:"https://www.youtube.com/@ParlonsFinanceIslamique",thumbnail:"",date:""},{title:"Halal ou haram : la crypto ?",url:"https://www.youtube.com/@ParlonsFinanceIslamique",thumbnail:"",date:""},{title:"Investir en bourse en étant musulman",url:"https://www.youtube.com/@ParlonsFinanceIslamique",thumbnail:"",date:""}];function c(t){if(!t)return"";try{return new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"short",year:"numeric"}).format(new Date(t))}catch{return""}}async function d(){const t=await fetch(r+encodeURIComponent(o));if(!t.ok)throw new Error("RSS fetch failed");const e=await t.json();if(!e.items||!e.items.length)throw new Error("No items");return e.items.map(n=>({title:n.title,url:n.link,thumbnail:n.thumbnail,date:n.pubDate,videoId:(n.link.split("v=")[1]||"").split("&")[0]}))}function u(){return`
    <div class="skeleton-card">
      <div class="skeleton-thumb"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>`}function i(t){const e=t.thumbnail?`<img src="${t.thumbnail}" alt="${s(t.title)}" loading="lazy">`:"";return`
    <a class="video-card" href="${t.url}" target="_blank" rel="noopener">
      <div class="video-thumb">
        ${e}
        <span class="video-play"></span>
      </div>
      <div class="video-body">
        <span class="video-badge pfi-badge">PFI</span>
        <h4>${s(t.title)}</h4>
        <div class="video-meta"><span>${c(t.date)}</span></div>
      </div>
    </a>`}function s(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}async function m(t,e){const n=document.querySelector(t);if(n){n.innerHTML=Array.from({length:e}).map(u).join("");try{const a=await d();n.innerHTML=a.slice(0,e).map(i).join("")}catch{n.innerHTML=l.slice(0,e).map(i).join("")}}}document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll("[data-video-container]").forEach(t=>{const e=parseInt(t.dataset.count,10)||3;m(`#${t.id}`,e)})});

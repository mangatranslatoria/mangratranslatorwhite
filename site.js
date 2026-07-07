/* Manga Translator Studio - mobile-safe gallery
   Thumbnail path:
   assets/gallery_preview/thumbs/italian/01.jpg

   Full image path:
   assets/gallery_preview/full/italian/01.jpg

   Same folder names and file names in thumbs/ and full/.
   GitHub Pages is case-sensitive: 01.JPG is NOT 01.jpg.
*/

const SOURCE_LABEL = 'English'; // fallback only
const GALLERY_FALLBACK_FOLDER = 'english';

// IMPORTANT: this site no longer scans 80 images x many extensions.
// It checks only these files for the selected language.
// Add/remove names here if you have more or fewer gallery images.
const DEFAULT_GALLERY_FILES = [
  '01.jpg', '02.jpg', '03.jpg', '04.jpg',
  '05.jpg', '06.jpg', '07.jpg', '08.jpg'
];
// If you add more preview images, extend the list above:
// '09.jpg', '10.jpg', '11.jpg', ...

// Use the same file names for every language folder by default.
// If one language has different file names, override it here.
const GALLERY_IMAGES = {
  english: DEFAULT_GALLERY_FILES,
  italian: DEFAULT_GALLERY_FILES,
  french: DEFAULT_GALLERY_FILES,
  german: DEFAULT_GALLERY_FILES,
  spanish: DEFAULT_GALLERY_FILES,
  portuguese: DEFAULT_GALLERY_FILES,
  russian: DEFAULT_GALLERY_FILES,
  japanese: DEFAULT_GALLERY_FILES,
  korean: DEFAULT_GALLERY_FILES,
  chinese_simplified: DEFAULT_GALLERY_FILES,
  chinese_traditional: DEFAULT_GALLERY_FILES,
  arabic: DEFAULT_GALLERY_FILES,
  hindi: DEFAULT_GALLERY_FILES,
  turkish: DEFAULT_GALLERY_FILES,
  indonesian: DEFAULT_GALLERY_FILES,
  vietnamese: DEFAULT_GALLERY_FILES,
  thai: DEFAULT_GALLERY_FILES,
  polish: DEFAULT_GALLERY_FILES,
  dutch: DEFAULT_GALLERY_FILES,
  ukrainian: DEFAULT_GALLERY_FILES,
  bengali: DEFAULT_GALLERY_FILES
};

let activeLang = localStorage.getItem('mts_lang') || 'en';
let currentImages = [];
let currentIndex = 0;
let renderToken = 0;

function getLangData(code) {
  return LANGUAGES.find(l => l[0] === code) || LANGUAGES[0];
}

function folderForLang(code) {
  return getLangData(code)[3] || 'english';
}

function langName(code) {
  return getLangData(code)[2] || getLangData(code)[1] || code;
}

function t(key) {
  return (TRANSLATIONS[activeLang] && TRANSLATIONS[activeLang][key]) ||
         (TRANSLATIONS.en && TRANSLATIONS.en[key]) ||
         key;
}

function themeText(mode) {
  return mode === 'dark' ? t('theme.dark') : t('theme.light');
}

function previewThemeText(mode) {
  return mode === 'dark' ? t('preview.dark') : t('preview.light');
}


function galleryPairText(code) {
  const source = t('gallery.source.english') || SOURCE_LABEL;
  const japanese = t('gallery.target.japanese') || 'Japanese';
  if (code === 'en') return `${japanese} → ${langName(code)}`;
  return `${source} → ${langName(code)}`;
}

function imageExists(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    // No Date.now() cache busting: it creates useless repeated 404s on GitHub Pages.
    img.src = src;
  });
}

function thumbPath(folder, fileName) {
  return `assets/gallery_preview/thumbs/${folder}/${fileName}`;
}

function fullPath(folder, fileName) {
  return `assets/gallery_preview/full/${folder}/${fileName}`;
}

async function existingGalleryImages(folder) {
  const files = GALLERY_IMAGES[folder] || DEFAULT_GALLERY_FILES;

  // Check only thumbnails. Full images are loaded only when the user opens the lightbox.
  const checks = files.map(async (fileName, index) => {
    const thumb = thumbPath(folder, fileName);
    const ok = await imageExists(thumb);
    if (!ok) return null;
    return {
      thumb: ok,
      full: fullPath(folder, fileName),
      label: fileName.replace(/\.[^.]+$/, ''),
      order: index + 1
    };
  });

  const results = await Promise.all(checks);
  return results.filter(Boolean);
}


function heroShotCandidates(n) {
  const id = String(n).padStart(2, '0');
  return [
    `assets/app/screen-${id}.webp`,
    `assets/app/screen-${id}.png`,
    `assets/app/screen-${id}.jpg`,
    `assets/app/screenshot-${id}.webp`,
    `assets/app/screenshot-${id}.png`,
    `assets/app/screenshot-${id}.jpg`
  ];
}

async function updateHeroShots() {
  const box = document.getElementById('heroShots');
  if (!box) return;
  box.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    let found = null;
    for (const src of heroShotCandidates(i)) {
      const ok = await imageExists(src);
      if (ok) { found = ok; break; }
    }
    if (found) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hero-shot';
      btn.innerHTML = `<img src="${found}" alt="Manga Translator Studio screenshot ${i}">`;
      btn.addEventListener('click', () => {
        currentImages = [found];
        currentIndex = 0;
        updateLightbox();
        const lb = document.getElementById('lightbox');
        if (lb) { lb.classList.add('active'); lb.setAttribute('aria-hidden', 'false'); }
      });
      box.appendChild(btn);
    }
  }
}

function appPreviewCandidates(folder) {
  return [
    `assets/app/${folder}.webp`,
    `assets/app/${folder}.png`,
    `assets/app/${folder}.jpg`,
    `assets/app/${folder}.jpeg`,
    `assets/app/${activeLang}.webp`,
    `assets/app/${activeLang}.png`,
    `assets/app/${activeLang}.jpg`,
    `assets/app/${activeLang}.jpeg`,
    'assets/app/app-preview.webp',
    'assets/app/app-preview.png',
    'assets/app/app-preview.jpg'
  ];
}

async function updateAppPreview() {
  const img = document.getElementById('appPreviewImage');
  if (!img) return;

  const folder = folderForLang(activeLang);
  for (const src of appPreviewCandidates(folder)) {
    const ok = await imageExists(src);
    if (ok) {
      img.src = ok;
      return;
    }
  }

  img.removeAttribute('src');
  img.alt = 'Manga Translator Studio preview not found';
}

function applyLanguage() {
  document.documentElement.lang = activeLang;
  document.documentElement.dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (val.includes('<span>')) el.innerHTML = val;
    else el.textContent = val;
  });

  const pair = document.getElementById('galleryPairLabel');
  if (pair) pair.textContent = galleryPairText(activeLang);

  localStorage.setItem('mts_lang', activeLang);
  updateAppPreview();
  applySiteTheme(document.body.classList.contains('theme-dark') ? 'dark' : 'light');
  updateHeroShots();
  renderGallery();
}

function setupLanguageSelect() {
  const select = document.getElementById('languageSelect');
  if (!select) return;

  select.innerHTML = '';
  LANGUAGES.forEach(([code, label]) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = label;
    select.appendChild(opt);
  });

  if (!LANGUAGES.some(l => l[0] === activeLang)) activeLang = 'en';
  select.value = activeLang;

  select.addEventListener('change', () => {
    activeLang = select.value;
    applyLanguage();
  });
}

function setGalleryMessage(type, html) {
  const wrap = document.getElementById('translationGallery');
  const dots = document.getElementById('galleryDots');
  if (dots) dots.innerHTML = '';
  if (wrap) wrap.innerHTML = `<div class="gallery-${type}">${html}</div>`;
}

async function renderGallery() {
  const token = ++renderToken;
  const wrap = document.getElementById('translationGallery');
  const dots = document.getElementById('galleryDots');
  if (!wrap) return;

  const folder = folderForLang(activeLang);
  currentImages = [];
  wrap.innerHTML = '<div class="gallery-loading">Loading gallery...</div>';
  if (dots) dots.innerHTML = '';

  let usedFolder = folder;
  let images = await existingGalleryImages(folder);

  if (images.length === 0 && folder !== GALLERY_FALLBACK_FOLDER) {
    usedFolder = GALLERY_FALLBACK_FOLDER;
    images = await existingGalleryImages(GALLERY_FALLBACK_FOLDER);
  }

  if (token !== renderToken) return;

  if (images.length === 0) {
    currentImages = [];
    setGalleryMessage(
      'empty',
      `Galleria vuota.<br>
       Carica le immagini in:<br>
       <b>assets/gallery_preview/thumbs/${folder}/01.jpg</b><br>
       <b>assets/gallery_preview/thumbs/${folder}/02.jpg</b><br>
       <b>assets/gallery_preview/thumbs/${folder}/03.jpg</b><br><br>
       Usa nomi minuscoli. GitHub Pages distingue maiuscole/minuscole.`
    );
    return;
  }

  wrap.innerHTML = '';
  currentImages = images.map(x => x.full);

  if (folder !== usedFolder) {
    const notice = document.createElement('div');
    notice.className = 'gallery-notice';
    notice.innerHTML = `Nessuna immagine trovata in <b>assets/gallery_preview/thumbs/${folder}/</b>. Mostro fallback <b>${usedFolder}</b>.`;
    wrap.appendChild(notice);
  }

  images.forEach((img, index) => {
    const card = document.createElement('button');
    card.className = 'gallery-card';
    card.type = 'button';
    card.innerHTML = `
      <img loading="lazy" src="${img.thumb}" alt="${langName(activeLang)} translation ${img.label}">
      <span>${galleryPairText(activeLang)} · ${img.label}</span>
    `;
    card.addEventListener('click', () => openLightbox(index));
    wrap.appendChild(card);
  });

  renderDots(images.length);
}

function renderDots(count) {
  const dots = document.getElementById('galleryDots');
  const wrap = document.getElementById('translationGallery');
  if (!dots || !wrap) return;

  dots.innerHTML = '';
  const pages = Math.max(1, Math.ceil(count / 2));
  for (let i = 0; i < pages; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => scrollGalleryPage(i));
    dots.appendChild(b);
  }
}

function scrollGalleryPage(page) {
  const wrap = document.getElementById('translationGallery');
  if (!wrap) return;
  wrap.scrollTo({ left: page * wrap.clientWidth * 0.98, behavior: 'smooth' });
  document.querySelectorAll('#galleryDots button').forEach((b, i) => {
    b.classList.toggle('active', i === page);
  });
}

function galleryMove(dir) {
  const wrap = document.getElementById('translationGallery');
  if (!wrap) return;
  const max = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
  const next = Math.min(max, Math.max(0, wrap.scrollLeft + dir * wrap.clientWidth * 0.98));
  wrap.scrollTo({ left: next, behavior: 'smooth' });
}

function openLightbox(i) {
  if (!currentImages.length) return;
  currentIndex = i;
  updateLightbox();
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.add('active');
  lb.setAttribute('aria-hidden', 'false');
}

function updateLightbox() {
  const img = document.getElementById('lightboxImage');
  const counter = document.getElementById('lightboxCounter');
  if (img) img.src = currentImages[currentIndex];
  if (counter) counter.textContent = `${currentIndex + 1} / ${currentImages.length} · ${galleryPairText(activeLang)}`;
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImage');
  if (lb) {
    lb.classList.remove('active');
    lb.setAttribute('aria-hidden', 'true');
  }
  if (img) img.src = '';
}

function nextImage() {
  if (!currentImages.length) return;
  currentIndex = (currentIndex + 1) % currentImages.length;
  updateLightbox();
}

function prevImage() {
  if (!currentImages.length) return;
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  updateLightbox();
}

document.addEventListener('DOMContentLoaded', () => {
  setupLanguageSelect();
  applyLanguage();

  const prev = document.getElementById('galleryPrev');
  const next = document.getElementById('galleryNext');
  const close = document.getElementById('closeLightbox');
  const nextLb = document.getElementById('nextImage');
  const prevLb = document.getElementById('prevImage');
  const lb = document.getElementById('lightbox');

  if (prev) prev.onclick = () => galleryMove(-1);
  if (next) next.onclick = () => galleryMove(1);
  if (close) close.onclick = closeLightbox;
  if (nextLb) nextLb.onclick = nextImage;
  if (prevLb) prevLb.onclick = prevImage;
  if (lb) lb.addEventListener('click', e => { if (e.target.id === 'lightbox') closeLightbox(); });

  document.addEventListener('keydown', e => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });
});

/* v19: Theme toggle + app preview carousel */
const APP_PREVIEW_SLIDES = [
  { src: 'assets/app/app-preview-light.png', label: 'Light Theme' },
  { src: 'assets/app/app-preview-dark.png', label: 'Dark Theme' },
  { src: 'assets/app/app-preview.png', label: 'App Preview' },
  { src: 'assets/app/screen-01.png', label: 'Project Workflow' },
  { src: 'assets/app/screen-02.png', label: 'Translation Preview' },
  { src: 'assets/app/screen-03.png', label: 'Before & After' }
];

function applySiteTheme(theme) {
  const chosen = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('theme-dark', chosen === 'dark');
  document.body.dataset.theme = chosen;
  localStorage.setItem('mts_site_theme', chosen);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    const icon = btn.querySelector('.theme-icon');
    const text = btn.querySelector('.theme-text');
    if (icon) icon.textContent = chosen === 'dark' ? '🌙' : '☀️';
    if (text) text.textContent = themeText(chosen);
    btn.setAttribute('aria-label', chosen === 'dark' ? t('theme.switch.light') : t('theme.switch.dark'));
  }
}

async function initSiteTheme() {
  const saved = localStorage.getItem('mts_site_theme') || 'light';
  applySiteTheme(saved);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
      applySiteTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
}

async function initAppPreviewCarousel() {
  const img = document.getElementById('appPreviewImage');
  const frame = document.querySelector('.app-frame');
  const badge = document.getElementById('previewModeBadge');
  if (!img || !frame) return;

  const available = [];
  for (const slide of APP_PREVIEW_SLIDES) {
    const ok = await imageExists(slide.src);
    if (ok) available.push({ src: ok, label: slide.label });
  }
  if (available.length <= 1) {
    if (available.length === 1) {
      img.src = available[0].src;
      if (badge) badge.textContent = available[0].label;
    }
    return;
  }

  let i = 0;
  const show = () => {
    i = (i + 1) % available.length;
    frame.classList.add('is-changing');
    setTimeout(() => {
      img.src = available[i].src;
      if (badge) badge.textContent = available[i].label;
      frame.classList.remove('is-changing');
    }, 180);
  };

  if (badge) badge.textContent = available[0].label;
  setInterval(show, 4200);
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteTheme();
  initAppPreviewCarousel();
});

/* v21: faster app preview + video modal */
const APP_PREVIEW_BY_THEME = {
  light: 'assets/app/app-preview-light.webp',
  dark: 'assets/app/app-preview-dark.webp'
};

function setAppPreviewForTheme(theme) {
  const img = document.getElementById('appPreviewImage');
  const badge = document.getElementById('previewModeBadge');
  if (!img) return;
  const chosen = theme === 'dark' ? 'dark' : 'light';
  const next = APP_PREVIEW_BY_THEME[chosen];
  if (img.getAttribute('src') !== next) img.src = next;
  if (badge) badge.textContent = previewThemeText(chosen);
}

function applySiteTheme(theme) {
  const chosen = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('theme-dark', chosen === 'dark');
  document.body.dataset.theme = chosen;
  localStorage.setItem('mts_site_theme', chosen);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    const icon = btn.querySelector('.theme-icon');
    const text = btn.querySelector('.theme-text');
    if (icon) icon.textContent = chosen === 'dark' ? '🌙' : '☀️';
    if (text) text.textContent = themeText(chosen);
    btn.setAttribute('aria-label', chosen === 'dark' ? t('theme.switch.light') : t('theme.switch.dark'));
  }
  setAppPreviewForTheme(chosen);
}

function updateAppPreview() {
  const current = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
  setAppPreviewForTheme(current);
}

function updateHeroShots() {
  const box = document.getElementById('heroShots');
  if (box) box.innerHTML = '';
}

function initAppPreviewCarousel() {
  ['assets/app/app-preview-light.webp','assets/app/app-preview-dark.webp'].forEach(src => {
    const img = new Image();
    img.src = src;
  });
  updateAppPreview();
}

function openVideoModal() {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('demoVideo');
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  if (video) {
    try { video.currentTime = 0; video.play(); } catch (e) {}
  }
}

function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('demoVideo');
  if (video) video.pause();
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('appVideoTrigger');
  const heroTrigger = document.getElementById('heroVideoTrigger');
  const close = document.getElementById('closeVideoModal');
  const modal = document.getElementById('videoModal');
  if (trigger) trigger.addEventListener('click', openVideoModal);
  if (heroTrigger) heroTrigger.addEventListener('click', openVideoModal);
  if (close) close.addEventListener('click', closeVideoModal);
  if (modal) modal.addEventListener('click', e => { if (e.target.id === 'videoModal') closeVideoModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVideoModal(); });
});


/* v22: native Windows does not render flag emojis, so use SVG flag images in a custom dropdown */
const FLAG_SVG = {
  en:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1fa-1f1f8.svg',
  it:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ee-1f1f9.svg',
  fr:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1eb-1f1f7.svg',
  de:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1e9-1f1ea.svg',
  es:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ea-1f1f8.svg',
  pt:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f5-1f1f9.svg',
  ru:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f7-1f1fa.svg',
  ja:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ef-1f1f5.svg',
  ko:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f0-1f1f7.svg',
  zh:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1e8-1f1f3.svg',
  'zh-hant':'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f9-1f1fc.svg',
  ar:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f8-1f1e6.svg',
  hi:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ee-1f1f3.svg',
  tr:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f9-1f1f7.svg',
  id:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ee-1f1e9.svg',
  vi:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1fb-1f1f3.svg',
  th:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f9-1f1ed.svg',
  pl:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f5-1f1f1.svg',
  nl:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f3-1f1f1.svg',
  uk:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1fa-1f1e6.svg'
};
function labelNoEmoji(label){return String(label||'').replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u,'');}
function flagImg(code){return `<img class="flag-img" src="${FLAG_SVG[code]||FLAG_SVG.en}" alt="" loading="lazy">`;}
function updateBrandLogos(theme){
  const chosen = theme === 'light' ? 'light' : 'dark';
  const src = chosen === 'dark' ? 'assets/logo/app-icon-dark.png' : 'assets/logo/app-icon-light.png';
  document.querySelectorAll('.brand-logo').forEach(img=>{ if(img.getAttribute('src')!==src) img.src=src; });
  const fav=document.querySelector('link[rel="icon"]'); if(fav) fav.href = src;
  const apple=document.querySelector('link[rel="apple-touch-icon"]'); if(apple) apple.href = src;
}
function buildCustomLanguagePicker(){
  const select=document.getElementById('languageSelect'); if(!select || document.getElementById('customLanguage')) return;
  const wrap=document.createElement('div'); wrap.id='customLanguage'; wrap.className='custom-language';
  wrap.innerHTML=`<button class="custom-language-button" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="custom-language-current"></span><span class="custom-language-caret">⌄</span></button><div class="custom-language-list" role="listbox"></div>`;
  select.parentNode.insertBefore(wrap, select);
  const btn=wrap.querySelector('.custom-language-button'); const current=wrap.querySelector('.custom-language-current'); const list=wrap.querySelector('.custom-language-list');
  LANGUAGES.forEach(([code,label])=>{
    const b=document.createElement('button'); b.type='button'; b.className='custom-language-option'; b.dataset.code=code; b.setAttribute('role','option');
    b.innerHTML=`${flagImg(code)}<span>${labelNoEmoji(label)}</span>`;
    b.addEventListener('click',()=>{activeLang=code; select.value=code; wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false'); applyLanguage(); updateCustomLanguagePicker();});
    list.appendChild(b);
  });
  btn.addEventListener('click',()=>{const open=!wrap.classList.contains('open'); wrap.classList.toggle('open',open); btn.setAttribute('aria-expanded',String(open));});
  document.addEventListener('click',e=>{if(!wrap.contains(e.target)){wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false');}});
  updateCustomLanguagePicker();
}
function updateCustomLanguagePicker(){
  const wrap=document.getElementById('customLanguage'); if(!wrap) return;
  const current=wrap.querySelector('.custom-language-current');
  const lang=getLangData(activeLang); const code=lang[0], label=labelNoEmoji(lang[1]);
  current.innerHTML=`${flagImg(code)}<span>${label}</span>`;
  wrap.querySelectorAll('.custom-language-option').forEach(b=>b.classList.toggle('active',b.dataset.code===activeLang));
}
const _oldApplyLanguageV22 = applyLanguage;
applyLanguage = function(){ _oldApplyLanguageV22(); updateCustomLanguagePicker(); };
const _oldApplyThemeV22 = applySiteTheme;
applySiteTheme = function(theme){ _oldApplyThemeV22(theme); updateBrandLogos(theme === 'dark' ? 'dark':'light'); };
document.addEventListener('DOMContentLoaded',()=>{buildCustomLanguagePicker(); updateBrandLogos(document.body.classList.contains('theme-dark')?'dark':'light');});

// V26: ensure theme-dependent logo runs after load.
document.addEventListener('DOMContentLoaded',()=>{ updateBrandLogos(document.body.classList.contains('theme-dark') ? 'dark' : 'light'); });

// V30: every pricing toggle expands/collapses all pricing cards together.
document.addEventListener('DOMContentLoaded', () => {
  const pricing = document.querySelector('.pricing-section');
  if (!pricing) return;

  const toggles = Array.from(document.querySelectorAll('#pricingFeatureToggle, .plan-feature-toggle'));
  if (!toggles.length) return;

  const closedText = () => (typeof t === 'function' ? t('pricing.show.features') : 'Show all features');
  const openText = closedText;

  const syncToggles = () => {
    const isOpen = pricing.classList.contains('features-open');
    toggles.forEach((toggle) => {
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const label = toggle.querySelector('[data-i18n]');
      if (label) label.textContent = isOpen ? openText() : closedText();
    });
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      pricing.classList.toggle('features-open');
      syncToggles();
    });
  });

  syncToggles();
});

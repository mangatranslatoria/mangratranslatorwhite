/* Manga Translator Studio - mobile-safe gallery
   Thumbnail path:
   assets/gallery_preview/thumbs/italian/01.jpg

   Full image path:
   assets/gallery_preview/full/italian/01.jpg

   Same folder names and file names in thumbs/ and full/.
   GitHub Pages is case-sensitive: 01.JPG is NOT 01.jpg.
*/

const SOURCE_LABEL = 'English';
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


function galleryPairText(code) {
  if (code === 'en') return 'Japanese → English';
  if (code === 'ja') return 'English → Japanese';
  return `${SOURCE_LABEL} → ${langName(code)}`;
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

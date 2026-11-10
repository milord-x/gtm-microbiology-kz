(() => {
  const deck = document.getElementById('deck');
  const slides = [...document.querySelectorAll('.slide')];
  const announcement = document.getElementById('announcement');
  let current = 0;
  let digits = '';
  let digitTimer;
  let touchStart;
  slides.forEach((slide) => {
    slide.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--delay', `${Math.min(i * 100, 650)}ms`));
  });
  function fit() {
    if (innerWidth <= 700) return;
    const width = Math.max(1600, 900 * innerWidth / innerHeight);
    const height = Math.max(900, 1600 * innerHeight / innerWidth);
    deck.style.width = `${width}px`;
    deck.style.height = `${height}px`;
    deck.style.setProperty('--ex', `${(width - 1600) / 2}px`);
    deck.style.setProperty('--ey', `${(height - 900) / 2}px`);
    deck.style.transform = `scale(${innerWidth / width})`;
  }
  function show(index) {
    if (!Number.isFinite(index)) return;
    current = Math.max(0, Math.min(slides.length - 1, Math.trunc(index)));
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('active', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
      if (!active) slide.querySelectorAll('video').forEach(video => video.pause());
    });
    history.replaceState(null, '', `#${current + 1}`);
    announcement.textContent = slides[current].dataset.title;
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else announcement.textContent = 'Бұл браузерде толық экран қолжетімсіз';
    } catch {
      announcement.textContent = 'Браузер толық экран режимін қоспады';
    }
  }
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const tag = event.target.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT', 'VIDEO'].includes(tag) || event.target.isContentEditable) return;
    if (['BUTTON', 'A'].includes(tag) && [' ', 'Enter'].includes(event.key)) return;
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      show(current + 1);
    } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      show(current - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      show(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      show(slides.length - 1);
    } else if (event.key.toLowerCase() === 'f') fullscreen();
    else if (/^\d$/.test(event.key)) {
      digits = (digits + event.key).slice(-2);
      clearTimeout(digitTimer);
      digitTimer = setTimeout(() => { digits = ''; }, 2500);
    } else if (event.key === 'Enter' && digits) {
      show(Number(digits) - 1);
      digits = '';
    }
  });
  deck.addEventListener('touchstart', event => {
    if (event.target.closest('video,button,a')) return;
    const touch = event.changedTouches[0];
    touchStart = {x:touch.clientX, y:touch.clientY};
  }, {passive:true});
  deck.addEventListener('touchend', event => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.7) show(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, {passive:true});
  document.getElementById('bio-pause').addEventListener('click', event => {
    const button = event.currentTarget;
    const paused = button.getAttribute('aria-pressed') !== 'true';
    document.getElementById('bio-animation').classList.toggle('paused', paused);
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Жалғастыру' : 'Кідірту';
  });
  addEventListener('resize', fit);
  addEventListener('hashchange', () => show(Number(location.hash.slice(1)) - 1));
  fit();
  show(Number(location.hash.slice(1)) - 1);
})();

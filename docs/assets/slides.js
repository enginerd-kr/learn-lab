/*
 * slides.js — deck navigation controller (auto-initialized).
 *
 * Expects markup:
 *   <div class="deck">
 *     <section class="slide">…</section>
 *     …
 *   </div>
 *   <div class="nav">
 *     <button id="prev">‹</button>
 *     <div class="dots" id="dots"></div>
 *     <span class="counter" id="counter"></span>
 *     <button id="next">›</button>
 *   </div>
 *
 * Keyboard: ← / → / Space / PageUp / PageDown / Home / End
 *
 * Extension point — dispatches cancelable CustomEvent on the active
 * slide before advancing:
 *   - "slides:beforenext"
 *   - "slides:beforeprev"
 * If a listener calls event.preventDefault(), navigation is skipped.
 * (Used by magic-code.js to consume arrow keys for code stepping.)
 *
 * Touch: horizontal swipe on the deck advances slides (same code path as
 * arrow keys, so magic-code step events fire too). Swipes that start on a
 * horizontally-scrollable descendant are ignored so users can still scroll
 * wide code blocks sideways.
 */

function init() {
  const slides = Array.from(document.querySelectorAll('.slide'));
  if (!slides.length) return;

  const dotsEl = document.getElementById('dots');
  const counter = document.getElementById('counter');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  let current = 0;

  if (dotsEl) {
    slides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    });
  }

  function goTo(i) {
    if (i < 0 || i >= slides.length) return;
    slides[current].classList.remove('active');
    slides[current].classList.toggle('prev', i > current);
    current = i;
    slides.forEach((s, idx) => {
      s.classList.toggle('active', idx === current);
      s.classList.toggle('prev', idx < current);
    });
    if (dotsEl) {
      dotsEl.querySelectorAll('.dot').forEach((d, idx) => {
        d.classList.toggle('active', idx === current);
      });
    }
    if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === slides.length - 1;
    slides.forEach(s => { s.scrollTop = 0; });
    const target = slides[current];
    requestAnimationFrame(() => {
      target.scrollTop = 0;
      requestAnimationFrame(() => { target.scrollTop = 0; });
    });
    setTimeout(() => { target.scrollTop = 0; }, 500);
  }

  function dispatch(name) {
    const slide = slides[current];
    if (!slide) return false;
    const ev = new CustomEvent(name, { bubbles: true, cancelable: true });
    slide.dispatchEvent(ev);
    return ev.defaultPrevented;
  }

  function next() {
    if (dispatch('slides:beforenext')) return;
    goTo(current + 1);
  }
  function prev() {
    if (dispatch('slides:beforeprev')) return;
    goTo(current - 1);
  }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prev();
    } else if (e.key === 'Home') {
      goTo(0);
    } else if (e.key === 'End') {
      goTo(slides.length - 1);
    }
  });

  const deck = document.getElementById('deck') || slides[0]?.parentElement;
  if (deck) {
    const SWIPE_MIN = 50;
    const SWIPE_RATIO = 1.4;
    let startX = 0, startY = 0, tracking = false;

    function startsOnScrollableRow(target) {
      let el = target;
      while (el && el !== deck) {
        if (el.nodeType === 1) {
          const style = getComputedStyle(el);
          const ox = style.overflowX;
          if ((ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth + 1) {
            return true;
          }
        }
        el = el.parentElement;
      }
      return false;
    }

    deck.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) { tracking = false; return; }
      const t = e.touches[0];
      if (startsOnScrollableRow(e.target)) { tracking = false; return; }
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    }, { passive: true });

    deck.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const t = (e.changedTouches && e.changedTouches[0]);
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < SWIPE_MIN) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;
      if (dx < 0) next(); else prev();
    }, { passive: true });

    deck.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });
  }

  goTo(0);

  window.__slides = {
    goTo,
    next,
    prev,
    current: () => current,
    count: () => slides.length,
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

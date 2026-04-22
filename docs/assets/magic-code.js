/*
 * magic-code.js — step-by-step morphing code blocks via shiki-magic-move.
 *
 * The host page must provide:
 *   1. <script type="importmap"> with "shiki" and "shiki-magic-move/" bare specifiers
 *   2. <link rel="stylesheet"> to shiki-magic-move's dist/style.css
 *
 * Markup:
 *   <div class="magic-code" data-lang="python">
 *     <template data-step>code for step 1</template>
 *     <template data-step>code for step 2</template>
 *     <template data-step>code for step 3</template>
 *   </div>
 *
 * Slide integration — each block listens for cancelable
 * "slides:beforenext" / "slides:beforeprev" on its enclosing .slide
 * (if any) and calls preventDefault() to consume the key when it
 * still has a next/previous step.
 */

import { createHighlighter } from 'shiki';
import { codeToKeyedTokens, createMagicMoveMachine } from 'shiki-magic-move/core';
import { MagicMoveRenderer } from 'shiki-magic-move/renderer';

const THEME = 'github-dark';

const RENDERER_OPTIONS = {
  duration: 900,
  delayMove: 0.15,
  delayLeave: 0,
  delayEnter: 0.45,
  stagger: 2,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
};

function readStep(tpl) {
  return tpl.innerHTML
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trimEnd();
}

function ensureMount(container) {
  let mount = container.querySelector('.magic-code-mount');
  if (!mount) {
    mount = document.createElement('pre');
    mount.className = 'magic-code-mount shiki-magic-move-container';
    container.prepend(mount);
  }
  return mount;
}

function ensureCounter(container) {
  let counter = container.querySelector('.code-step-counter');
  if (!counter) {
    let nav = container.querySelector('.code-steps-nav');
    if (!nav) {
      nav = document.createElement('div');
      nav.className = 'code-steps-nav';
      container.appendChild(nav);
    }
    counter = document.createElement('span');
    counter.className = 'code-step-counter';
    nav.appendChild(counter);
  }
  return counter;
}

async function init() {
  const blocks = Array.from(document.querySelectorAll('.magic-code'));
  if (!blocks.length) return;

  const langs = [...new Set(blocks.map(b => b.dataset.lang || 'python'))];
  const highlighter = await createHighlighter({ themes: [THEME], langs });

  for (const container of blocks) {
    const lang = container.dataset.lang || 'python';
    const steps = Array.from(container.querySelectorAll('template[data-step]')).map(readStep);
    if (!steps.length) continue;

    const mount = ensureMount(container);
    const counter = ensureCounter(container);

    const renderer = new MagicMoveRenderer(mount, RENDERER_OPTIONS);
    renderer.setCssVariables();
    const machine = createMagicMoveMachine(
      code => codeToKeyedTokens(highlighter, code, { lang, theme: THEME })
    );
    let idx = 0;

    function render(i, animated = true) {
      const { current } = machine.commit(steps[i]);
      renderer.render(current);
      counter.textContent = `${i + 1} / ${steps.length}`;
      if (animated) container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    render(0, false);

    const slide = container.closest('.slide');
    if (slide) {
      slide.addEventListener('slides:beforenext', (ev) => {
        if (idx < steps.length - 1) {
          ev.preventDefault();
          idx++;
          render(idx);
        }
      });
      slide.addEventListener('slides:beforeprev', (ev) => {
        if (idx > 0) {
          ev.preventDefault();
          idx--;
          render(idx);
        }
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

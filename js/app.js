// js/app.js
import { renderGalleryHTML } from './gallery-render.mjs';
import { renderResultsHTML } from './results-render.mjs';
import { getStageState } from './funnel-state.mjs';
import { Config } from './config.mjs';
import { initScrollReveal } from './scroll-reveal.mjs';

async function initGallery() {
  const root = document.getElementById('gallery-root');
  if (!root) return;

  try {
    const res = await fetch('assets/gallery/manifest.json');
    const images = await res.json();
    root.innerHTML = renderGalleryHTML(images);
  } catch (err) {
    root.innerHTML = renderGalleryHTML([]);
  }
}

async function initResults() {
  const root = document.getElementById('results-root');
  if (!root) return;

  try {
    const res = await fetch('data/results.json');
    const results = await res.json();
    root.innerHTML = renderResultsHTML(results);
  } catch (err) {
    root.innerHTML = renderResultsHTML([]);
  }
}

function nowISO() {
  return new Date().toISOString();
}

// After the deadline, the first step turns into a late-entry request by email.
function showLateRegistration(cta) {
  const email = Config.LATE_REGISTRATION_EMAIL;
  const subject = encodeURIComponent('Late registration – UWC Ethics Invitational 2026');

  document.getElementById('register')?.classList.add('enter--closed');

  const lede = document.getElementById('enter-lede');
  if (lede) {
    lede.innerHTML = 'Three to five students, one case, four rounds of live ethical reasoning over Zoom. Registration closed on <strong>26 October 2026</strong>.';
  }

  const title = document.getElementById('register-step-title');
  if (title) title.textContent = 'Missed the deadline?';

  const text = document.getElementById('register-step-text');
  if (text) text.textContent = 'Registration has closed, but late places may still be available. Email the organising team and we’ll let you know.';

  cta.textContent = 'Email the organisers';
  cta.href = `mailto:${email}?subject=${subject}`;

  const address = document.createElement('p');
  address.className = 'enter__address';
  address.textContent = email;
  cta.after(address);

  const payText = document.querySelector('#pay-step p');
  if (payText) payText.textContent = 'Already registered? Settle the $203 SGD fee through the secure payment portal.';
}

function initRegistrationCTA() {
  const cta = document.getElementById('registration-cta');
  if (!cta) return;

  const state = getStageState(nowISO(), Config.REGISTRATION_OPEN, Config.REGISTRATION_CLOSE);
  const formUrlReady = !Config.REGISTRATION_FORM_URL.startsWith('REPLACE_WITH');

  if (state === 'before') {
    cta.textContent = 'Registration opens 6 Oct 2026';
    cta.classList.add('btn--pending');
    cta.removeAttribute('href');
  } else if (state === 'after') {
    showLateRegistration(cta);
  } else if (!formUrlReady) {
    cta.textContent = 'Registration link coming soon';
    cta.classList.add('btn--disabled');
    cta.removeAttribute('href');
  } else {
    cta.textContent = 'Register your team';
    cta.href = Config.REGISTRATION_FORM_URL;
    cta.target = '_blank';
    cta.rel = 'noopener';
  }
}

initGallery();
initResults();
initRegistrationCTA();
initScrollReveal();

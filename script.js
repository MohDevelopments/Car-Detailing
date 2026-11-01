/* Car Detailing Demo: vanilla JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  /* Count a number up or down smoothly */
  function count(el, to, fmt = Math.round) {
    cancelAnimationFrame(el._r);
    const from = el._v || 0, t0 = performance.now();
    (function step(t) {
      const p = RM ? 1 : Math.min((t - t0) / 700, 1);
      el._v = from + (to - from) * (1 - Math.pow(1 - p, 3));
      el.textContent = fmt(el._v);
      if (p < 1) el._r = requestAnimationFrame(step);
    })(t0);
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
  }

  /* ---------- Headline: split into letters for the entrance ---------- */
  $$('.split').forEach(h => {
    let i = 0;
    const text = h.textContent;
    h.textContent = '';
    text.split(' ').forEach(word => {
      const w = document.createElement('span');
      w.className = 'w';
      [...word].forEach(c => {
        const ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = c;
        ch.style.setProperty('--i', i++);
        w.append(ch);
      });
      h.append(w, ' ');
    });
  });

  /* ---------- Speed streaks behind the car ---------- */
  const streaks = [];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('i');
    s.className = 'st';
    s.style.cssText = `top:${rand(0, 92)}%;width:${rand(12, 40)}vw;opacity:${rand(.2, .7)}`;
    $('#streaks').append(s);
    streaks.push(s.animate(
      [{ transform: 'translateX(110vw)' }, { transform: 'translateX(-60vw)' }],
      { duration: rand(3000, 8000), iterations: Infinity, delay: -rand(0, 6000) }
    ));
  }
  const rate = r => streaks.forEach(a => { a.playbackRate = r; });
  rate(RM ? 0 : .3);

  /* ---------- Car: entrance, wheels, engine rev ---------- */
  const car = $('#car');
  const wheels = $$('animateTransform');
  const spin = d => wheels.forEach(w => w.setAttribute('dur', d + 's'));
  let busy = false, ac;

  function engineSound() {
    try {
      ac = ac || new AudioContext();
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = 'sawtooth';
      f.type = 'lowpass';
      f.frequency.value = 700;
      o.frequency.setValueAtTime(55, t);
      o.frequency.exponentialRampToValueAtTime(190, t + 1.2);
      o.frequency.exponentialRampToValueAtTime(75, t + 1.7);
      o.frequency.exponentialRampToValueAtTime(360, t + 2.4);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.08, t + .2);
      g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
      o.connect(f).connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 2.7);
    } catch (e) { /* audio unavailable */ }
  }

  async function enter() {
    if (RM) return;
    spin(.15);
    rate(3);
    await car.animate(
      [{ transform: 'translateX(-120vw)' }, { transform: 'translateX(0)' }],
      { duration: 1500, easing: 'cubic-bezier(.1,.8,.2,1)', fill: 'forwards' }
    ).finished;
    car.getAnimations().forEach(a => a.cancel());
    spin(8);
    rate(.3);
  }

  async function rev() {
    if (busy) return;
    busy = true;
    const out = $('#rpm'), t0 = performance.now();
    car.classList.add('lit');
    engineSound();
    spin(.12);
    rate(2);
    (function tick(t) {
      const p = Math.min((t - t0) / 2400, 1);
      out.textContent = Math.round(900 + 6300 * Math.abs(Math.sin(p * Math.PI * 1.5)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
    car.animate(Array.from({ length: 16 }, () => ({ transform: `translate(${rand(-3, 3)}px,${rand(-2, 2)}px)` })), { duration: 1500 });
    await wait(1500);
    rate(14);
    await car.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(120vw)' }],
      { duration: 800, easing: 'cubic-bezier(.7,0,1,.6)', fill: 'forwards' }
    ).finished;
    car.classList.remove('lit');
    out.textContent = 0;
    await enter();
    busy = false;
  }
  $('#rev').addEventListener('click', rev);

  /* ---------- Paint studio: one color drives the whole site ---------- */
  const swatches = $$('.sw');
  swatches.forEach(btn => btn.addEventListener('click', () => {
    swatches.forEach(b => b.setAttribute('aria-pressed', b === btn));
    root.style.setProperty('--paint', btn.style.getPropertyValue('--c'));
    $('.tilt').animate([{ filter: 'brightness(1.7)' }, { filter: 'none' }], { duration: 600 });
  }));
  $$('.fin button').forEach(btn => btn.addEventListener('click', () => {
    $$('.fin button').forEach(b => b.setAttribute('aria-pressed', b === btn));
    root.style.setProperty('--gl', btn.dataset.gl);
    toast(btn.textContent + ' finish applied');
  }));

  /* ---------- Pointer effects: spotlight, car tilt, card glare, magnetic buttons ---------- */
  let ptr = null, queued = false;
  addEventListener('pointermove', e => {
    ptr = e;
    if (queued || RM) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const { clientX: x, clientY: y, target } = ptr;
      root.style.setProperty('--mx', x + 'px');
      root.style.setProperty('--my', y + 'px');
      root.style.setProperty('--ry', (x / innerWidth - .5) * 12 + 'deg');
      root.style.setProperty('--rx', -(y / innerHeight - .5) * 6 + 'deg');
      const card = target.closest && target.closest('.card');
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--x', x - r.left + 'px');
        card.style.setProperty('--y', y - r.top + 'px');
      }
      $$('.mag').forEach(b => {
        const r = b.getBoundingClientRect(), dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
        b.style.transform = Math.hypot(dx, dy) < 90 ? `translate(${dx * .25}px,${dy * .35}px)` : '';
      });
    });
  }, { passive: true });

  /* ---------- Package builder ---------- */
  const PK = {
    express: { n: 'Express', p: 79, t: 1.5, pr: 30, steps: ['Foam pre-wash', 'Hand wash and dry', 'Wheels and tires', 'Streak-free windows', 'Quick interior wipe'] },
    signature: { n: 'Signature', p: 189, t: 4, pr: 65, steps: ['Everything in Express', 'Clay bar decontamination', 'Single-stage polish', 'Sealant wax', 'Interior deep clean'] },
    showroom: { n: 'Showroom', p: 420, t: 8, pr: 90, steps: ['Everything in Signature', 'Multi-stage paint correction', 'Ceramic prep', 'Leather conditioning', 'Trim restoration'] }
  };
  const SIZES = { 1: 'Compact', 1.2: 'Sedan', 1.45: 'SUV' };
  const bf = $('#bf');
  let last, lastKey = '';

  function calc() {
    const d = new FormData(bf), k = PK[d.get('pk')], sz = +d.get('sz');
    const ads = $$('[name=ad]:checked', bf);
    const total = (k.p + ads.reduce((s, a) => s + +a.value, 0)) * sz;
    const hrs = k.t + ads.reduce((s, a) => s + +a.dataset.t, 0);
    const prot = Math.min(100, k.pr + ads.reduce((s, a) => s + +a.dataset.p, 0));

    count($('#tot'), total, money);
    count($('#pv'), prot);
    $('.arc').style.strokeDashoffset = 327 * (1 - prot / 100);
    $('#tm').textContent = `About ${hrs} hour${hrs === 1 ? '' : 's'} in the studio`;

    const items = [...k.steps, ...ads.map(a => a.dataset.n)];
    const key = items.join('|');
    if (key !== lastKey) {
      lastKey = key;
      $('#steps').innerHTML = items.map((s, i) => `<li style="--i:${i}">${s}</li>`).join('');
    }
    last = { name: k.n, size: SIZES[sz], total };
  }
  bf.addEventListener('input', calc);
  calc();

  /* ---------- Booking dialog + confetti ---------- */
  const dlg = $('#dlg'), book = $('#book'), done = $('#done');
  book.elements.day.min = new Date().toISOString().slice(0, 10);

  function confetti() {
    for (let i = 0; i < 36; i++) {
      const c = document.createElement('i'), a = rand(0, Math.PI * 2), d = rand(90, 250);
      c.className = 'cf';
      c.style.background = `hsl(${rand(0, 360)} 90% 60%)`;
      done.append(c);
      c.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 90}px) rotate(${rand(0, 720)}deg) scale(.4)`, opacity: 0 }
      ], { duration: rand(1100, 1800), easing: 'cubic-bezier(.1,.8,.3,1)' }).onfinish = () => c.remove();
    }
  }

  $$('[data-book]').forEach(b => b.addEventListener('click', () => {
    book.reset();
    book.hidden = false;
    done.hidden = true;
    $('#sum').textContent = b.dataset.book === 'est'
      ? `${last.name} · ${last.size} · ${money(last.total)}`
      : 'Pick a day and we’ll hold your slot.';
    dlg.showModal();
  }));
  $$('[data-close]').forEach(b => b.addEventListener('click', () => dlg.close()));
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  book.addEventListener('submit', e => {
    e.preventDefault();
    $('#who').textContent = new FormData(book).get('name');
    book.hidden = true;
    done.hidden = false;
    if (!RM) confetti();
    toast('Booking confirmed (demo)');
  });

  /* ---------- Inspection light ---------- */
  const lab = $('#lab');
  let manual = false, labVisible = false;
  const lens = (x, y) => { lab.style.setProperty('--lx', x + 'px'); lab.style.setProperty('--ly', y + 'px'); };
  new IntersectionObserver(([e]) => { labVisible = e.isIntersecting; }).observe(lab);
  lab.addEventListener('pointermove', e => {
    manual = true;
    const r = lab.getBoundingClientRect();
    lens(e.clientX - r.left, e.clientY - r.top);
  });
  lab.addEventListener('pointerleave', () => { manual = false; });
  (function idle(t) {
    if (!manual && labVisible && !RM) {
      const r = lab.getBoundingClientRect();
      lens(r.width * (.5 + .32 * Math.sin(t / 1400)), r.height * (.5 + .28 * Math.sin(t / 900 + 1)));
    }
    requestAnimationFrame(idle);
  })(0);

  /* ---------- Reveals, scroll progress, timeline ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in', 'on'); io.unobserve(e.target); }
  }), { threshold: .2 });
  $$('.rv, .tl li').forEach(el => io.observe(el));

  const tl = $('#tl');
  addEventListener('scroll', () => {
    root.style.setProperty('--sp', scrollY / (root.scrollHeight - innerHeight));
    const r = tl.getBoundingClientRect();
    tl.style.setProperty('--tp', Math.min(Math.max((innerHeight * .65 - r.top) / r.height, 0), 1));
  }, { passive: true });

  const mt = $('.mt');
  mt.innerHTML += mt.innerHTML;
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- Boot sequence, then the car drives in ---------- */
  let v = 0;
  const boot = setInterval(() => {
    v = Math.min(100, v + (RM ? 100 : Math.ceil(rand(3, 12))));
    $('#bn').textContent = v + '%';
    if (v === 100) {
      clearInterval(boot);
      setTimeout(() => {
        $('#boot').classList.add('off');
        document.body.classList.add('ready');
        enter();
      }, 250);
    }
  }, 70);
})();

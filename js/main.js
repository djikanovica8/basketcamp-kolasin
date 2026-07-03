/* =====================================================================
   DESIGN C — main.js · premium immersive
   Preloader · smooth scroll · reveals · program stepper · 3D coach tilt ·
   gallery drag · countdown · magnetic.  Progressive-enhancement guarded.
   ===================================================================== */
(function () {
  "use strict";
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasLenis = typeof window.Lenis !== "undefined";
  const ST = window.ScrollTrigger;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isMobile = () => window.matchMedia("(hover:none)").matches;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    preloader();
    smoothScroll();
    header();
    counters();
    reveals();
    timelineFill();
    dayNight();
    coachTilt();
    galleryDrag();
    countdown();
    testimonials();
    magnetic();
    parallax();
    heroVideo();
    const y = $("#yr"); if (y) y.textContent = new Date().getFullYear();
    window.addEventListener("langchange", () => { if (ST) ST.refresh(); });
  }

  /* ---------------- PRELOADER ---------------- */
  function preloader() {
    const pre = $("#pre"), bar = $("#preBar"), num = $("#preNum");
    if (!pre) return;
    if (RM) { pre.classList.add("done"); heroReveal(); return; }
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 16 + 7);
      if (bar) bar.style.width = p + "%"; if (num) num.textContent = Math.round(p);
      if (p >= 100) { clearInterval(tick); setTimeout(done, 350); }
    }, 120);
    function done() { pre.classList.add("done"); heroReveal(); }
    setTimeout(() => { if (!pre.classList.contains("done")) done(); }, 4200);
  }

  function heroReveal() {
    if (!hasGSAP || RM) return;
    gsap.set(".hero__title .ln span", { yPercent: 118 });
    gsap.to(".hero__title .ln span", { yPercent: 0, duration: 1.15, ease: "power4.out", stagger: 0.12, delay: 0.05 });
    gsap.fromTo(".hero__kick,.hero__sub,.hero__row,.cd,.hero__scroll", { y: 26 }, { y: 0, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.35, overwrite: "auto" });
  }

  /* ---------------- SMOOTH SCROLL ---------------- */
  let lenis = null;
  function smoothScroll() {
    if (hasGSAP && ST) gsap.registerPlugin(ST);
    if (hasLenis && !RM) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      window.lenis = lenis;
      if (hasGSAP && ST) { lenis.on("scroll", ST.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
      else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    }
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault(); closeMenu();
      if (lenis) lenis.scrollTo(t, { offset: -60, duration: 1.25 }); else t.scrollIntoView({ behavior: RM ? "auto" : "smooth" });
    }));
  }

  /* ---------------- HEADER ---------------- */
  function header() {
    const hd = $("#hd");
    const onScroll = () => { const s = window.scrollY > 30; if (hd) { hd.classList.toggle("scr", s); hd.classList.toggle("on-dark", !s); } };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    const links = $$(".hd__nav a"), map = {};
    links.forEach((l) => { map[l.getAttribute("href").slice(1)] = l; });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((en) => {
        if (en.isIntersecting) { links.forEach((l) => l.classList.remove("on")); const l = map[en.target.id]; if (l) l.classList.add("on"); }
      }), { rootMargin: "-45% 0px -50% 0px" });
      links.forEach((l) => { const s = document.getElementById(l.getAttribute("href").slice(1)); if (s) io.observe(s); });
    }
    const burg = $("#burg"), mm = $("#mm");
    if (burg && mm) burg.addEventListener("click", () => {
      const open = mm.classList.toggle("open"); burg.classList.toggle("x", open);
      document.body.classList.toggle("lock", open); if (lenis) open ? lenis.stop() : lenis.start();
    });
  }
  function closeMenu() { const mm = $("#mm"), burg = $("#burg"); if (mm && mm.classList.contains("open")) { mm.classList.remove("open"); if (burg) burg.classList.remove("x"); document.body.classList.remove("lock"); if (lenis) lenis.start(); } }

  /* ---------------- REVEALS ---------------- */
  function reveals() {
    if (!hasGSAP || !ST || RM) return;
    $$(".reveal-up").forEach((el) => { if (el.closest(".hero")) return;
      gsap.from(el, { y: 38, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }); });
    $$(".reveal-rich").forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 1.05, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    $$(".reveal-img").forEach((el) => gsap.from(el, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "power3.inOut", scrollTrigger: { trigger: el, start: "top 86%" } }));
  }

  /* ---------------- COUNTERS ---------------- */
  function counters() {
    $$(".count").forEach((el) => {
      const to = parseFloat(el.getAttribute("data-to")) || 0, suf = el.getAttribute("data-suffix") || "";
      let done = false;
      const run = () => { if (done) return; done = true; const dur = 1600, t0 = performance.now();
        (function step(now) { const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(to * e) + (k === 1 ? suf : ""); if (k < 1) requestAnimationFrame(step); })(t0); };
      if (hasGSAP && ST && !RM) ST.create({ trigger: el, start: "top 92%", onEnter: run }); else el.textContent = to + suf;
    });
  }

  /* ---------------- PROGRAM TIMELINE (glowing scroll-fill spine) ---------------- */
  function timelineFill() {
    const fill = $("#tlFill"), tl = $("#tl"); if (!fill || !tl) return;
    if (!hasGSAP || !ST || RM) { fill.style.height = "100%"; return; }
    gsap.to(fill, { height: "100%", ease: "none", scrollTrigger: { trigger: tl, start: "top 60%", end: "bottom 82%", scrub: 0.5 } });
    const ball = $(".tl__ball", tl);
    if (ball) gsap.to(ball, { rotation: 900, ease: "none", scrollTrigger: { trigger: tl, start: "top 60%", end: "bottom 82%", scrub: 0.5 } });
    $$(".tl__stop").forEach((stop) => ST.create({
      trigger: stop, start: "top 58%", end: "bottom 58%",
      onEnter: () => stop.classList.add("lit"), onEnterBack: () => stop.classList.add("lit"), onLeaveBack: () => stop.classList.remove("lit")
    }));
  }

  /* ---------------- DAY -> NIGHT (program) ---------------- */
  function dayNight() {
    const pr = $("#program"); if (!pr || !hasGSAP || !ST || RM) return;
    const sun = $(".pr__sun", pr), stars = $(".pr__stars", pr), glow = $(".pr__glow", pr);
    if (sun) gsap.fromTo(sun, { opacity: 1 }, { opacity: 0, ease: "none", scrollTrigger: { trigger: pr, start: "top 55%", end: "center center", scrub: true } });
    if (stars) gsap.fromTo(stars, { opacity: 0 }, { opacity: .9, ease: "none", scrollTrigger: { trigger: pr, start: "top 35%", end: "center 55%", scrub: true } });
    if (glow) gsap.fromTo(glow, { opacity: .18 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: pr, start: "center bottom", end: "bottom bottom", scrub: true } });
  }

  /* ---------------- 3D COACH TILT ---------------- */
  function coachTilt() {
    if (RM || isMobile()) return;
    $$(".cc").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = "rotateX(" + (0.5 - py) * 12 + "deg) rotateY(" + (px - 0.5) * 12 + "deg) translateY(-4px)";
        card.style.setProperty("--mx", px * 100 + "%"); card.style.setProperty("--my", py * 100 + "%");
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------------- GALLERY DRAG ---------------- */
  function galleryDrag() {
    const track = $("#gaRow"), area = $("#gaRow"); if (!track) return;
    let down = false, startX = 0, scroll = 0, vel = 0, last = 0, raf;
    const max = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const apply = () => { scroll = clamp(scroll, -max(), 0); track.style.transform = "translateX(" + scroll + "px)"; };
    const start = (x) => { down = true; startX = x - scroll; last = x; vel = 0; area.classList.add("drag"); cancelAnimationFrame(raf); };
    const move = (x) => { if (!down) return; scroll = x - startX; vel = x - last; last = x; apply(); };
    const end = () => { down = false; area.classList.remove("drag"); inertia(); };
    const inertia = () => { vel *= 0.94; scroll += vel; apply(); if (Math.abs(vel) > 0.4) raf = requestAnimationFrame(inertia); };
    area.addEventListener("mousedown", (e) => { e.preventDefault(); start(e.clientX); });
    window.addEventListener("mousemove", (e) => move(e.clientX));
    window.addEventListener("mouseup", end);
    area.addEventListener("touchstart", (e) => start(e.touches[0].clientX), { passive: true });
    area.addEventListener("touchmove", (e) => move(e.touches[0].clientX), { passive: true });
    area.addEventListener("touchend", end);
    area.addEventListener("wheel", (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { scroll -= e.deltaX; apply(); } }, { passive: true });
  }

  /* ---------------- COUNTDOWN ---------------- */
  function countdown() {
    const target = new Date("2027-06-27T09:30:00+02:00").getTime();
    const D = $("#cdD"), H = $("#cdH"), M = $("#cdM"), S = $("#cdS"); if (!D) return;
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => { let d = Math.max(0, target - Date.now());
      const dd = Math.floor(d / 864e5); d -= dd * 864e5; const hh = Math.floor(d / 36e5); d -= hh * 36e5;
      const mm = Math.floor(d / 6e4); d -= mm * 6e4; const ss = Math.floor(d / 1e3);
      D.textContent = pad(dd); H.textContent = pad(hh); M.textContent = pad(mm); S.textContent = pad(ss); };
    tick(); setInterval(tick, 1000);
  }

  /* ---------------- TESTIMONIALS (auto slider) ---------------- */
  function testimonials() {
    const root = $("#teSlider"); if (!root) return;
    const slides = $$(".te__slide", root);
    const dotsWrap = $("#teDots", root);
    const bar = $(".te__bar > i", root);
    if (slides.length < 2) return;
    const DUR = 7000;
    const anim = hasGSAP && !RM;
    let idx = 0, timer = null, barTween = null;

    slides.forEach((s, i) => {
      const nm = $(".te__id b", s), av = $(".te__ava", s);
      if (av && nm) av.textContent = (nm.textContent.trim().charAt(0) || "•");
      const d = document.createElement("button");
      d.type = "button";
      d.className = "te__dot" + (i === 0 ? " is-on" : "");
      d.setAttribute("aria-label", "Testimonial " + (i + 1));
      d.addEventListener("click", () => go(i, i > idx ? 1 : -1));
      dotsWrap.appendChild(d);
    });
    const dots = $$(".te__dot", dotsWrap);
    const paint = () => dots.forEach((d, i) => d.classList.toggle("is-on", i === idx));

    function reveal(s) {
      if (!anim) return;
      gsap.fromTo($$(".te__stars, .te__quote, .te__by", s),
        { y: 26, autoAlpha: 0, filter: "blur(6px)" },
        { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out", stagger: 0.08, overwrite: true });
    }
    function restartBar() {
      if (!bar || !anim) return;
      if (barTween) barTween.kill();
      barTween = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: DUR / 1000, ease: "none" });
    }
    function schedule() {
      if (RM) return;
      clearTimeout(timer); restartBar();
      timer = setTimeout(() => go(idx + 1), DUR);
    }
    function pause() { clearTimeout(timer); if (barTween) barTween.pause(); }
    function resume() {
      if (RM) return;
      if (barTween && barTween.progress() < 1) {
        const remaining = DUR * (1 - barTween.progress());
        barTween.play(); clearTimeout(timer);
        timer = setTimeout(() => go(idx + 1), remaining);
      } else schedule();
    }
    function go(i) {
      i = (i + slides.length) % slides.length;
      if (i === idx) return;
      idx = i; paint();
      slides.forEach((s, k) => {
        const on = k === idx;
        s.classList.toggle("is-active", on);
        if (anim) gsap.set(s, { autoAlpha: on ? 1 : 0 });
      });
      reveal(slides[idx]);
      schedule();
    }

    $(".te__arrow--next", root).addEventListener("click", () => go(idx + 1));
    $(".te__arrow--prev", root).addEventListener("click", () => go(idx - 1));
    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", resume);
    document.addEventListener("visibilitychange", () => (document.hidden ? pause() : resume()));

    let sx = 0, sw = false;
    root.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sw = true; pause(); }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (!sw) return; sw = false;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) go(dx < 0 ? idx + 1 : idx - 1); else resume();
    }, { passive: true });

    slides.forEach((s, k) => { s.classList.toggle("is-active", k === 0); if (anim) gsap.set(s, { autoAlpha: k === 0 ? 1 : 0 }); });
    const start = () => { reveal(slides[0]); schedule(); };
    if (ST) ST.create({ trigger: root, start: "top 78%", once: true, onEnter: start });
    else start();
  }

  /* ---------------- MAGNETIC ---------------- */
  function magnetic() {
    if (RM || isMobile()) return;
    $$(".btn--orange:not(.btn--full), .cta").forEach((b) => {
      b.addEventListener("mousemove", (e) => { const r = b.getBoundingClientRect();
        b.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.14 + "px," + (e.clientY - r.top - r.height / 2) * 0.24 + "px)"; });
      b.addEventListener("mouseleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------------- PARALLAX (hero video + images) ---------------- */
  function parallax() {
    if (!hasGSAP || !ST || RM) return;
    gsap.to("#heroVideo", { yPercent: 14, scale: 1.14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__inner", { yPercent: -6, opacity: 0.25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    if (isMobile()) return;
    $$(".parallax-img").forEach(function (img) {
      const box = img.closest(".ab__media,.lc") || img;
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: box, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------------- HERO VIDEO autoplay safety ---------------- */
  function heroVideo() {
    const v = $("#heroVideo"); if (!v) return;
    // phones get a lean 720p encode; desktops stream the full-quality master
    const srcEl = v.querySelector("source");
    if (srcEl && window.matchMedia("(max-width: 820px)").matches) {
      srcEl.src = "assets/video/hero-720.mp4"; v.load();
    }
    v.muted = true; v.defaultMuted = true; v.setAttribute("muted", ""); v.playsInline = true;
    const go = function () { try { const p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} };
    go();
    v.addEventListener("loadeddata", go); v.addEventListener("canplay", go);
    ["pointerdown", "touchstart", "scroll", "keydown", "mousemove", "wheel"].forEach(function (ev) {
      window.addEventListener(ev, function start() { go(); window.removeEventListener(ev, start); }, { once: true, passive: true });
    });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) go(); });
  }
})();

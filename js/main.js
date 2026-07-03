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
    wizard();
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

  /* ---------------- REGISTRATION WIZARD ---------------- */
  // endpoint: paste the Google Apps Script web-app /exec URL here after
  // deploying automation/apps-script/Code.gs (see automation/SETUP.md).
  // While empty, submissions gracefully fall back to prefilled email/WhatsApp.
  var REG = {
    endpoint: (window.BCK_CFG && window.BCK_CFG.regEndpoint) || "",
    email: "basketballcampkolasin@gmail.com",
    wa: "38267032132",
    prices: { full: [450, 450, 490], train: [260, 260, 300] }
  };

  function wizard() {
    const f = $("#regForm"); if (!f || !$("#rwNext")) return;
    const panes = $$(".rw__pane", f), steps = $$(".rw__step", f);
    const back = $("#rwBack"), next = $("#rwNext"), submit = $("#rwSubmit");
    const done = $("#rwDone");
    let step = 1;

    const LX = {
      me: {
        smjena: ["Smjena I (27.06 – 02.07.2027.)", "Smjena II (02.07 – 07.07.2027.)", "Smjena III – Skills & Shooting (07.07 – 12.07.2027.)"],
        paket: { full: "Kompletan paket (treninzi + smještaj + ishrana)", train: "Samo treninzi (bez smještaja i ishrane)" },
        subj: "PRIJAVA – Basketball Camp Kolašin 2027", refSuffix: "prijava 2027",
        L: { igrac: "Igrač", rodj: "Datum rođenja", pol: "Pol", klub: "Klub", vis: "Visina", tez: "Težina", opr: "Veličina opreme", drz: "Država", grad: "Grad", email: "Email", tel: "Telefon", smj: "Smjena", pak: "Paket", cij: "Cijena", nap: "Napomena" }
      },
      en: {
        smjena: ["Session I (27.06 – 02.07.2027)", "Session II (02.07 – 07.07.2027)", "Session III – Skills & Shooting (07.07 – 12.07.2027)"],
        paket: { full: "Complete package (trainings + stay + meals)", train: "Trainings only (no stay or meals)" },
        subj: "REGISTRATION – Basketball Camp Kolašin 2027", refSuffix: "registration 2027",
        L: { igrac: "Player", rodj: "Date of birth", pol: "Gender", klub: "Club", vis: "Height", tez: "Weight", opr: "Kit size", drz: "Country", grad: "City", email: "Email", tel: "Phone", smj: "Session", pak: "Package", cij: "Price", nap: "Note" }
      }
    };
    const lang = () => ((window.BCK_I18N && window.BCK_I18N.current) === "en" ? "en" : "me");

    function show(n) {
      step = n;
      panes.forEach((p) => p.classList.toggle("is-on", +p.getAttribute("data-pane") === n));
      steps.forEach((s) => { const k = +s.getAttribute("data-s"); s.classList.toggle("is-on", k === n); s.classList.toggle("is-done", k < n); });
      back.hidden = n === 1; next.hidden = n === 3; submit.hidden = n !== 3;
    }

    function valid(n) {
      const ctls = $$("input,select,textarea", panes[n - 1]);
      for (const c of ctls) if (!c.checkValidity()) { c.reportValidity(); return false; }
      return true;
    }

    next.addEventListener("click", () => { if (valid(step)) show(step + 1); });
    back.addEventListener("click", () => show(step - 1));

    $$(".rw__opt input", f).forEach((input) => {
      input.addEventListener("change", () => {
        $$('.rw__opt input[name="' + input.name + '"]', f).forEach((i) => i.closest(".rw__opt").classList.toggle("is-sel", i.checked));
        price();
      });
    });

    const sel = (name) => { const i = f.querySelector('input[name="' + name + '"]:checked'); return i ? i.value : ""; };

    function price() {
      const s = sel("smjena"), p = sel("paket");
      const priceEl = $("#rwPrice"), old = $("#rwOld"), promo = $("#rwPromo");
      // per-session prices on the package cards
      const idx = s ? +s - 1 : 0;
      const fullB = f.querySelector('.rw__optPrice[data-pk="full"]'), trainB = f.querySelector('.rw__optPrice[data-pk="train"]');
      if (fullB) fullB.innerHTML = REG.prices.full[idx] + " €";
      if (trainB) trainB.innerHTML = REG.prices.train[idx] + " €";
      if (!s || !p) { priceEl.textContent = "—"; old.hidden = true; promo.hidden = true; return 0; }
      const v = REG.prices[p][+s - 1];
      priceEl.textContent = v + " €";
      const isPromo = p === "full" && s === "3";
      old.hidden = !isPromo; promo.hidden = !isPromo;
      return v;
    }

    function composeBody(d, L) {
      return [
        L.L.igrac + ": " + d.ime + " " + d.prezime,
        L.L.rodj + ": " + d.rodjenje,
        L.L.pol + ": " + d.pol,
        d.klub ? L.L.klub + ": " + d.klub : "",
        L.L.vis + " / " + L.L.tez + ": " + d.visina + " cm / " + d.tezina + " kg",
        L.L.opr + ": " + d.oprema,
        L.L.drz + ": " + d.drzava + ", " + d.grad,
        L.L.email + ": " + d.email,
        L.L.tel + ": " + d.telefon,
        L.L.smj + ": " + L.smjena[+d.smjena - 1],
        L.L.pak + ": " + L.paket[d.paket],
        L.L.cij + ": " + d.cijena + " €",
        d.napomena ? L.L.nap + ": " + d.napomena : ""
      ].filter(Boolean).join("\n");
    }

    function finish(d, code) {
      const L = LX[lang()];
      const name = (d.ime + " " + d.prezime).trim();
      const ok = !!code;
      $$(".rw__okOnly", done).forEach((el) => { el.hidden = !ok; });
      $$(".rw__fbOnly", done).forEach((el) => { el.hidden = ok; });
      const ref = ok ? code + " — " + name : name + " — " + L.refSuffix;
      $("#rwRef").textContent = ref;
      $("#rwRefCopy").setAttribute("data-copy", ref);
      if (ok) {
        $("#rwCode").textContent = code;
        $("#rwUpload").href = "uplata.html?code=" + encodeURIComponent(code);
      } else {
        const body = composeBody(d, L);
        $("#rwFbMail").href = "mailto:" + REG.email + "?subject=" + encodeURIComponent(L.subj + " – " + name) + "&body=" + encodeURIComponent(body);
        $("#rwFbWa").href = "https://wa.me/" + REG.wa + "?text=" + encodeURIComponent(L.subj + "\n" + body);
        $("#rwUpload").href = "uplata.html";
      }
      f.hidden = true; done.hidden = false;
      if (lenis) lenis.scrollTo(done, { offset: -110 }); else done.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!valid(3)) return;
      const d = Object.fromEntries(new FormData(f).entries());
      d.cijena = price(); d.lang = lang(); d.action = "register";
      submit.disabled = true; submit.classList.add("is-busy");
      if (!REG.endpoint) { finish(d, null); return; }
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
      fetch(REG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(d), signal: ctl.signal })
        .then((r) => r.json())
        .then((j) => { clearTimeout(t); if (j && j.ok && j.code) finish(d, j.code); else finish(d, null); })
        .catch(() => { clearTimeout(t); finish(d, null); });
    });

    $$(".rw__copy", done).forEach((b) => b.addEventListener("click", () => {
      const v = b.getAttribute("data-copy") || "";
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(v).then(() => {
        b.classList.add("is-ok"); b.textContent = "✓";
        setTimeout(() => { b.classList.remove("is-ok"); b.textContent = "⧉"; }, 1600);
      }).catch(function () {});
    }));

    show(1);
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

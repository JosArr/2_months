/* ==========================================================================
   Coincidimos sin buscarlo — interacciones (JavaScript vanilla, sin dependencias)

   Contenido editable: todos los textos, las fotos y la FIRMA de la carta están
   en index.html (busca el comentario "EDITA AQUÍ"). Este archivo solo contiene
   comportamiento.

   Índice
   0. Utilidades y movimiento reducido   5. Capítulo 3 · distancia y fotos
   1. Aparición, navegación y scroll     6. Capítulo 4 · la carta
   2. Capítulo 1 · prólogo               7. Capítulo 5 · epílogo
   3. Capítulo 2 · hilo y cita           8. Arranque
   ========================================================================== */
(() => {
  "use strict";

  /* 0. UTILIDADES Y MOVIMIENTO REDUCIDO ---------------------------------- */
  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (t) => t * t * (3 - 2 * t);
  const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionQuery.matches;
  const finishers = []; // funciones que dejan cada animación en su estado final

  /** Ejecuta una animación de `duration` ms llamando a `draw(progreso 0..1)`. */
  function animate(duration, draw) {
    return new Promise((resolve) => {
      if (reduced) { draw(1); resolve(); return; }
      const start = performance.now();
      const frame = (now) => {
        if (reduced) { draw(1); resolve(); return; }   // si activan «reducir animaciones» a mitad, termina al instante
        const t = clamp((now - start) / duration);
        draw(t);
        if (t < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  function setReduced(value) {
    reduced = value;
    root.classList.toggle("reduce-motion", value);
    if (value) finishers.forEach((finish) => finish());
  }

  /* 1. APARICIÓN, NAVEGACIÓN Y SCROLL ------------------------------------ */
  const header = $("#siteHeader");
  const progressBar = $("#progressBar");
  const ambient = $("#ambient");
  const railLinks = $$(".rail-link");
  const chapters = $$(".chapter");

  function initReveal() {
    const targets = $$("[data-reveal], [data-photo]");
    const showAll = () => targets.forEach((el) => el.classList.add("is-visible"));
    finishers.push(showAll);
    if (reduced || !("IntersectionObserver" in window)) { showAll(); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((el) => observer.observe(el));
  }

  function initRail() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const number = entry.target.dataset.chapter;
        railLinks.forEach((link) => {
          const active = link.dataset.chapter === number;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    chapters.forEach((chapter) => observer.observe(chapter));
  }

  /* Todo lo que depende del scroll se calcula en un único requestAnimationFrame. */
  const scrollTasks = [];
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? clamp(window.scrollY / max) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
      ambient.style.setProperty("--p", progress.toFixed(4));
      header.classList.toggle("is-scrolled", window.scrollY > 24);
      scrollTasks.forEach((task) => task());
    });
  }

  /* 2. CAPÍTULO 1 · PRÓLOGO ---------------------------------------------- */
  function initHero() {
    const hero = $("#inicio");
    const ids = ["blueA", "greenA", "blueB", "greenB"];
    const paths = Object.fromEntries(ids.map((id) => [id, $("#" + id)]));
    const lengths = Object.fromEntries(ids.map((id) => [id, paths[id].getTotalLength()]));
    const headBlue = $("#headBlue");
    const headGreen = $("#headGreen");

    const draw = (id, t) => {
      paths[id].style.strokeDasharray = lengths[id];
      paths[id].style.strokeDashoffset = lengths[id] * (1 - t);
    };
    const place = (head, id, t) => {
      const point = paths[id].getPointAtLength(lengths[id] * t);
      head.setAttribute("cx", point.x);
      head.setAttribute("cy", point.y);
    };
    const finish = () => {
      ids.forEach((id) => draw(id, 1));
      place(headBlue, "blueB", 1);
      place(headGreen, "greenB", 1);
      hero.classList.add("is-armed", "is-intro", "is-crossed", "is-settled");
    };
    finishers.push(finish);

    // Estado inicial: caminos sin dibujar y puntos en su origen.
    ids.forEach((id) => draw(id, 0));
    place(headBlue, "blueA", 0);
    place(headGreen, "greenA", 0);
    hero.classList.add("is-armed");

    if (reduced) { finish(); return; }

    // Plan de seguridad: si algo se interrumpe, la portada nunca queda oculta.
    const safety = setTimeout(finish, 9000);

    (async () => {
      await wait(250);
      hero.classList.add("is-intro");                       // aparece «Coincidimos»
      await wait(450);
      await animate(2200, (t) => {                          // los caminos se acercan
        const p = easeInOut(t);
        draw("blueA", p); draw("greenA", p);
        place(headBlue, "blueA", p); place(headGreen, "greenA", p);
      });
      hero.classList.add("is-crossed");                     // se cruzan: aparece «sin buscarlo.»
      setTimeout(() => hero.classList.add("is-settled"), 700);
      await animate(1500, (t) => {                          // y siguen, juntos
        const p = easeOut(t);
        draw("blueB", p); draw("greenB", p);
        place(headBlue, "blueB", p); place(headGreen, "greenB", p);
      });
      clearTimeout(safety);
      hero.classList.add("is-settled");
    })().catch(finish);

    // Paralaje muy sutil con el puntero (solo ratón, nunca en táctil).
    const art = $("#crossing");
    if (window.matchMedia("(pointer: fine)").matches) {
      hero.addEventListener("pointermove", (event) => {
        if (reduced) return;
        art.style.setProperty("--px", ((event.clientX / window.innerWidth - .5) * -14).toFixed(2));
        art.style.setProperty("--py", ((event.clientY / window.innerHeight - .5) * -10).toFixed(2));
      });
    }
  }

  /* 3. CAPÍTULO 2 · HILO Y CITA ------------------------------------------ */
  function initStory() {
    const wrap = $("#beats");
    const fill = $("#beatsFill");
    const beats = $$(".beat", wrap);
    const quote = $("#pullquote");
    const text = $("#pullquoteText");

    // Cada palabra de la cita se enciende al leerla.
    const words = text.textContent.trim().split(/\s+/);
    text.textContent = "";
    const wordEls = words.map((word, index) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = word;
      text.appendChild(span);
      if (index < words.length - 1) text.appendChild(document.createTextNode(" "));
      return span;
    });

    const finish = () => {
      fill.style.setProperty("--fill", 1);
      beats.forEach((beat) => beat.classList.add("is-lit"));
      wordEls.forEach((el) => el.classList.add("on"));
      quote.classList.add("is-done");
    };
    finishers.push(finish);
    if (reduced) { finish(); }

    scrollTasks.push(() => {
      if (reduced) return;
      const vh = window.innerHeight;
      // Hilo azul → verde que se dibuja mientras lees.
      const rect = wrap.getBoundingClientRect();
      const lineY = vh * 0.58;
      fill.style.setProperty("--fill", clamp((lineY - rect.top) / rect.height).toFixed(4));
      beats.forEach((beat) => {
        const marker = $(".beat-marker", beat).getBoundingClientRect();
        beat.classList.toggle("is-lit", marker.top + marker.height / 2 < lineY);
      });
      // Cita que se enciende palabra a palabra.
      const q = quote.getBoundingClientRect();
      const p = clamp((vh * 0.82 - q.top) / (q.height + vh * 0.28));
      const lit = Math.round(p * wordEls.length * 1.04);
      wordEls.forEach((el, index) => el.classList.toggle("on", index < lit));
      quote.classList.toggle("is-done", p >= 0.98);
    });
  }

  /* 5. CAPÍTULO 3 · DISTANCIA Y FOTOS ------------------------------------ */
  function initDistance() {
    const box = $("#distance");
    const counter = $("#kmCounter");
    const km = 169;
    const finish = () => {
      box.style.setProperty("--d", 1);
      counter.textContent = km;
      box.classList.add("is-arrived");
    };
    finishers.push(finish);
    if (reduced || !("IntersectionObserver" in window)) { finish(); return; }

    box.style.setProperty("--d", 0);
    counter.textContent = "0";
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      setTimeout(() => {
        animate(2800, (t) => {
          const p = easeInOut(t);
          box.style.setProperty("--d", p.toFixed(4));
          counter.textContent = Math.round(km * p);
        }).then(() => box.classList.add("is-arrived"));
      }, 500);
    }, { threshold: 0.7 });
    observer.observe(box);
  }

  function initPhotos() {
    const figures = $$("[data-photo]");
    const dialog = $("#photoDialog");
    const dialogImg = $("#dialogImg");
    const dialogCaption = $("#dialogCaption");
    let opener = null;

    figures.forEach((figure) => {
      const img = $("img", figure);
      const button = $(".photo-open", figure);
      if (img.dataset.focus) figure.style.setProperty("--focus", img.dataset.focus);

      const markMissing = () => {
        figure.classList.add("is-missing");
        button.disabled = true;
        button.setAttribute("aria-label", "Foto pendiente de añadir");
      };
      img.addEventListener("error", markMissing);
      if (img.complete && img.naturalWidth === 0 && img.currentSrc !== "") markMissing();

      button.addEventListener("click", () => {
        if (button.disabled) return;
        opener = button;
        dialogImg.src = img.currentSrc || img.src;
        dialogImg.alt = img.alt;
        dialogCaption.textContent = $(".cap-title", figure).textContent;
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
          root.classList.add("modal-open");
        } else {
          window.open(dialogImg.src, "_blank", "noopener");
        }
      });
    });

    const close = () => { if (dialog.open) dialog.close(); };
    $("#closePhoto").addEventListener("click", close);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target.classList.contains("photo-dialog-inner")) close();
    });
    dialog.addEventListener("close", () => {
      root.classList.remove("modal-open");
      dialogImg.removeAttribute("src");
      if (opener) opener.focus();
    });

    // Paralaje suave dentro del marco (la foto se desplaza un poco al hacer scroll).
    scrollTasks.push(() => {
      if (reduced) return;
      const vh = window.innerHeight;
      figures.forEach((figure) => {
        const rect = figure.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > vh + 80) return;
        const offset = (rect.top + rect.height / 2 - vh / 2) / vh;
        figure.style.setProperty("--par", `${(offset * -26).toFixed(1)}px`);
      });
    });
  }

  /* 6. CAPÍTULO 4 · LA CARTA --------------------------------------------- */
  function initLetter() {
    const stage = $("#letterStage");
    const openButton = $("#openLetter");
    const closeButton = $("#closeLetter");
    const sheet = $("#letterSheet");
    const hint = $("#envHint");
    const FULL_SEQUENCE_MS = 1950 + 1000; // coincide con --t-swap y la duración de apertura en el CSS

    // Orden de aparición: fecha, saludo, párrafos, despedida, firma y botón.
    const sequence = [$("#letterDate"), $("#letterGreeting"), ...$$("#letterBody p"), $("#letterClosing"), $("#letterSignature"), closeButton];
    sequence.forEach((el, index) => el.style.setProperty("--i", index));
    sheet.style.setProperty("--i-flourish", sequence.length - 1);

    let focusTimer;
    const setState = (state) => {
      stage.dataset.state = state;
      openButton.setAttribute("aria-expanded", String(state === "open"));
    };

    function openLetter() {
      const firstTime = stage.dataset.state === "closed";
      stage.classList.toggle("is-quick", !firstTime || reduced);
      setState("open");
      clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        sheet.focus({ preventScroll: true });
        sheet.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }, reduced || !firstTime ? 80 : FULL_SEQUENCE_MS);
    }

    function foldLetter() {
      stage.classList.add("is-quick");
      setState("folded");
      hint.textContent = "Toca el sobre para volver a leerla";
      clearTimeout(focusTimer);
      openButton.focus({ preventScroll: true });
      focusTimer = setTimeout(() => stage.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }), reduced ? 0 : 700);
    }

    openButton.addEventListener("click", openLetter);
    closeButton.addEventListener("click", foldLetter);
    finishers.push(() => stage.classList.add("is-quick"));

    // Aviso para quien edita: evita enviar la carta con un marcador sin completar.
    if (/\[[^\]]*(EDITA|ESCRIBE|FIRMA)[^\]]*\]/i.test(sheet.textContent)) {
      console.warn("Coincidimos sin buscarlo: la carta aún contiene un marcador sin completar.");
    }
  }

  /* 7. CAPÍTULO 5 · EPÍLOGO ---------------------------------------------- */
  function initEnding() {
    const section = $("#esto-recien-empieza");
    const svg = $("#braid");
    const blue = $("#braidBlue");
    const green = $("#braidGreen");
    const dotBlue = $("#braidDotBlue");
    const dotGreen = $("#braidDotGreen");
    const NS = "http://www.w3.org/2000/svg";

    // Dos hilos que empiezan separados, se acercan y terminan trenzados.
    const WIDTH = 1200, CENTER = 130, STEP = 4;
    const separation = (x) => 78 * (1 - smooth(clamp(x / 520)));
    const amplitude = (x) => 30 * smooth(clamp((x - 380) / 360));
    const wave = (x) => Math.sin((x - 380) / 58);
    const yBlue = (x) => CENTER - separation(x) + amplitude(x) * wave(x);
    const yGreen = (x) => CENTER + separation(x) - amplitude(x) * wave(x);

    const build = (fn) => {
      let d = "";
      for (let x = -10; x <= WIDTH + 10; x += STEP) d += `${x === -10 ? "M" : "L"}${x} ${fn(x).toFixed(1)} `;
      return d;
    };
    blue.setAttribute("d", build(yBlue));
    green.setAttribute("d", build(yGreen));
    const lenBlue = blue.getTotalLength();
    const lenGreen = green.getTotalLength();

    // Primer cruce: ahí nace el pulso que acompaña a «empieza.»
    let crossX = 600;
    for (let x = 300; x < WIDTH; x += 2) { if (yBlue(x) >= yGreen(x)) { crossX = x; break; } }
    const crossY = (yBlue(crossX) + yGreen(crossX)) / 2;
    let low = 0, high = lenBlue;
    for (let i = 0; i < 18; i++) { const mid = (low + high) / 2; if (blue.getPointAtLength(mid).x < crossX) low = mid; else high = mid; }
    const crossFraction = low / lenBlue;
    ["b1", "b2"].forEach((cls, i) => {
      const ring = document.createElementNS(NS, "circle");
      ring.setAttribute("class", `braid-ripple ${cls}`);
      ring.setAttribute("cx", crossX); ring.setAttribute("cy", crossY.toFixed(1)); ring.setAttribute("r", 14);
      ring.setAttribute("fill", "none"); ring.setAttribute("stroke", i ? "#7be0b3" : "#cfeedd"); ring.setAttribute("stroke-width", 1.2);
      svg.insertBefore(ring, dotBlue);
    });

    const setDraw = (path, length, t) => { path.style.strokeDasharray = length; path.style.strokeDashoffset = length * (1 - t); };
    const moveDot = (dot, path, length, t) => { const p = path.getPointAtLength(length * t); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); };

    let lightsFrame = 0;
    let inView = false;
    let drawn = false;
    function lights(now) {
      if (!inView || reduced) { lightsFrame = 0; return; }
      const u = (now % 9000) / 9000;
      const fade = Math.sin(Math.PI * u);
      moveDot(dotBlue, blue, lenBlue, u); moveDot(dotGreen, green, lenGreen, u);
      dotBlue.setAttribute("opacity", (fade * .9).toFixed(2));
      dotGreen.setAttribute("opacity", (fade * .9).toFixed(2));
      lightsFrame = requestAnimationFrame(lights);
    }

    const finish = () => {
      setDraw(blue, lenBlue, 1); setDraw(green, lenGreen, 1);
      section.classList.add("is-playing", "is-crossed", "is-settled");
      dotBlue.setAttribute("opacity", 0); dotGreen.setAttribute("opacity", 0);
      drawn = true;
    };
    finishers.push(finish);

    setDraw(blue, lenBlue, 0); setDraw(green, lenGreen, 0);
    if (reduced || !("IntersectionObserver" in window)) { finish(); return; }

    const observer = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      if (inView && drawn && !lightsFrame) lightsFrame = requestAnimationFrame(lights);
      if (!inView || drawn || section.classList.contains("is-playing")) return;
      section.classList.add("is-playing");
      let crossed = false;
      dotBlue.setAttribute("opacity", 1); dotGreen.setAttribute("opacity", 1);
      animate(3800, (t) => {
        const p = easeInOut(t);
        setDraw(blue, lenBlue, p); setDraw(green, lenGreen, p);
        moveDot(dotBlue, blue, lenBlue, p); moveDot(dotGreen, green, lenGreen, p);
        if (!crossed && p >= crossFraction) { crossed = true; section.classList.add("is-crossed"); }
      }).then(() => {
        section.classList.add("is-crossed", "is-settled");
        drawn = true;
        dotBlue.setAttribute("opacity", 0); dotGreen.setAttribute("opacity", 0);
        if (inView && !lightsFrame) lightsFrame = requestAnimationFrame(lights);
      });
    }, { threshold: 0.4 });
    observer.observe(section);
  }

  /* 8. ARRANQUE ---------------------------------------------------------- */
  function init() {
    motionQuery.addEventListener("change", (event) => setReduced(event.matches));
    setReduced(reduced);

    initReveal();
    initRail();
    initStory();
    initDistance();
    initPhotos();
    initLetter();
    initEnding();
    initHero();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

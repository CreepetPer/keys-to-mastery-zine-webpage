// ===== Environment =====
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== Active nav link (stable + bottom-of-page + instant click) =====
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".navbar a[href^='#']")];
const byId = new Map(navLinks.map(a => [a.getAttribute("href").slice(1), a]));

const nav = document.querySelector(".navbar");

function setActiveById(id) {
  navLinks.forEach(a => a.classList.remove("active"));
  const link = byId.get(id);
  if (link) link.classList.add("active");
}

function setActiveSection() {
  if (!sections.length) return;

  // If we're mid-scroll from a click, don't override active yet
  if (activeLockId) return;

  const navH = nav ? nav.getBoundingClientRect().height : 0;
  const probeY = navH + 18; // aligns with your scroll-margin-top

  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;

  // If user is at (or very near) the bottom, force last section active (fixes short download section)
  if (maxScroll > 0 && scrollY >= maxScroll - 2) {
    setActiveById(sections[sections.length - 1].id);
    return;
  }

  // Otherwise, choose the last section whose top is above the probe line
  let current = sections[0];
  for (const s of sections) {
    if (s.getBoundingClientRect().top <= probeY) current = s;
    else break;
  }

  setActiveById(current.id);
}

// rAF-throttled scroll handler
let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    setActiveSection();
    ticking = false;
  });
}, { passive: true });

window.addEventListener("resize", setActiveSection);

// ===== Instant active on click (no delay) + lock until target reached =====
let activeLockId = null;

function clearActiveLock() {
  activeLockId = null;
}

function isTargetReached(id) {
  const target = document.getElementById(id);
  if (!target) return true;

  const navH = nav ? nav.getBoundingClientRect().height : 0;
  const probeY = navH + 18;
  return target.getBoundingClientRect().top <= probeY - 2;
}

navLinks.forEach((a) => {
  a.addEventListener("click", () => {
    const id = a.getAttribute("href").slice(1);

    setActiveById(id);
    activeLockId = id;

    if (prefersReduced) {
      clearActiveLock();
      requestAnimationFrame(setActiveSection);
      return;
    }

    const start = performance.now();
    const maxMs = 1800;
    let reachedFrames = 0;

    function tick() {
      if (activeLockId !== id) return; // ignore if another click happened

      if (isTargetReached(id)) reachedFrames += 1;
      else reachedFrames = 0;

      if (reachedFrames >= 2 || (performance.now() - start > maxMs)) {
        clearActiveLock();
        setActiveSection();
        return;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
});


// Initial run
setActiveSection();


// ===== Reveal on scroll (replays) =====
const revealEls = document.querySelectorAll("section, .process-acc, .preview-grid img");

revealEls.forEach(el => el.classList.add("reveal"));

const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    // add when entering viewport
    if (e.isIntersecting) {
      e.target.classList.add("is-visible");
      return;
    }

    // remove when leaving viewport so it can replay next time
    e.target.classList.remove("is-visible");
  });
}, {
  threshold: 0.12
});

revealEls.forEach(el => revealIO.observe(el));


// ===== Scroll meter =====
const meter = document.querySelector(".scroll-meter span");
window.addEventListener("scroll", () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  meter.style.width = `${pct}%`;
}, { passive: true });

// ===== Smooth accordion for <details> (always animates) =====

document.querySelectorAll(".process-acc").forEach((details) => {
  const summary = details.querySelector("summary");
  const body = details.querySelector(".details-body");

  if (!summary || !body) return;

  // Ensure correct initial height
  if (!details.open) body.style.height = "0px";

  summary.addEventListener("click", (e) => {
    if (prefersReduced) return; // keep native behavior for accessibility
    e.preventDefault();

    const isOpening = !details.open;

    // Accordion behavior: close others when opening
    if (isOpening) {
      document.querySelectorAll(".process-acc[open]").forEach((other) => {
        if (other !== details) closeDetails(other);
      });
      openDetails(details);
    } else {
      closeDetails(details);
    }
  });

  function openDetails(d) {
    const b = d.querySelector(".details-body");
    if (!b) return;

    // Start closed -> open attribute -> measure -> animate to height
    b.style.height = "0px";
    d.open = true;

    // Force layout so the browser "sees" the 0px height first
    b.getBoundingClientRect();

    const target = b.scrollHeight;
    b.style.transition = "height 420ms ease";
    b.style.height = `${target}px`;

    b.addEventListener("transitionend", function onEnd(ev) {
      if (ev.propertyName !== "height") return;
      b.removeEventListener("transitionend", onEnd);
      b.style.transition = "";
      b.style.height = "auto"; // allow responsive content
    });
  }

  function closeDetails(d) {
    const b = d.querySelector(".details-body");
    if (!b) return;

    // From auto -> fixed px -> animate to 0
    const start = b.scrollHeight;
    b.style.height = `${start}px`;
    b.getBoundingClientRect();

    b.style.transition = "height 420ms ease";
    b.style.height = "0px";

    b.addEventListener("transitionend", function onEnd(ev) {
      if (ev.propertyName !== "height") return;
      b.removeEventListener("transitionend", onEnd);
      d.open = false;
      b.style.transition = "";
      b.style.height = "0px";
    });
  }
});
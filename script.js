// ===== Active nav link (no color switching) =====
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".navbar a[href^='#']")];
const byId = new Map(navLinks.map(a => [a.getAttribute("href").slice(1), a]));

const io = new IntersectionObserver((entries) => {
  // pick the most visible section to avoid flicker
  const visible = entries
    .filter(e => e.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) return;

  navLinks.forEach(a => a.classList.remove("active"));
  const link = byId.get(visible.target.id);
  if (link) link.classList.add("active");
}, {
  root: null,
  threshold: [0.25, 0.4, 0.6]
});

sections.forEach(s => io.observe(s));


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
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
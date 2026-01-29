const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".navbar a[href^='#']")];

const byId = new Map(navLinks.map(a => [a.getAttribute("href").slice(1), a]));

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.remove("active"));
    const id = e.target.id;
    const link = byId.get(id);
    if (link) link.classList.add("active");
  });
}, {
  root: null,
  threshold: 0.35
});

sections.forEach(s => io.observe(s));

const revealEls = document.querySelectorAll("section, .process-acc, .preview-grid img");

const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("reveal", "is-visible");
    revealIO.unobserve(e.target);
  });
}, { threshold: 0.12 });

revealEls.forEach(el => {
  el.classList.add("reveal");
  revealIO.observe(el);
});

const meter = document.querySelector(".scroll-meter span");
window.addEventListener("scroll", () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  meter.style.width = `${pct}%`;
}, { passive: true });
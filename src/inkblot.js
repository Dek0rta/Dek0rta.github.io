// ─── THE BLOT ───
// Every press of the nib leaves a mark: a small blot of ink stamps in at the
// click point, soaks for a beat, and dries away. Three blob shapes, random
// spin — no two presses print alike. Skipped under reduced motion.

const BLOBS = [
  'url(\'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Cpath d="M16 3c6.6-1.8 12.6 3.4 12.4 10 -.2 6.2-3.4 12.4-10.4 13.6C11 27.8 4 24.4 3.4 17.4 2.8 10.6 9.6 4.8 16 3Z"/%3E%3Ccircle cx="28.4" cy="6.4" r="1.7"/%3E%3Ccircle cx="4.4" cy="26.6" r="1.2"/%3E%3C/svg%3E\')',
  'url(\'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Cpath d="M15 4c5-2.6 12 .8 13.4 7 1.4 6-2.6 10.6-8 12.8 -5.6 2.4-12.6 1-14.6-4.8C3.8 13.2 9.6 6.8 15 4Z"/%3E%3Ccircle cx="27" cy="27" r="1.9"/%3E%3Ccircle cx="6.2" cy="4.8" r="1.1"/%3E%3C/svg%3E\')',
  'url(\'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Cpath d="M17 3.4c6.2 0 11.6 5.4 11.2 11.6 -.4 6.6-6 11.8-12.6 11.6C9 26.4 3.6 21.4 4 14.8 4.4 8.2 10.6 3.4 17 3.4Z"/%3E%3Ccircle cx="5" cy="6" r="1.6"/%3E%3Ccircle cx="28.6" cy="24.6" r="1.3"/%3E%3C/svg%3E\')',
];

export function initInkblot() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }
  const onDown = (e) => {
    if (e.button !== 0) return;
    const b = document.createElement("div");
    b.className = "inkblot";
    b.style.left = `${e.clientX}px`;
    b.style.top = `${e.clientY}px`;
    b.style.setProperty("--blot-rot", `${Math.round(Math.random() * 360)}deg`);
    const mask = `${BLOBS[(Math.random() * BLOBS.length) | 0]} center / contain no-repeat`;
    b.style.webkitMask = mask;
    b.style.mask = mask;
    document.body.appendChild(b);
    b.addEventListener("animationend", () => b.remove());
    // safety net: if the animation never fires (hidden tab), don't leak nodes
    setTimeout(() => b.remove(), 1500);
  };
  window.addEventListener("pointerdown", onDown);
  return () => window.removeEventListener("pointerdown", onDown);
}

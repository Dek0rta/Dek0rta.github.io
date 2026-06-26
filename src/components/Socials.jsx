import { useRef } from "react";
import gsap from "gsap";
import { socials } from "../data";
import "./Socials.css";

const icons = {
  github: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 4.5 2.5 11.5l6 2 2 6 3-4 5 4z" />
      <path d="m8.5 13.5 9-7-6 9" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l16 16M20 4 4 20" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v6h-4v-6a2 2 0 0 0-4 0v6h-4v-10h4v1.5A4 4 0 0 1 16 8z" />
      <rect x="2" y="9" width="4" height="11" />
      <circle cx="4" cy="4" r="1.5" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
};

function MagneticLink({ social }) {
  const ref = useRef(null);

  const fine = () =>
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e) => {
    if (!fine()) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    gsap.to(el, { x: x * 0.4, y: y * 0.4, duration: 0.4, ease: "power3.out" });
  };
  const onLeave = () => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
  };

  return (
    <a
      ref={ref}
      className="social-btn"
      href={social.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`${social.name} — ${social.handle}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor
    >
      <span className="social-icon">{icons[social.icon]}</span>
      <span className="social-name">{social.name}</span>
      <span className="social-handle">{social.handle}</span>
    </a>
  );
}

export default function Socials() {
  return (
    <section className="social-section" id="connect">
      <div className="wrap">
        <p className="eyebrow" data-reveal>Connect</p>
        <h2 className="h2 social-title" data-reveal>Let's build something.</h2>
        <div className="social-grid" data-reveal>
          {socials.map((s) => (
            <MagneticLink key={s.name} social={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

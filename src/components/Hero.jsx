import { useEffect, useRef } from "react";
import gsap from "gsap";
import { profile } from "../data";
import ParticleName from "./ParticleName";
import "./Hero.css";

export default function Hero() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = rootRef.current?.querySelectorAll("[data-stagger]");
    if (!els || !els.length) return;
    if (reduced) {
      gsap.set(els, { opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        els,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.09,
          delay: 0.35,
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <header className="hero" ref={rootRef}>
      <div className="hero-canvas">
        <ParticleName />
      </div>

      <div className="hero-fg wrap">
        <p className="hero-eyebrow eyebrow" data-stagger>
          {profile.role} · {profile.location}
        </p>
        <h1 className="hero-tagline" data-stagger>
          {profile.tagline}
        </h1>
      </div>

      <a className="hero-scroll" href="#now" aria-label="Scroll down" data-cursor>
        <span data-stagger>scroll</span>
        <span className="hero-scroll-line" data-stagger />
      </a>
    </header>
  );
}

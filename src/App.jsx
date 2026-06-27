import { useEffect, lazy, Suspense } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Cursor from "./components/Cursor";
import Topbar from "./components/Topbar";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import Stack from "./components/Stack";
import Colophon from "./components/Colophon";

// THE RECORD pulls in three.js for the ink field — keep it out of the cover's
// critical path so the page paints instantly and WebGL loads as you scroll.
const Record = lazy(() => import("./components/Record"));

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── smooth scroll ──
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduced,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // ── orchestrated load: cover assembles ──
      const heroEls = gsap.utils.toArray("[data-hero]");
      heroEls.sort(
        (a, b) => Number(a.dataset.hero) - Number(b.dataset.hero),
      );
      if (reduced) {
        gsap.set(heroEls, { opacity: 1, y: 0, clipPath: "none" });
        gsap.set(".hero__line-inner", { yPercent: 0 });
        gsap.set([".hero__portrait", ".hero__sig"], {
          opacity: 1,
          y: 0,
          clipPath: "none",
          scale: 1,
        });
      } else {
        // load reveal rides the INNER span (mask is the outer .hero__line),
        // leaving the outer free for the scroll-morph below.
        const lineInners = gsap.utils.toArray(".hero__line-inner");
        const figure = document.querySelector(".hero__figure");
        // the portrait gets its own develop-in; keep it out of the generic fade
        const rest = heroEls.filter(
          (el) =>
            !el.classList.contains("hero__line") &&
            !el.classList.contains("hero__figure"),
        );
        const portrait = document.querySelector(".hero__portrait");
        const furniture = gsap.utils.toArray([
          ".hero__arc",
          ".hero__dots",
          ".hero__diamond",
          ".hero__rule",
        ]);

        gsap.set(lineInners, { yPercent: 115 });
        gsap.set(rest, { opacity: 0, y: 24 });
        if (figure) gsap.set(figure, { opacity: 1 });
        // portrait develops upward like a print in a tray
        if (portrait)
          gsap.set(portrait, {
            clipPath: "inset(100% 0 0 0)",
            scale: 1.06,
            transformOrigin: "center bottom",
          });
        gsap.set(furniture, { opacity: 0 });

        const tl = gsap.timeline({ delay: 0.15 });
        tl.to(lineInners, {
          yPercent: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          // drop the per-line mask once revealed so the scroll-morph x-drift
          // isn't clipped by overflow:hidden.
          onComplete: () =>
            gsap.utils
              .toArray(".hero__line")
              .forEach((l) => (l.style.overflow = "visible")),
        });
        // portrait develops in alongside the headline
        if (portrait)
          tl.to(
            portrait,
            {
              clipPath: "inset(0% 0 0 0)",
              scale: 1,
              duration: 1.2,
              ease: "expo.out",
            },
            0.25,
          );
        tl.to(
          rest,
          { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.1 },
          "-=0.6",
        );
        // geometric furniture draws on after the figure lands
        tl.to(
          furniture,
          { opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.09 },
          "-=0.5",
        );

        // ── scroll-morph: the cover headline drifts apart as it leaves ──
        // NO pin — the hero scrolls away naturally; we only layer a horizontal
        // drift + fade on top, scrubbed 1:1 (ease:none) so nothing jumps. pinning
        // here fought Lenis and injected a spacer (the snap you saw).
        const inners = gsap.utils.toArray(".hero__line-inner");
        const morph = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom 30%",
            scrub: 1,
          },
        });
        inners.forEach((inner, i) => {
          const dir = i % 2 === 0 ? -1 : 1;
          morph.to(
            inner,
            {
              xPercent: dir * (10 + i * 6),
              scaleX: 1.05,
              autoAlpha: 0,
              transformOrigin: dir < 0 ? "left center" : "right center",
            },
            0,
          );
        });
        // seal / stats / sig just fade as they ride out — no extra y (would collide)
        morph.to(
          ".hero__seal, .hero__folio, .hero__sig",
          { autoAlpha: 0, duration: 0.7 },
          0,
        );
        // portrait drifts up and out a touch slower — it's the anchor
        morph.to(
          ".hero__figure",
          { yPercent: -8, autoAlpha: 0, duration: 0.9 },
          0,
        );
      }

      // ── generic scroll reveal ──
      const reveals = gsap.utils.toArray("[data-reveal]");
      if (reduced) {
        gsap.set(reveals, { opacity: 1, y: 0 });
      } else {
        gsap.set(reveals, { opacity: 0, y: 30 });
        ScrollTrigger.batch(reveals, {
          start: "top 88%",
          onEnter: (els) =>
            gsap.to(els, {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: "expo.out",
              stagger: 0.08,
              overwrite: true,
            }),
        });
      }

      // ── stack bars fill on enter ──
      gsap.utils.toArray(".stack__row").forEach((row) => {
        ScrollTrigger.create({
          trigger: row,
          start: "top 85%",
          onEnter: () => row.classList.add("is-in"),
        });
      });
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <div className="grain" />
      <Cursor />
      <Topbar />

      <main>
        <Hero />
        <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
          <Record />
        </Suspense>
        <Projects />
        <Stack />
      </main>
      <Colophon />
    </>
  );
}

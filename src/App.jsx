import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Cursor from "./components/Cursor";
import Hero from "./components/Hero";
import NowPlaying from "./components/NowPlaying";
import Languages from "./components/Languages";
import Projects from "./components/Projects";
import Socials from "./components/Socials";
import Footer from "./components/Footer";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── smooth scroll ──
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduced,
    });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // ── generic scroll reveal ──
    const reveals = gsap.utils.toArray("[data-reveal]");
    let batch;
    if (reduced) {
      gsap.set(reveals, { opacity: 1, y: 0 });
    } else {
      gsap.set(reveals, { opacity: 0, y: 28 });
      batch = ScrollTrigger.batch(reveals, {
        start: "top 86%",
        onEnter: (els) =>
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "expo.out",
            stagger: 0.08,
            overwrite: true,
          }),
      });
    }

    // ensure correct measurement after mount
    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      if (batch) batch.forEach((st) => st.kill());
      ScrollTrigger.getAll().forEach((st) => st.kill());
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <div className="bg-glow" />
      <div className="bg-noise" />
      <Cursor />

      <main>
        <Hero />
        <NowPlaying />
        <Languages />
        <Projects />
        <Socials />
      </main>
      <Footer />
    </>
  );
}

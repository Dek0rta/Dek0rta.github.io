import { useEffect, useRef } from "react";
import gsap from "gsap";
import { path } from "../data";
import { usePick, useT } from "../i18n.jsx";
import { ProofMark } from "./Proof";
import "./Path.css";

// THE PATH — the chronicle. Self-taught has no diploma to print, so the issue
// runs the record instead: year by year, what the work was and what it became.
// Each year lands like a librarian's date stamp — a thump, a slight tilt —
// because the only official record here is the one the work left behind.

// alternating hand-tilts so five stamps never sit at the same angle
const TILTS = [-2.4, 1.6, -1.8, 2.1, -1.4];

function Milestone({ m, i }) {
  const yearRef = useRef(null);
  const pick = usePick();

  // the date stamp: thumps in once when the row arrives. gsap owns only
  // scale/opacity — the resting tilt lives in CSS (`--tilt`) so it survives.
  useEffect(() => {
    const el = yearRef.current;
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    gsap.set(el, { autoAlpha: 0, scale: 1.18 });
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        gsap.to(el, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.42,
          delay: 0.15,
          ease: "power4.out",
        });
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article className={`path__row ${m.live ? "path__row--live" : ""}`} data-reveal>
      <div
        className="path__year display"
        ref={yearRef}
        style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` }}
        aria-hidden="true"
      >
        {pick(m.year)}
      </div>
      <div className="path__body">
        <h3 className="path__title display">
          <span className="path__year-sr">{pick(m.year)} — </span>
          {pick(m.title)}
        </h3>
        <p className="path__text">{pick(m.body)}</p>
        <p className={`path__artifact ${m.live ? "is-live" : ""}`}>
          {pick(m.artifact)}
        </p>
      </div>
    </article>
  );
}

export default function Path() {
  const t = useT();
  return (
    <section className="section path" id="path">
      <div className="wrap">
        <div className="folio" data-reveal>
          <span className="folio__no">03</span>
          <span className="folio__rule" />
          <span className="folio__label">{t("path.folio")}</span>
          <ProofMark k="path" />
        </div>

        <p className="path__lead display" data-reveal>
          {t("path.lead")}
        </p>

        <div className="path__list">
          {path.map((m, i) => (
            <Milestone key={i} m={m} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

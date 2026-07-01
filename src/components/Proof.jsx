import { useEffect, useRef } from "react";
import gsap from "gsap";
import proof from "virtual:proof";
import "./Proof.css";

// PROOF — the editor's red pencil, telling the truth. Each section carries a
// proofreader's mark in the margin with its real revision history: how many
// passes, how many lines set and struck, when the last correction landed.
// The numbers come from `git log` at build time (see vite.config.js), so the
// margins can't flatter — a page that was rewritten twenty times says so.

const nf = new Intl.NumberFormat("en-US");
const ord = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// one wobbly pen loop, drawn around "rev. N" — overshoots its start like a
// hand that circles twice to make the point
const LOOP =
  "M12 26 C10 12, 42 5, 68 6 C98 7, 114 14, 112 24 C110 36, 72 40, 42 38 C20 36, 8 32, 10 22 C12 13, 34 8, 56 7";

function Loop() {
  return (
    <svg
      className="proof__loop"
      viewBox="0 0 122 44"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={LOOP} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function usePenIn(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const path = root.querySelector(".proof__loop path");
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const len = path ? path.getTotalLength() : 0;
    gsap.set(root, { autoAlpha: 0, y: 8, rotation: 0 });
    if (path) gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // tilt lives in CSS (`rotate:`) — gsap only owns opacity + translate
        const tl = gsap.timeline({ delay: 0.35 });
        tl.to(root, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        });
        if (path)
          tl.to(
            path,
            { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" },
            "-=0.25",
          );
      },
      { threshold: 0.6 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [rootRef]);
}

// margin variant — hangs under the folio rule, tilted like a scribble
export function ProofMark({ k }) {
  const ref = useRef(null);
  usePenIn(ref);
  const d = proof.sections?.[k];
  if (!d || !d.revs) return null;

  const struck = d.del > 0 ? `${nf.format(d.del)} struck` : "none struck";
  return (
    <span className="proof" ref={ref}>
      <span className="proof__note">
        <span className="proof__rev">
          rev.&#8202;{d.revs}
          <Loop />
        </span>{" "}
        — {nf.format(d.add)} lines set, {struck}. last pass {d.last}{" "}
        <span className="proof__ed">—ed.</span>
      </span>
      <span className="proof__src">from git log · at build</span>
    </span>
  );
}

// colophon variant — the whole issue's press record, set inline
export function ProofTotal() {
  const ref = useRef(null);
  usePenIn(ref);
  const t = proof.total;
  if (!t || !t.printings) return null;

  return (
    <span className="proof proof--inline" ref={ref}>
      <span className="proof__note">
        <span className="proof__rev">
          {ord(t.printings)}&#8202;printing
          <Loop />
        </span>{" "}
        since {t.first} — {nf.format(t.add)} lines set, {nf.format(t.del)}{" "}
        struck. <span className="proof__ed">—ed.</span>
      </span>
      <span className="proof__src">from git log · at build</span>
    </span>
  );
}

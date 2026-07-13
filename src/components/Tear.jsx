import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useT } from "../i18n.jsx";
import "./Tear.css";

// THE TEAR — the page admits what it's made of. The bottom-right corner of
// the sheet is nicked; pull it and the paper rips back along a fibred edge to
// reveal the actual source of the section it was printing — imported at build
// time via ?raw, so it can never lie. A magazine set in code, showing its own
// galley. Click (or Enter) toggles for keyboard / reduced-motion readers.

const REST = 26; // the corner is always slightly torn — the invitation
const SEGS = 12; // points along the torn front

// minimal, honest highlighting: comments / strings / keywords only
function highlight(src) {
  // the tail of the file is what the corner reveals — the export, not imports
  const tail = src.split("\n").slice(-64).join("\n");
  const esc = tail
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return esc.replace(
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(import|export|from|const|let|return|function|default)\b/g,
    (m, comment, string, kw) => {
      if (comment) return `<i class="t-com">${comment}</i>`;
      if (string) return `<i class="t-str">${string}</i>`;
      if (kw) return `<i class="t-kw">${kw}</i>`;
      return m;
    },
  );
}

export default function Tear({ source, filename, children }) {
  const t = useT();
  const rootRef = useRef(null);
  const paperRef = useRef(null);
  const flapRef = useRef(null);
  const tabRef = useRef(null);
  const edgeRef = useRef(null);
  const [open, setOpen] = useState(false);

  const html = useMemo(() => highlight(source), [source]);

  // one ragged profile per mount — the tear always rips along the same fibres
  const jitter = useMemo(
    () => Array.from({ length: SEGS - 1 }, () => Math.random() * 2 - 0.6),
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    const paper = paperRef.current;
    const flap = flapRef.current;
    const tab = tabRef.current;
    const edge = edgeRef.current;
    if (!root || !paper || !flap || !tab || !edge) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let W = 0;
    let H = 0;
    const dmax = () => Math.min(W, H) * 0.85;
    const proxy = { d: reduced ? 0 : REST };
    let isOpen = false;
    let detached = false; // the corner piece has torn off and fallen away

    const render = () => {
      const d = Math.max(0, Math.min(proxy.d, dmax()));
      // torn front runs from A(W, H-d) on the right edge to B(W-d, H) on the
      // bottom edge; jitter pushes each point into the page along the normal.
      const amp = 2 + d * 0.045;
      const nx = -0.7071;
      const ny = -0.7071;
      const pts = [];
      for (let i = 1; i < SEGS; i++) {
        const t = i / SEGS;
        const x = W + (W - d - W) * t + nx * amp * jitter[i - 1];
        const y = H - d + d * t + ny * amp * jitter[i - 1];
        pts.push([x, y]);
      }
      const frontPts = pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`);
      paper.style.clipPath = `polygon(0 0, ${W}px 0, ${W}px ${(H - d).toFixed(1)}px, ${frontPts.join(", ")}, ${(W - d).toFixed(1)}px ${H}px, 0 ${H}px)`;

      flap.style.width = `${d}px`;
      flap.style.height = `${d}px`;
      if (!detached) flap.style.opacity = d > 2 ? 1 : 0;

      // the tab rides the fold's tip so the grab point stays under the finger
      tab.style.transform = `translate(${-d}px, ${-d}px)`;

      edge.setAttribute(
        "points",
        [[W, H - d], ...pts, [W - d, H]]
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" "),
      );
      edge.style.opacity = d > 6 ? 1 : 0;
    };

    const measure = () => {
      const r = root.getBoundingClientRect();
      W = r.width;
      H = r.height;
      render();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    const settle = (target, instant) => {
      gsap.killTweensOf(proxy);
      if (instant) {
        proxy.d = target;
        render();
        return;
      }
      gsap.to(proxy, {
        d: target,
        duration: target > REST ? 0.9 : 0.7,
        ease: target > REST ? "expo.out" : "power3.out",
        onUpdate: render,
      });
    };
    const openTo = () => {
      isOpen = true;
      setOpen(true);
      settle(dmax() * 0.8, reduced);
      // the torn piece rips free and falls away — a fold that big in the hand
      // would be absurd; what stays is the ragged window onto the source.
      detached = true;
      gsap.killTweensOf(flap);
      if (reduced) {
        gsap.set(flap, { autoAlpha: 0 });
      } else {
        gsap.to(flap, {
          autoAlpha: 0,
          y: 90,
          rotation: -11,
          duration: 0.7,
          ease: "power2.in",
          delay: 0.18,
        });
      }
    };
    const closeTo = () => {
      isOpen = false;
      setOpen(false);
      detached = false;
      gsap.killTweensOf(flap);
      gsap.set(flap, { autoAlpha: 1, y: 0, rotation: 0 });
      settle(reduced ? 0 : REST, reduced);
    };

    // drag the corner — pointer capture so the rip follows past the tab
    let drag = null; // {x, y, d0, moved}
    let suppressClick = false; // a real drag ends in pointerup + a stray click
    const onDown = (e) => {
      if (reduced) return; // reduced-motion: click toggles, no drag theatre
      e.preventDefault(); // don't start a text selection while ripping
      drag = { x: e.clientX, y: e.clientY, d0: proxy.d, moved: false };
      gsap.killTweensOf(proxy);
      tab.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
      proxy.d = Math.max(0, Math.min(drag.d0 - (dx + dy) * 0.72, dmax()));
      render();
    };
    const onUp = () => {
      if (!drag) return;
      suppressClick = drag.moved;
      drag = null;
      if (!suppressClick) return; // plain click → onClick handles the toggle
      if (proxy.d > dmax() * 0.4) openTo();
      else closeTo();
    };
    const onClick = () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      if (isOpen) closeTo();
      else openTo();
    };

    tab.addEventListener("pointerdown", onDown);
    tab.addEventListener("pointermove", onMove);
    tab.addEventListener("pointerup", onUp);
    tab.addEventListener("pointercancel", onUp);
    tab.addEventListener("click", onClick);

    // teach the gesture once: the corner lifts and settles as the section
    // enters — a page caught by a draft.
    let peeked = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || peeked || reduced) return;
        peeked = true;
        io.disconnect();
        gsap
          .timeline()
          .to(proxy, { d: 84, duration: 0.6, ease: "expo.out", onUpdate: render, delay: 0.3 })
          .to(proxy, { d: REST, duration: 0.8, ease: "power3.inOut", onUpdate: render, delay: 0.4 });
      },
      { threshold: 0.5 },
    );
    io.observe(root);

    return () => {
      ro.disconnect();
      io.disconnect();
      gsap.killTweensOf(proxy);
      tab.removeEventListener("pointerdown", onDown);
      tab.removeEventListener("pointermove", onMove);
      tab.removeEventListener("pointerup", onUp);
      tab.removeEventListener("pointercancel", onUp);
      tab.removeEventListener("click", onClick);
    };
  }, [jitter]);

  return (
    <div className="tear" ref={rootRef}>
      {/* the machine under the paper — this section's real source */}
      <div className="tear__under" aria-hidden="true">
        <pre className="tear__code" dangerouslySetInnerHTML={{ __html: html }} />
        <p className="tear__caption">
          <span className="tear__caption-mark">◆</span>
          {t("tear.caption", filename)}
        </p>
      </div>

      {/* torn fibre edge, drawn along the rip front */}
      <svg className="tear__edge" aria-hidden="true">
        <polyline ref={edgeRef} points="" />
      </svg>

      {/* the sheet itself — clipped by the rip */}
      <div className="tear__paper" ref={paperRef}>
        {children}
      </div>

      {/* the folded-back corner */}
      <div className="tear__flap" ref={flapRef} aria-hidden="true" />

      {/* grab corner — also a button, for keyboard + reduced motion */}
      <button
        type="button"
        className={`tear__tab${open ? " is-open" : ""}`}
        ref={tabRef}
        data-cursor
        aria-pressed={open}
        aria-label={open ? t("tear.aria.open") : t("tear.aria.closed")}
      >
        <span className="tear__tab-label">
          {open ? t("tear.tab.open") : t("tear.tab.closed")}
        </span>
      </button>
    </div>
  );
}

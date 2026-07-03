import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import "./Thread.css";

// THE THREAD — one continuous line of ink running the full height of the issue.
// It's not decoration: it's the spine. A single stroke ties the cover to the
// record to the work to the sign-off — "one path, self-taught, no breaks". The
// line lives inside the document (not the viewport), so a long read draws a
// genuinely long line. It draws itself on scroll, the nib rides its leading
// edge, and each node sits at its real chapter and strikes as you arrive.

const CHAPTERS = [
  { id: "cover", no: "00", label: "Cover" },
  { id: "record", no: "01", label: "The Record" },
  { id: "shipped", no: "02", label: "Shipped" },
  { id: "stack", no: "03", label: "The Stack" },
  { id: "connect", no: "04", label: "End" },
];

export default function Thread() {
  const pathRef = useRef(null);
  const nibRef = useRef(null);
  const [docH, setDocH] = useState(0);
  const [path, setPath] = useState("");
  const [nodes, setNodes] = useState([]); // {x, y, no, label}
  const [laneX, setLaneX] = useState(56);
  const [ready, setReady] = useState(false); // only show nodes once layout settles

  // build the thread down the WHOLE document: a calm sine wave that reaches out
  // to each chapter's folio number and TIES A KNOT there (a self-crossing pen
  // loop wrapped around the node), with smaller flourish curls in the long
  // stretches between chapters. recomputed on resize / layout shift.
  const build = useCallback(() => {
    const H = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    );
    setDocH(H);

    // sit the lane just outside the content column so the thread hugs the text
    // like a book's gutter rule — measured from the real .wrap, not guessed.
    const wrap = document.querySelector(".wrap");
    const wrapLeft = wrap ? wrap.getBoundingClientRect().left : 64;
    const X = Math.max(20, wrapLeft - 26);
    setLaneX(X);
    const amp = 7; // gentle, even breath — a led pen, not a squiggle
    const period = 360; // CONSTANT spacing → steady rhythm down the page

    // chapter anchors — the folio marker each knot fastens onto
    const FOLIO = {
      cover: ".hero__folio",
      record: ".record__folio",
      shipped: ".folio",
      stack: ".folio",
      connect: ".folio",
    };
    const anchors = CHAPTERS.map((c) => {
      const sec = document.getElementById(c.id);
      if (!sec) return null;
      const marker = sec.querySelector(FOLIO[c.id]) || sec;
      const r = marker.getBoundingClientRect();
      const y = Math.min(r.top + window.scrollY + r.height / 2, H - 60);
      // the knot's stroke reaches to just shy of the folio number
      const ax = Math.min(Math.max(X + 24, r.left - 20), X + 120);
      return { ...c, y, ax };
    })
      .filter(Boolean)
      .sort((p, q) => p.y - q.y);

    // wave + excursion: between chapters the pen breathes on the lane; near a
    // chapter it eases out of the wave and reaches toward the folio.
    const WIN = 130; // excursion half-window
    const baseX = (y) => {
      const wave = amp * Math.sin((y / period) * Math.PI * 2);
      for (const a of anchors) {
        const t = Math.abs(y - a.y) / WIN;
        if (t < 1) {
          const bump = 0.5 + 0.5 * Math.cos(t * Math.PI); // 1 at the anchor
          return X + wave * (1 - bump) + (a.ax - X) * bump;
        }
      }
      return X + wave;
    };

    // loops are prolate-cycloid arcs: the pen keeps travelling down while it
    // circles, so the stroke crosses itself like a handwritten loop — and both
    // ends leave heading straight down (no kink where it rejoins the wave).
    // b = loop radius, vertical travel consumed = 2π·b/3.
    const loopPts = (lx, ly, b, dir) => {
      const a = b / 3;
      const out = [];
      const N = 30;
      for (let k = 1; k <= N; k++) {
        const th = (k / N) * Math.PI * 2;
        out.push([
          lx + dir * b * (1 - Math.cos(th)),
          ly + a * th + b * Math.sin(th),
        ]);
      }
      return out;
    };

    // knot events at every chapter + flourish curls between them
    const KNOT_R = 8;
    const knotDrop = (Math.PI * KNOT_R) / 3; // half the loop's vertical travel
    const events = anchors.map((a) => ({
      y: a.y - knotDrop, // loop starts here so its eye centres on the folio
      b: KNOT_R,
      dir: 1, // wraps toward the number it fastens to
      knot: a,
    }));
    let side = -1;
    for (let i = 0; i < anchors.length - 1; i++) {
      const gap = anchors[i + 1].y - anchors[i].y;
      if (gap < 620) continue;
      // long stretches earn two curls, shorter ones a single flick
      const spots = gap > 1800 ? [0.35, 0.68] : [0.5];
      for (const f of spots) {
        events.push({
          y: anchors[i].y + gap * f,
          b: 6,
          dir: side,
        });
        side = -side;
      }
    }
    events.sort((p, q) => p.y - q.y);

    // sample the whole stroke top to bottom, splicing loops in as they arrive
    const pts = [[X, 0]];
    const step = 4;
    let y = step;
    let ei = 0;
    let blend = null; // eases the exit of a loop back onto the wave
    const xAt = (yy) => {
      let x = baseX(yy);
      if (blend && yy < blend.until) {
        const t = (yy - blend.from) / (blend.until - blend.from);
        const s = t * t * (3 - 2 * t);
        x = blend.x + (x - blend.x) * s;
      }
      return x;
    };
    while (y <= H) {
      if (ei < events.length && events[ei].y <= y) {
        const ev = events[ei++];
        const ly = Math.max(y - step, Math.min(ev.y, H - 60));
        const lx = xAt(ly);
        pts.push([lx, ly]);
        const loop = loopPts(lx, ly, ev.b, ev.dir);
        pts.push(...loop);
        const endY = loop[loop.length - 1][1];
        blend = { x: lx, from: endY, until: endY + 56 };
        y = endY + step;
        continue;
      }
      pts.push([xAt(y), y]);
      y += step;
    }
    pts.push([xAt(H), H]);

    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
    }
    setPath(d);

    // each node sits in the EYE of its knot — the thread is literally tied
    // around the ring, fastening the line to the chapter block.
    const list = anchors.map((a) => ({
      ...a,
      x: a.ax + KNOT_R, // loop centre = start x + dir·b
      y: a.y,
    }));
    setNodes(list);
  }, []);

  useEffect(() => {
    build();
    // recompute after fonts/images settle, after the issue sheet lifts, and on
    // resize. NOT via ResizeObserver(body) — the absolute SVG can feed back into
    // scrollHeight and loop. discrete rebuilds only.
    window.addEventListener("resize", build);
    const t1 = setTimeout(build, 600);
    // after the Issue sheet lifts + hero settles the document is at its real
    // height. rebuild THEN reveal the nodes — so they fade in already at their
    // final folio heights instead of being placed against a short doc and
    // snapping upward when the real height arrives.
    const t2 = setTimeout(() => {
      build();
      setReady(true);
    }, 2600);
    // reduced-motion: nothing animates the doc height, show immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
    }
    return () => {
      window.removeEventListener("resize", build);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [build]);

  // draw the line + ride the nib on document scroll progress
  useEffect(() => {
    if (!pathRef.current || !path) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const p = pathRef.current;
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len });

    if (reduced) {
      gsap.set(p, { strokeDashoffset: 0 });
      if (nibRef.current) gsap.set(nibRef.current, { opacity: 0 });
      return;
    }

    let cur = 0; // smoothed progress for a hand-drawn lag
    const apply = (prog) => {
      gsap.set(p, { strokeDashoffset: len * (1 - prog) });
      if (nibRef.current && len > 0) {
        const pt = p.getPointAtLength(len * Math.max(0, Math.min(1, prog)));
        nibRef.current.setAttribute("cx", pt.x);
        nibRef.current.setAttribute("cy", pt.y);
        nibRef.current.style.opacity =
          prog > 0.003 && prog < 0.997 ? "1" : "0";
      }
    };

    // drive straight off scroll position — no ScrollTrigger. its start/end were
    // measured before the issue sheet lifted (doc was short), pinning progress
    // at 0. reading scrollY each frame can't go stale. eased toward target so
    // the nib trails the cursor like wet ink catching up.
    const readProgress = () => {
      const docHt = document.documentElement.scrollHeight;
      const max = Math.max(1, docHt - window.innerHeight);
      const raw = Math.min(1, Math.max(0, window.scrollY / max));
      // floor: a little stroke is always drawn so the cover never shows a blank
      // gutter. plain max() — no curve — so the nib tracks scroll 1:1 elsewhere.
      const floor = Math.min(0.08, (window.innerHeight * 0.4) / docHt);
      return Math.max(raw, floor);
    };
    const onTick = () => {
      const target = readProgress();
      cur += (target - cur) * 0.18;
      if (Math.abs(target - cur) < 0.0002) cur = target;
      apply(cur);
    };
    gsap.ticker.add(onTick);
    apply(0);

    return () => gsap.ticker.remove(onTick);
  }, [path, docH]);

  // strike each node while its chapter owns the screen — read straight from
  // layout each frame (same reason as the draw: ScrollTrigger measured stale).
  useEffect(() => {
    if (!nodes.length) return;
    const els = CHAPTERS.map((c) => ({
      id: c.id,
      el: document.getElementById(c.id),
    })).filter((x) => x.el);

    const onTick = () => {
      const mid = window.innerHeight / 2;
      for (const { id, el } of els) {
        const r = el.getBoundingClientRect();
        // active when the section straddles the vertical middle of the screen
        const active = r.top < mid && r.bottom > mid;
        const node = document.querySelector(`[data-thread-node="${id}"]`);
        if (node) node.classList.toggle("is-lit", active);
      }
    };
    gsap.ticker.add(onTick);
    return () => gsap.ticker.remove(onTick);
  }, [nodes]);

  return (
    <svg
      className="thread"
      width="200"
      height={docH || 1000}
      fill="none"
      aria-hidden="true"
    >
      {/* the pen touches down — a struck drop at the top, always visible so the
          stroke has an origin even before you start reading */}
      <circle className="thread__start" cx={laneX} cy="3" r="3.2" />
      <path
        ref={pathRef}
        className="thread__line"
        d={path}
        stroke="var(--seal)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* chapter nodes — each sits in the eye of the knot the thread ties at
          its folio, so line and node are visibly fastened to the chapter.
          held back (ready) until the doc reaches full height so they don't
          place against a short layout and jump upward when it settles. */}
      {ready && nodes.map((n) => (
        <g
          key={n.id}
          className="thread__node"
          data-thread-node={n.id}
          transform={`translate(${n.x} ${n.y})`}
        >
          <circle className="thread__node-ring" r="5.5" />
          <circle className="thread__node-dot" r="2.4" />
        </g>
      ))}

      <circle ref={nibRef} className="thread__nib" r="3.4" cx="0" cy="0" />
    </svg>
  );
}

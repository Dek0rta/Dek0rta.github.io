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

  // build the serpentine path down the WHOLE document and pin each node to the
  // vertical center of its real section. recomputed on resize / layout shift.
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
    const segs = Math.max(2, Math.round(H / period));
    // even sinusoid: each segment is the same height, alternating side, so the
    // wave reads as one calm hand-drawn stroke instead of tight loops up top.
    let d = `M ${X} 0`;
    for (let i = 1; i <= segs; i++) {
      const y = (H / segs) * i;
      const yMid = y - H / segs / 2;
      const xMid = X + (i % 2 === 0 ? amp : -amp);
      d += ` Q ${xMid.toFixed(1)} ${yMid.toFixed(1)} ${X} ${y.toFixed(1)}`;
    }
    setPath(d);

    // measure the path so nodes can sit EXACTLY on the stroke (not beside it):
    // sample it once, then for each node's y find the path's x at that height.
    const probe = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    probe.setAttribute("d", d);
    const total = probe.getTotalLength();
    const SAMPLES = Math.max(60, Math.round(H / 24));
    const pts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      pts.push(probe.getPointAtLength((total * i) / SAMPLES));
    }
    const xOnLineAt = (y) => {
      // nearest sample by y → the stroke's x there
      let best = pts[0];
      let bd = Infinity;
      for (const pt of pts) {
        const dd = Math.abs(pt.y - y);
        if (dd < bd) {
          bd = dd;
          best = pt;
        }
      }
      return best.x;
    };

    // node y = the chapter's FOLIO marker, so the thread pins to the number the
    // reader sees ("00 Cover", "01 The Record"…) instead of floating mid-section.
    const FOLIO = {
      cover: ".hero__folio",
      record: ".record__folio",
      shipped: ".folio",
      stack: ".folio",
      connect: ".folio",
    };
    const list = CHAPTERS.map((c) => {
      const sec = document.getElementById(c.id);
      if (!sec) return null;
      const marker = sec.querySelector(FOLIO[c.id]) || sec;
      const r = marker.getBoundingClientRect();
      const y = Math.min(r.top + window.scrollY + r.height / 2, H);
      const nodeX = xOnLineAt(y);
      // a short tie reaches from the stroke to the folio number, so the thread
      // visibly hooks onto each chapter heading instead of running past it.
      const reach = Math.max(0, r.left - nodeX - 6);
      return { ...c, x: nodeX, y, reach };
    }).filter(Boolean);
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

      {/* chapter nodes — quiet struck dots hugging the gutter. the chapter
          number already lives in the folio beside it, so no duplicate label.
          held back (ready) until the doc reaches full height so they don't
          place against a short layout and jump upward when it settles. */}
      {ready && nodes.map((n) => (
        <g
          key={n.id}
          className="thread__node"
          data-thread-node={n.id}
          transform={`translate(${n.x} ${n.y})`}
        >
          {/* tie hooking the stroke onto the folio number */}
          <line className="thread__tie" x1="0" y1="0" x2={n.reach} y2="0" />
          <circle className="thread__node-ring" r="7" />
          <circle className="thread__node-dot" r="2.6" />
        </g>
      ))}

      <circle ref={nibRef} className="thread__nib" r="3.4" cx="0" cy="0" />
    </svg>
  );
}

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { profile } from "../data";
import { createInk } from "../ink/fluid";
import "./Issue.css";

// The cover behind the cover — now printed in living ink. Drops hit the sheet,
// a real fluid simulation swirls them, then the ink pools into the masthead
// glyphs and the type resolves on top like a fresh impression. The pointer
// stirs the ink the whole time. Then the sheet lifts to reveal the cover.
// Falls back to the classic typographic intro without WebGL2 / reduced motion.
export default function Issue({ onDone }) {
  const root = useRef(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // the overture is a first-impression, not a toll gate: play it once per
    // session. repeat loads (and back-navigation) skip straight to the cover.
    const seen = sessionStorage.getItem("issue-seen") === "1";

    // hold the page still while the sheet is up — no scrolling behind it
    const scrollY = window.scrollY;
    document.documentElement.classList.add("issue-locked");

    // StrictMode re-runs this effect; anything async (fonts.ready, timeline
    // callbacks) from a dead run must not touch state
    let dead = false;

    const finish = () => {
      if (dead) return;
      sessionStorage.setItem("issue-seen", "1");
      document.documentElement.classList.remove("issue-locked");
      window.scrollTo(0, scrollY);
      setGone(true);
      onDone?.();
    };

    if (reduced || seen) {
      // no theatre — hand off to the cover immediately
      const t = setTimeout(finish, reduced ? 200 : 0);
      return () => clearTimeout(t);
    }

    // ── living ink (WebGL2) ──
    // the canvas is created per effect run: StrictMode re-runs effects, and a
    // canvas whose context was lost on cleanup can't host a second context
    const canvas = document.createElement("canvas");
    canvas.className = "issue__canvas";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    root.current.prepend(canvas);
    // this effect runs before Topbar's — apply the saved theme now so the
    // ink reads the right palette (and the sheet doesn't flash day colors)
    const theme = localStorage.getItem("issue-theme") || "day";
    document.documentElement.setAttribute("data-theme", theme);
    // on a cold first load this effect can run before the stylesheet lands —
    // getComputedStyle then returns "" and the ink would paint pitch black.
    // Fall back to the printed tokens for the active theme.
    const css = getComputedStyle(document.documentElement);
    const night = theme === "night";
    const tok = (name, day, dark) =>
      css.getPropertyValue(name).trim() || (night ? dark : day);
    const ink = createInk(canvas, {
      paper: tok("--paper", "#fbf8f1", "#100f0d"),
      ink: tok("--ink", "#12110f", "#fbf8f1"),
      seal: tok("--seal", "#c4441e", "#e8633a"),
    });
    if (!ink) canvas.remove();

    let onMove = null;
    let onDown = null;
    let fontTimer = null;

    // ── skip: the overture is beautiful but must never trap the visitor.
    // any intent to interact — a click, a key, a scroll, a touch — cuts to the
    // cover. `activeTl` points at whichever timeline is running so we can kill
    // it before handing off.
    let activeTl = null;
    let onSkip = null;
    const skip = () => {
      if (dead) return;
      activeTl?.kill();
      finish();
    };
    onSkip = (e) => {
      // ignore modifier-only keys so a11y shortcuts don't count as a skip
      if (e.type === "keydown" && (e.metaKey || e.ctrlKey || e.altKey)) return;
      skip();
    };
    window.addEventListener("pointerdown", onSkip);
    window.addEventListener("keydown", onSkip);
    window.addEventListener("wheel", onSkip, { passive: true });
    window.addEventListener("touchstart", onSkip, { passive: true });

    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray("[data-issue-line]");
      const rule = ".issue__rule-line";

      if (!ink) {
        // ── classic fallback: masthead draws on, holds, sheet wipes up ──
        gsap.set(lines, { yPercent: 110 });
        gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });

        const tl = gsap.timeline({ onComplete: finish });
        activeTl = tl;
        tl.to(lines, {
          yPercent: 0,
          duration: 0.95,
          ease: "expo.out",
          stagger: 0.09,
          delay: 0.1,
        })
          .to(rule, { scaleX: 1, duration: 0.8, ease: "expo.out" }, "-=0.7")
          .to({}, { duration: 0.55 })
          .to(
            lines,
            { yPercent: -120, duration: 0.8, ease: "power3.in", stagger: 0.05 },
            "wipe",
          )
          .to(rule, { autoAlpha: 0, duration: 0.3 }, "wipe")
          .to(
            root.current,
            { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" },
            "wipe+=0.2",
          );
        return;
      }

      // type starts invisible; the ink writes it first, print resolves after
      gsap.set(".issue__name", { autoAlpha: 0, filter: "blur(14px)" });
      gsap.set([".issue__kicker", ".issue__meta"], { autoAlpha: 0, y: 12 });
      gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });

      ink.start();

      // the pointer stirs the ink for the whole overture
      let px = null;
      let py = null;
      onMove = (e) => {
        const x = e.clientX / window.innerWidth;
        const y = 1 - e.clientY / window.innerHeight;
        if (px !== null) {
          const dx = x - px;
          const dy = y - py;
          if (Math.abs(dx) + Math.abs(dy) > 0.0005) ink.pointer(x, y, dx, dy);
        }
        px = x;
        py = y;
      };
      onDown = (e) => {
        ink.drop(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight, "ink");
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerdown", onDown);

      // rasterize the real DOM glyphs → emitter points, so the ink pools
      // exactly where the type will resolve
      const buildGlyphs = () => {
        const spans = root.current.querySelectorAll(".issue__mask > span");
        const scale = 0.5;
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(window.innerWidth * scale));
        c.height = Math.max(1, Math.round(window.innerHeight * scale));
        const g = c.getContext("2d", { willReadFrequently: true });
        g.fillStyle = "#000";
        g.textAlign = "center";
        g.textBaseline = "middle";
        spans.forEach((span) => {
          const r = span.getBoundingClientRect();
          const cs = getComputedStyle(span);
          g.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * scale}px ${cs.fontFamily}`;
          if ("letterSpacing" in g) {
            const ls = parseFloat(cs.letterSpacing);
            g.letterSpacing = `${(Number.isNaN(ls) ? 0 : ls) * scale}px`;
          }
          g.fillText(span.textContent, (r.left + r.width / 2) * scale, (r.top + r.height / 2) * scale);
        });
        const data = g.getImageData(0, 0, c.width, c.height).data;
        const pts = [];
        const step = 2;
        for (let y = 0; y < c.height; y += step) {
          for (let x = 0; x < c.width; x += step) {
            if (data[(y * c.width + x) * 4 + 3] > 100) {
              pts.push(
                (x + Math.random() * step) / c.width,
                1 - (y + Math.random() * step) / c.height,
              );
            }
          }
        }
        // shuffle point pairs so emission scatters across all letters at once
        for (let i = pts.length / 2 - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const [a, b] = [pts[i * 2], pts[i * 2 + 1]];
          pts[i * 2] = pts[j * 2];
          pts[i * 2 + 1] = pts[j * 2 + 1];
          pts[j * 2] = a;
          pts[j * 2 + 1] = b;
        }
        ink.setGlyphs(new Float32Array(pts));
      };

      // ── the overture ──
      const emit = { n: 0 };
      const tl = gsap.timeline({ paused: true, onComplete: finish });
      activeTl = tl;

      // drops hit the sheet — three ink, one seal-red. on small screens the
      // name fills the middle, so the drops land clear of the text band
      const wide = window.innerWidth >= 768;
      const drops = wide
        ? [[0.5, 0.6, "ink"], [0.36, 0.44, "ink"], [0.65, 0.52, "seal"], [0.52, 0.36, "ink"]]
        : [[0.5, 0.82, "ink"], [0.3, 0.16, "ink"], [0.72, 0.2, "seal"], [0.62, 0.86, "ink"]];
      tl.call(() => ink.drop(...drops[0]), [], 0.05)
        .call(() => ink.drop(...drops[1]), [], 0.24)
        .call(() => ink.drop(...drops[2]), [], 0.42)
        .call(() => ink.drop(...drops[3]), [], 0.6)
        // ink gathers into the name
        .to(emit, {
          n: 170,
          duration: 0.6,
          ease: "power2.in",
          onUpdate: () => ink.setEmit(emit.n),
        }, 0.85)
        // the impression resolves: blur lifts, type sharpens over its own ink
        .to(".issue__name", {
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power2.inOut",
        }, 1.7)
        .to(".issue__kicker", { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out" }, 2.05)
        .to(rule, { scaleX: 1, duration: 0.8, ease: "expo.out" }, 2.15)
        .to(".issue__meta", { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out" }, 2.25)
        // keep a trickle of ink refreshing the glyphs through the hold
        .to(emit, {
          n: 30,
          duration: 0.6,
          onUpdate: () => ink.setEmit(emit.n),
        }, 2.6)
        // the impression melts back into ink — reverse of the resolve
        .to(emit, {
          n: 110,
          duration: 0.45,
          ease: "power2.in",
          onUpdate: () => ink.setEmit(emit.n),
        }, 3.0)
        .to(".issue__name", {
          autoAlpha: 0,
          filter: "blur(12px)",
          duration: 0.85,
          ease: "power2.in",
        }, 3.05)
        .to([".issue__kicker", ".issue__meta"], {
          autoAlpha: 0,
          y: -10,
          duration: 0.5,
          ease: "power2.in",
        }, 3.1)
        .to(rule, { autoAlpha: 0, duration: 0.4 }, 3.1)
        // emitters off so the dissolve isn't refilled from below
        .to(emit, {
          n: 0,
          duration: 0.4,
          onUpdate: () => ink.setEmit(emit.n),
        }, 3.45)
        // the sheet dissolves like wet paper — fluid drives the alpha, the
        // cover develops through the holes. div bg goes transparent first
        // (invisible switch: the canvas paints the same paper on top)
        .call(() => {
          if (!root.current) return;
          root.current.style.background = "transparent";
          root.current.style.pointerEvents = "none";
          ink.breath();
        }, [], 3.4)
        .to({ t: 0 }, {
          t: 1,
          duration: 1.6,
          ease: "power2.inOut",
          onUpdate() {
            ink.setDissolve(this.targets()[0].t);
          },
        }, 3.45);

      // wait for the display face so the glyph raster matches the real type
      let started = false;
      const begin = () => {
        if (started || dead) return;
        started = true;
        buildGlyphs();
        tl.play();
      };
      document.fonts?.ready?.then(begin);
      fontTimer = setTimeout(begin, 1200);
    }, root);

    return () => {
      dead = true;
      if (onMove) window.removeEventListener("pointermove", onMove);
      if (onDown) window.removeEventListener("pointerdown", onDown);
      if (onSkip) {
        window.removeEventListener("pointerdown", onSkip);
        window.removeEventListener("keydown", onSkip);
        window.removeEventListener("wheel", onSkip);
        window.removeEventListener("touchstart", onSkip);
      }
      clearTimeout(fontTimer);
      ctx.revert();
      ink?.destroy();
      canvas.remove();
    };
  }, [onDone]);

  if (gone) return null;

  return (
    <div className="issue" ref={root} aria-hidden="true">
      <div className="issue__inner">
        <p className="issue__kicker">
          <span data-issue-line>The Issue</span>
        </p>

        <h1 className="issue__name display">
          <span className="issue__mask">
            <span data-issue-line>{profile.first}</span>
          </span>
          <span className="issue__mask">
            <span data-issue-line>{profile.last}</span>
          </span>
        </h1>

        <div className="issue__rule">
          <span className="issue__rule-line" />
        </div>

        <p className="issue__meta">
          <span data-issue-line>
            {profile.volume} &nbsp;·&nbsp; {profile.year}
          </span>
        </p>
      </div>
      <p className="issue__skip">tap / scroll to skip</p>
    </div>
  );
}

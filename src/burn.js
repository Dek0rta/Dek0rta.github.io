// THE BURN — the theme toggle is a match. Striking it sets the page on fire:
// an irregular front creeps out from the switch, the paper's edge glows and
// chars, sparks lift off, ash falls, and what's left underneath is the other
// edition. Built on the View Transitions API: the old theme is the browser's
// own snapshot of the page, held above the live one, and we burn a hole in it
// with a noise-driven clip-path. A canvas between the two layers draws the
// ember line, char band and particles inside the hole. No snapshot API, no
// html2canvas — the browser does the photography.

const SEGS = 140; // points along the fire front
// NOTE: the snapshot is held for 1750ms by vt-burn-hold in index.css — DUR
// below must stay under it.

let burning = false;

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function burnTheme(x, y, flip) {
  if (burning) return;
  if (reduced() || !document.startViewTransition) {
    flip();
    return;
  }
  burning = true;

  const W = window.innerWidth;
  const H = window.innerHeight;
  // the fire must reach the farthest corner of the sheet
  const maxR =
    Math.max(
      Math.hypot(x, y),
      Math.hypot(W - x, y),
      Math.hypot(x, H - y),
      Math.hypot(W - x, H - y),
    ) * 1.08;
  const DUR = Math.min(1600, 1100 + maxR * 0.22);

  // one ragged profile per burn — coarse shape + fine flutter added live
  const noise = Array.from({ length: SEGS }, () => Math.random());
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < SEGS; i++)
      noise[i] =
        (noise[(i + SEGS - 1) % SEGS] + noise[i] * 2 + noise[(i + 1) % SEGS]) /
        4; // smooth the profile so the front reads as fire, not static

  const canvas = document.createElement("canvas");
  canvas.className = "burn-canvas";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const sparks = [];
  const ash = [];
  const root = document.documentElement;

  // radius of the front at segment i, time t (0..1) — up-biased: fire climbs
  const radius = (i, t, base, now) => {
    const a = (i / SEGS) * Math.PI * 2;
    const climb = 1 + 0.14 * Math.max(0, -Math.sin(a));
    const shape = 1 + (noise[i] - 0.5) * 0.5;
    const flutter = 1 + 0.035 * Math.sin(a * 7 + now * 0.02 + noise[i] * 9);
    return Math.max(0, base * climb * shape * flutter);
  };

  const frontPoint = (i, r) => {
    const a = (i / SEGS) * Math.PI * 2;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r];
  };

  const tracePath = (rs, shrink) => {
    ctx.beginPath();
    for (let i = 0; i < SEGS; i++) {
      const [px, py] = frontPoint(i, Math.max(0, rs[i] - shrink));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  const vt = document.startViewTransition(flip);

  let t0 = 0;
  let done = false;
  let raf = 0;

  const frame = (now) => {
    if (!t0) t0 = now;
    const t = Math.min(1, (now - t0) / DUR);
    const ease = Math.pow(t, 1.7); // fire starts as a smoulder, ends as a race
    const base = 8 + ease * maxR;

    const rs = [];
    for (let i = 0; i < SEGS; i++) rs.push(radius(i, t, base, now));

    // ── the hole in the day: outer rect clockwise, blob counter-clockwise —
    // opposite winding punches through under the default nonzero fill rule
    if (!done) {
      let d = `M0 0H${W}V${H}H0Z`;
      for (let i = SEGS - 1; i >= 0; i--) {
        const [px, py] = frontPoint(i, rs[i] + 2);
        d += `${i === SEGS - 1 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
      }
      root.style.setProperty("--burn-clip", `path('${d}Z')`);
    }

    // ── canvas: char, embers, particles — all inside the hole
    ctx.clearRect(0, 0, W, H);

    if (!done) {
      // charred rim, two depths
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(14, 10, 7, 0.9)";
      ctx.lineWidth = 22;
      tracePath(rs, 12);
      ctx.stroke();
      ctx.strokeStyle = "rgba(24, 17, 11, 0.4)";
      ctx.lineWidth = 20;
      tracePath(rs, 30);
      ctx.stroke();

      // ember line — soft halo, hot band, white-hot core
      const flick = 0.82 + 0.18 * Math.sin(now * 0.045);
      ctx.shadowColor = "rgba(255, 92, 0, 0.9)";
      ctx.shadowBlur = 26;
      ctx.strokeStyle = `rgba(255, 110, 28, ${0.9 * flick})`;
      ctx.lineWidth = 3.5;
      tracePath(rs, 1);
      ctx.stroke();
      ctx.shadowBlur = 7;
      ctx.shadowColor = "rgba(255, 200, 120, 0.9)";
      ctx.strokeStyle = `rgba(255, 221, 165, ${flick})`;
      ctx.lineWidth = 1.3;
      tracePath(rs, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ignition flare — the match head, first beats only
      if (t < 0.12) {
        const fa = 1 - t / 0.12;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 42);
        g.addColorStop(0, `rgba(255, 224, 170, ${0.9 * fa})`);
        g.addColorStop(0.5, `rgba(255, 120, 30, ${0.45 * fa})`);
        g.addColorStop(1, "rgba(255, 120, 30, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 44, y - 44, 88, 88);
      }

      // spawn — spark count rides the front's speed
      const burst = 4 + Math.round(ease * 10);
      for (let s = 0; s < burst && sparks.length < 320; s++) {
        const i = Math.floor(Math.random() * SEGS);
        const [px, py] = frontPoint(i, rs[i]);
        if (px < -20 || px > W + 20 || py < -20 || py > H + 20) continue;
        sparks.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 70,
          vy: -50 - Math.random() * 110,
          life: 1,
          decay: 1.6 + Math.random() * 1.6,
          r: 0.8 + Math.random() * 1.6,
        });
        if (Math.random() < 0.4 && ash.length < 200)
          ash.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 26,
            vy: 30 + Math.random() * 80,
            sway: Math.random() * 6.28,
            life: 1,
            decay: 0.7 + Math.random() * 0.6,
            r: 1 + Math.random() * 2.2,
          });
      }
    }

    // particles keep living a beat after the front has left the sheet
    const dt = 1 / 60;
    ctx.globalCompositeOperation = "lighter";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt; // sparks arc over and die falling
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      const warm = p.life > 0.5;
      ctx.fillStyle = warm
        ? `rgba(255, ${150 + p.life * 90 | 0}, 60, ${p.life})`
        : `rgba(255, 90, 20, ${p.life * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.5 + p.life * 0.6), 0, 6.29);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    for (let i = ash.length - 1; i >= 0; i--) {
      const p = ash[i];
      p.sway += 3 * dt;
      p.x += (p.vx + Math.sin(p.sway) * 18) * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        ash.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(70, 63, 55, ${p.life * 0.55})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.29);
      ctx.fill();
    }

    if (t >= 1 && !done) {
      done = true;
      // sheet fully burned — fade the (already fully-holed) snapshot out and
      // let the embers die. The clip var must SURVIVE until the transition
      // ends, or the day sheet flashes back whole for the hold's remainder.
      root.style.setProperty("--burn-alpha", "0");
      canvas.style.transition = "opacity 0.45s ease";
      canvas.style.opacity = "0";
    }
    if (done && sparks.length === 0 && ash.length === 0) {
      cancelAnimationFrame(raf);
      canvas.remove();
      burning = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  // the pseudo-tree is gone once the transition finishes — drop the vars
  vt.finished.finally(() => {
    root.style.removeProperty("--burn-clip");
    root.style.removeProperty("--burn-alpha");
  });
}

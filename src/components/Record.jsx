import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import snapshot from "../github.json";
import { profile } from "../data";
import "./Record.css";

// THE RECORD — a year of work, rendered as an ink field.
// Each GitHub contribution day is one point in a 53-week × 7-day lattice.
// Activity (level 0–4) drives the point's ink density, size and lift; the
// cursor pushes through the field like wind over wet ink. Busy days catch a
// terracotta charge. This is the one place WebGL earns its keep — the shape is
// the data, not decoration.

const ROWS = 7; // days down — weekday rows; weeks are derived from day count

function readPalette() {
  const s = getComputedStyle(document.documentElement);
  const hex = (v) => new THREE.Color(s.getPropertyValue(v).trim() || "#000");
  return {
    ink: hex("--ink"),
    paper: hex("--paper"),
    seal: hex("--seal"),
  };
}

// live-refresh the headline numbers from REST; fall back silently to snapshot.
async function fetchLive(user) {
  try {
    const res = await fetch(`https://api.github.com/users/${user}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return { publicRepos: d.public_repos, followers: d.followers };
  } catch {
    return null;
  }
}

export default function Record() {
  const mountRef = useRef(null);
  const readRef = useRef(null); // the hover read-out chip
  const layoutRef = useRef(null); // {layout, weeks, inset} for hover + axis
  const [repos, setRepos] = useState(snapshot.publicRepos);
  const [ticks, setTicks] = useState([]); // month axis marks
  const reducedRef = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // refresh repo count live (cheap, no rate-limit pain for one call)
  useEffect(() => {
    let alive = true;
    fetchLive(snapshot.user).then((live) => {
      if (alive && live?.publicRepos != null) setRepos(live.publicRepos);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const days = snapshot.days;
    const N = days.length;

    // ── grid geometry: lay days into weeks (column) × weekday (row) ──
    // GitHub's calendar reads column-major from the oldest week. Mirror that.
    const positions = new Float32Array(N * 3);
    const levels = new Float32Array(N); // 0..1 activity
    const seeds = new Float32Array(N); // per-point phase
    const cols = new Float32Array(N); // 0..1 column — drives left→right reveal
    const idx = new Float32Array(N); // stable index — drives hover match
    // screen-space lattice cache (0..1 of the plate) so the DOM read-out and the
    // month axis can align to the exact same grid the shader draws.
    const layout = new Array(N); // {nx, ny, col, row}
    const monthTicks = []; // {label, x} — first week each calendar month opens

    // Normalize the lattice into clip space, inset from the plate edges so the
    // outer points + their swell never clip against the frame. The field's real
    // (wide, short) aspect is reapplied to x in the vertex shader via uAspect.
    const weeks = Math.ceil(N / ROWS);
    // inset hard enough that the largest dots (busy days swell ~16px) clear the
    // plate edges — top/bottom rows were getting clipped to half-circles.
    const INSET = 0.86; // fraction of [-1,1] the lattice occupies
    const MONTHS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    let lastMonth = -1;
    for (let i = 0; i < N; i++) {
      const col = Math.floor(i / ROWS);
      const row = i % ROWS;
      const cn = weeks > 1 ? col / (weeks - 1) : 0.5; // column 0..1
      const rn = ROWS > 1 ? row / (ROWS - 1) : 0.5; // row 0..1
      // map to [-INSET, INSET]; top row = newest weekday top
      const x = (cn * 2 - 1) * INSET;
      const y = (1 - rn * 2) * INSET;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0;
      levels[i] = days[i].level / 4;
      cols[i] = cn;
      idx[i] = i;
      seeds[i] = (i * 137.5) % (Math.PI * 2);
      // clip [-1,1] → plate fraction [0,1]; +inset padding handled by INSET
      layout[i] = {
        nx: (x * 0.5 + 0.5),
        ny: (1 - (y * 0.5 + 0.5)),
        col,
        row,
        date: days[i].date,
        level: days[i].level,
      };
      // month axis: drop a tick on the first day of a new calendar month
      const m = new Date(days[i].date + "T00:00:00").getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        monthTicks.push({ label: MONTHS[m], x: x * 0.5 + 0.5 });
      }
    }
    layoutRef.current = { layout, weeks, inset: INSET };
    // first column often opens mid-month, so the first two ticks can collide
    // (Jun + Jul stacking). Greedily keep ticks ~5% of plate width apart.
    const spaced = [];
    for (const t of monthTicks) {
      if (!spaced.length || t.x - spaced[spaced.length - 1].x > 0.05)
        spaced.push(t);
    }
    setTicks(spaced);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aLevel", new THREE.BufferAttribute(levels, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aCol", new THREE.BufferAttribute(cols, 1));
    geo.setAttribute("aIndex", new THREE.BufferAttribute(idx, 1));

    const pal = readPalette();
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(-10, -10) },
      uInk: { value: pal.ink.clone() },
      uPaper: { value: pal.paper.clone() },
      uSeal: { value: pal.seal.clone() },
      uDpr: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uReduced: { value: reducedRef.current ? 1 : 0 },
      uReveal: { value: 0 }, // 0→1 scroll-in
      uAspect: { value: 1 }, // field width/height, set on resize
      uHover: { value: -1 }, // index of the day under the cursor, -1 = none
      uHoverP: { value: 0 }, // 0→1 hover-swell, eased in JS for a soft latch
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexShader: /* glsl */ `
        attribute float aLevel;
        attribute float aSeed;
        attribute float aCol;
        attribute float aIndex;
        uniform float uTime;
        uniform vec2  uMouse;
        uniform float uDpr;
        uniform float uReduced;
        uniform float uReveal;
        uniform float uAspect;
        uniform float uHover;   // index of hovered day, -1 = none
        uniform float uHoverP;  // 0→1 swell amount
        varying float vLevel;
        varying float vGlow;
        varying float vInk;   // 0→1 per-point reveal progress (ink soaking in)
        varying float vHot;   // 1.0 on the hovered day, else 0

        // ease-out-back: overshoot then settle — ink struck onto paper
        float backOut(float t) {
          float c1 = 1.70158, c3 = c1 + 1.0;
          float u = t - 1.0;
          return 1.0 + c3 * u * u * u + c1 * u * u;
        }

        void main() {
          vLevel = aLevel;

          // ── reveal wave sweeps left→right (oldest week → newest) ──
          // uReveal is the wave front (0..1 + headroom). Each column ignites
          // when the front reaches it, then runs its own local 0→1.
          float WAVE = 0.45;                       // softness of the front
          float front = uReveal * (1.0 + WAVE) - aCol;
          float lp = clamp(front / WAVE, 0.0, 1.0);
          // reduced-motion: everything already present
          lp = mix(lp, 1.0, uReduced);
          float settle = backOut(lp);
          vInk = lp;

          // work in field space: x carries the plate's wide aspect so the
          // wind/distance math stays visually round.
          vec2 fp = vec2(position.x * uAspect, position.y);
          vec2 m  = vec2(uMouse.x, uMouse.y);

          // entrance: a column drops in from just below + a tiny jitter that
          // dies as the ink sets (backOut gives the struck-and-settle feel)
          fp.y += (1.0 - settle) * -0.22;
          fp.x += sin(aSeed * 7.0) * (1.0 - lp) * 0.015;

          // gentle breathing once set — busier days breathe more
          float br = sin(uTime * 0.9 + aSeed) * 0.5 + 0.5;
          fp.y += (aLevel * 0.06 + 0.01) * br * (1.0 - uReduced) * lp;

          // cursor proximity = a soft highlight only — NO displacement. the
          // lattice must stay a rigid calendar grid so days read by position.
          vec2 d = fp - m;
          float dist = length(d);
          float push = smoothstep(0.5, 0.0, dist) * (1.0 - uReduced) * lp;
          vGlow = push;

          // back to clip space: divide x by aspect so the field fits [-1,1]
          vec3 p = vec3(fp.x / uAspect, fp.y, 0.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          // hovered day: lift it forward, swell + flag it hot for the frag
          float hot = (abs(aIndex - uHover) < 0.5) ? 1.0 : 0.0;
          vHot = hot * uHoverP;

          // size blooms in with the ink (slight overshoot via settle)
          // STRONG size contrast: empty days are small quiet pins, worked days
          // jump up fast (pow curve lifts even level-1 clear of the floor), so
          // the eye reads density at a glance — "lots of work" not "flat field".
          float swell = pow(aLevel, 0.7);          // any activity reads big
          float base = 2.8 + swell * 13.0;
          base += hot * uHoverP * 7.0;              // the read-out day swells
          float grow = mix(0.0, 1.0, lp) * (0.85 + 0.15 * settle);
          gl_PointSize = base * uDpr * grow;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3  uInk;
        uniform vec3  uPaper;
        uniform vec3  uSeal;
        varying float vLevel;
        varying float vGlow;
        varying float vInk;
        varying float vHot;
        void main() {
          // round ink dot with a soft edge — edge softens while ink soaks in,
          // so each point reads as a bloom landing on paper, not a hard dot
          vec2 uv = gl_PointCoord - 0.5;
          float r = length(uv);
          float edge = mix(0.18, 0.36, vInk);
          float alpha = smoothstep(0.5, edge, r);
          if (alpha < 0.01) discard;

          // empty days = a quiet ghost pin (grid still legible); any worked day
          // jumps to near-full ink fast, top of the scale takes a terracotta
          // charge — so worked vs empty reads instantly by weight AND colour.
          float ink = mix(0.26, 1.0, pow(vLevel, 0.55));
          vec3 col = mix(uPaper, uInk, ink);
          float charge = smoothstep(0.3, 0.95, vLevel) + vGlow * 0.7;
          // fresh strike flares terracotta, then cools to ink as it sets
          float strike = (1.0 - vInk) * smoothstep(0.02, 0.4, vInk);
          col = mix(col, uSeal, clamp(charge + strike * 1.2, 0.0, 1.0) * 0.85);
          // hovered day takes a full terracotta charge so the read-out has a mark
          col = mix(col, uSeal, vHot * 0.92);

          // empty days sit back (quiet), worked days come forward at full alpha
          float a = alpha * mix(0.34, 1.0, pow(vLevel, 0.5) + vGlow * 0.5) * vInk;
          a = mix(a, max(a, alpha), vHot); // hovered day reads at full opacity
          // thin ring around the hovered day — a sight on the picked mark
          float ring = smoothstep(0.5, 0.46, r) - smoothstep(0.46, 0.40, r);
          gl_FragColor = vec4(col, a);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uSeal, ring * vHot);
          gl_FragColor.a = max(gl_FragColor.a, ring * vHot);
        }
      `,
    });

    const points = new THREE.Points(geo, mat);
    const scene = new THREE.Scene();
    scene.add(points);

    // fixed clip-space camera; aspect handled in the shader via uAspect
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    let raf = 0;
    let running = true;
    const clock = new THREE.Clock();

    function resize() {
      const r = mount.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      // the plate is wide & short; tell the shader its aspect so the lattice
      // fills it and the wind math stays visually round.
      uniforms.uAspect.value = w / h;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // day name for the read-out — level is 0..4 (GitHub buckets), not a count,
    // so name the band rather than fake a number.
    const LEVEL_NAME = [
      "no commits",
      "a light day",
      "a steady day",
      "a busy day",
      "a heavy day",
    ];
    const readEl = readRef.current;
    let hoverIdx = -1;

    function paintRead(i, r) {
      if (!readEl) return;
      const L = layout[i];
      const px = L.nx * r.width;
      const py = L.ny * r.height;
      readEl.style.left = `${px}px`;
      readEl.style.top = `${py}px`;
      const d = new Date(L.date + "T00:00:00");
      const ds = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      readEl.querySelector(".record__read-date").textContent = ds;
      const lv = readEl.querySelector(".record__read-level");
      lv.innerHTML = L.level >= 3
        ? `<em>${LEVEL_NAME[L.level]}</em>`
        : LEVEL_NAME[L.level];
      readEl.classList.add("is-on");
    }

    // pointer → field space (match ortho extents) + nearest-day pick
    function onMove(e) {
      const r = mount.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      // field space: x carries the plate aspect (matches the vertex shader)
      uniforms.uMouse.value.set(nx * uniforms.uAspect.value, ny);

      // pick the nearest lattice day in plate-fraction space (aspect-correct)
      const mx = (e.clientX - r.left) / r.width;
      const my = (e.clientY - r.top) / r.height;
      const asp = r.width / r.height;
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < N; i++) {
        const L = layout[i];
        const dx = (L.nx - mx) * asp;
        const dy = L.ny - my;
        const dd = dx * dx + dy * dy;
        if (dd < bestD) {
          bestD = dd;
          best = i;
        }
      }
      // only latch when genuinely close to a mark (in plate units, ~one cell)
      const near = Math.sqrt(bestD) < 0.045 * asp;
      if (near && best !== hoverIdx) {
        hoverIdx = best;
        uniforms.uHover.value = best;
        paintRead(best, r);
      } else if (!near && hoverIdx !== -1) {
        hoverIdx = -1;
        uniforms.uHover.value = -1;
        if (readEl) readEl.classList.remove("is-on");
      } else if (near) {
        paintRead(best, r); // keep the chip glued to the live cursor cell
      }
    }
    function onLeave() {
      uniforms.uMouse.value.set(-10, -10);
      hoverIdx = -1;
      uniforms.uHover.value = -1;
      if (readEl) readEl.classList.remove("is-on");
    }
    mount.addEventListener("pointermove", onMove);
    mount.addEventListener("pointerleave", onLeave);

    // reveal when the section scrolls into view
    let revealed = reducedRef.current;
    if (revealed) uniforms.uReveal.value = 1;
    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (entry.isIntersecting) revealed = true;
        if (running) tick();
      },
      { threshold: 0.05 },
    );
    io.observe(mount);

    // re-read palette on theme flip (Day/Night toggles data-theme)
    const themeObserver = new MutationObserver(() => {
      const np = readPalette();
      uniforms.uInk.value.copy(np.ink);
      uniforms.uPaper.value.copy(np.paper);
      uniforms.uSeal.value.copy(np.seal);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    let last = 0;
    function tick() {
      if (!running) return;
      const t = clock.getElapsedTime();
      const dt = Math.min(t - last, 0.05);
      last = t;
      uniforms.uTime.value = t;
      // ease the hover-swell toward 1 when a day is picked, 0 when not
      const target = uniforms.uHover.value >= 0 ? 1 : 0;
      uniforms.uHoverP.value +=
        (target - uniforms.uHoverP.value) * Math.min(1, dt * 14);
      if (revealed) {
        // ~1.6s for the ink wave to sweep the whole year, left→right
        uniforms.uReveal.value = Math.min(
          1,
          uniforms.uReveal.value + dt * 0.62,
        );
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      mount.removeEventListener("pointermove", onMove);
      mount.removeEventListener("pointerleave", onLeave);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount)
        mount.removeChild(renderer.domElement);
    };
  }, []);

  const since = snapshot.createdAt
    ? new Date(snapshot.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      })
    : "Feb '26";

  return (
    <section className="record" id="record">
      <div className="wrap record__inner">
        <p className="record__folio" data-reveal>
          <span className="record__folio-no">01</span>
          <span className="record__folio-label">The Record</span>
        </p>

        <div className="record__head">
          <h2 className="record__title display" data-reveal>
            A year, kept in ink.
          </h2>
          <p className="record__lede" data-reveal>
            Every mark below is one day of work on {profile.first}&apos;s public
            repositories — pulled live from GitHub, the densest stretches charged
            in {/* terracotta */}red. No streak-farming, no filler. Just the
            record.
          </p>
        </div>

        <div className="record__plate">
          <div className="record__field" ref={mountRef} aria-hidden="true">
            <div className="record__read" ref={readRef} aria-hidden="true">
              <span className="record__read-date" />
              <span className="record__read-level" />
            </div>
          </div>
          <div className="record__axis" aria-hidden="true">
            {ticks.map((t, i) => (
              <span
                key={i}
                className="record__tick"
                style={{ left: `${t.x * 100}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <dl className="record__ledger" data-reveal>
          <div className="record__entry">
            <dt className="record__entry-val">{snapshot.total}</dt>
            <dd className="record__entry-label">contributions · last 12 mo</dd>
          </div>
          <div className="record__entry">
            <dt className="record__entry-val">{snapshot.longestStreak}d</dt>
            <dd className="record__entry-label">longest streak</dd>
          </div>
          <div className="record__entry">
            <dt className="record__entry-val">{repos}</dt>
            <dd className="record__entry-label">public repositories</dd>
          </div>
          <div className="record__entry">
            <dt className="record__entry-val">{since}</dt>
            <dd className="record__entry-label">first commit on record</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

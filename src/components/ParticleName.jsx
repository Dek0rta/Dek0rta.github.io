import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const WORD = "DEK0RTA";
const COUNT = 6000;

const COL_A = new THREE.Color("#7c5cff"); // --accent
const COL_B = new THREE.Color("#00e0c6"); // --accent-2

// sample filled pixels of the rendered word → world-space target positions
function sampleTargets(width) {
  const dpr = 1;
  const c = document.createElement("canvas");
  const w = Math.max(480, Math.min(1400, Math.floor(width)));
  const h = Math.floor(w * 0.32);
  c.width = w * dpr;
  c.height = h * dpr;
  const ctx = c.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // size the font to fill most of the width
  let fontSize = Math.floor(h * 0.78);
  ctx.font = `800 ${fontSize}px Inter, sans-serif`;
  let measured = ctx.measureText(WORD).width;
  const maxW = w * 0.92;
  if (measured > maxW) {
    fontSize = Math.floor(fontSize * (maxW / measured));
    ctx.font = `800 ${fontSize}px Inter, sans-serif`;
  }
  ctx.fillText(WORD, w / 2, h / 2);

  const data = ctx.getImageData(0, 0, w * dpr, h * dpr).data;
  const filled = [];
  const step = 3; // skip pixels for density control
  for (let y = 0; y < h * dpr; y += step) {
    for (let x = 0; x < w * dpr; x += step) {
      const a = data[(y * w * dpr + x) * 4 + 3];
      if (a > 128) filled.push([x, y]);
    }
  }

  // world scale: map pixel space to roughly [-aspect..aspect] in x
  const scale = 10 / (w * dpr);
  const targets = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const p = filled.length ? filled[(Math.random() * filled.length) | 0] : [w / 2, h / 2];
    const tx = (p[0] - (w * dpr) / 2) * scale;
    const ty = -(p[1] - (h * dpr) / 2) * scale;
    const tz = (Math.random() - 0.5) * 0.25;
    targets[i * 3] = tx;
    targets[i * 3 + 1] = ty;
    targets[i * 3 + 2] = tz;
  }
  return targets;
}

function Particles({ reduced }) {
  const pointsRef = useRef(null);
  const { size, viewport } = useThree();
  const mouse = useRef(new THREE.Vector3(9999, 9999, 0));
  const introT = useRef(0);

  // positions / colors / scratch
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      // scattered start
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      tmp.copy(COL_A).lerp(COL_B, Math.random());
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    return { positions, colors };
  }, []);

  const targets = useRef(sampleTargets(size.width));

  // re-sample on resize
  useEffect(() => {
    targets.current = sampleTargets(size.width);
  }, [size.width]);

  // pointer → world plane at z=0
  useEffect(() => {
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.current.set((nx * viewport.width) / 2, (ny * viewport.height) / 2, 0);
    };
    const onLeave = () => mouse.current.set(9999, 9999, 0);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [viewport.width, viewport.height]);

  useFrame((state, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const arr = pts.geometry.attributes.position.array;
    const tg = targets.current;
    const t = state.clock.elapsedTime;

    // intro easing factor ramps 0→1
    if (introT.current < 1) introT.current = Math.min(1, introT.current + delta * 0.55);
    const formLerp = reduced ? 1 : 0.06 * (0.4 + introT.current);

    const mx = mouse.current.x;
    const my = mouse.current.y;
    const repelR = 1.1;
    const repelR2 = repelR * repelR;

    // gentle breathing + rotation baked into target offset
    const breathe = reduced ? 0 : Math.sin(t * 0.6) * 0.06;
    const rot = reduced ? 0 : Math.sin(t * 0.25) * 0.04;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      let txt = tg[ix];
      const tyt = tg[ix + 1];
      const tzt = tg[ix + 2];

      // apply subtle rotation around y to target
      const rx = txt * cosR + tzt * sinR;
      const rz = -txt * sinR + tzt * cosR;
      const targetX = rx;
      const targetY = tyt + breathe;
      const targetZ = rz;

      let px = arr[ix];
      let py = arr[ix + 1];
      let pz = arr[ix + 2];

      // ease toward target
      px += (targetX - px) * formLerp;
      py += (targetY - py) * formLerp;
      pz += (targetZ - pz) * formLerp;

      // repulsion from cursor (only after mostly formed)
      if (!reduced && introT.current > 0.6 && mx < 9000) {
        const dx = px - mx;
        const dy = py - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < repelR2 && d2 > 0.0001) {
          const f = (1 - d2 / repelR2) * 0.5;
          const inv = 1 / Math.sqrt(d2);
          px += dx * inv * f;
          py += dy * inv * f;
        }
      }

      arr[ix] = px;
      arr[ix + 1] = py;
      arr[ix + 2] = pz;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.92}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

export default function ParticleName() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const fn = () => setReduced(m.matches);
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, []);

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Particles reduced={reduced} />
    </Canvas>
  );
}

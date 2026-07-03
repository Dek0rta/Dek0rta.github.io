// ─── LIVING INK ───
// A stable-fluids solver (Stam / Dobryakov lineage) on raw WebGL2 that drives
// the opening sheet: drops splash, the pointer stirs, and dye pools into the
// masthead glyphs. Dye carries two pigments — R = ink, G = seal — composited
// over the paper color so it works in both themes.
//
// Returns null when the GPU can't do it (no WebGL2 / no float render targets);
// the caller falls back to the classic typographic intro.

const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
uniform vec2 uTexel;
out vec2 vUv, vL, vR, vT, vB;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG_ADVECT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity, uSource;
uniform vec2 uTexel;
uniform float uDt, uDissipation;
out vec4 frag;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  frag = texture(uSource, coord) / (1.0 + uDissipation * uDt);
}`;

const FRAG_DIVERGENCE = `#version 300 es
precision highp float;
in vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uVelocity;
out vec4 frag;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  frag = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const FRAG_CURL = `#version 300 es
precision highp float;
in vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uVelocity;
out vec4 frag;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  frag = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const FRAG_VORTICITY = `#version 300 es
precision highp float;
in vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uVelocity, uCurl;
uniform float uStrength, uDt;
out vec4 frag;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uStrength * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy + force * uDt;
  frag = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
}`;

const FRAG_PRESSURE = `#version 300 es
precision highp float;
in vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uPressure, uDivergence;
out vec4 frag;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float div = texture(uDivergence, vUv).x;
  frag = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`;

const FRAG_GRADIENT = `#version 300 es
precision highp float;
in vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uPressure, uVelocity;
out vec4 frag;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 vel = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  frag = vec4(vel, 0.0, 1.0);
}`;

const FRAG_CLEAR = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;
out vec4 frag;
void main() { frag = uValue * texture(uTexture, vUv); }`;

const FRAG_SPLAT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTarget;
uniform float uAspect, uRadius;
uniform vec2 uPoint;
uniform vec3 uColor;
out vec4 frag;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  float s = exp(-dot(p, p) / uRadius);
  frag = vec4(texture(uTarget, vUv).xyz + s * uColor, 1.0);
}`;

// glyph emitters: one additive GL_POINTS pass lays hundreds of micro-drops
// per frame directly into the dye field — the ink "finds" the letterforms
const VERT_POINTS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPoint;
uniform float uSize;
void main() {
  gl_Position = vec4(aPoint * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uSize;
}`;

const FRAG_POINTS = `#version 300 es
precision highp float;
uniform float uAmount;
out vec4 frag;
void main() {
  vec2 d = gl_PointCoord * 2.0 - 1.0;
  float s = exp(-dot(d, d) * 4.0);
  frag = vec4(uAmount * s, 0.0, 0.0, 0.0);
}`;

// the sheet leaves by dissolving, not sliding: uDissolve sweeps 0→1 and the
// paper eats away in fbm blotches (alpha holes reveal the live cover under
// the canvas). Ink-dense pixels hold on longest — the tendrils go last — and
// the dissolve edge soaks dark like wet paper before it vanishes.
const FRAG_DISPLAY = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uDye;
uniform vec3 uPaper, uInk, uSeal;
uniform float uDissolve, uAspect;
uniform vec2 uSeed;
out vec4 frag;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec2 d = texture(uDye, vUv).rg;
  float aSeal = 1.0 - exp(-d.g * 2.4);
  float aInk  = 1.0 - exp(-d.r * 2.8);
  vec3 col = mix(mix(uPaper, uSeal, aSeal), uInk, aInk);
  float alpha = 1.0;
  if (uDissolve > 0.0) {
    vec2 q = vec2(vUv.x * uAspect, vUv.y);
    float n = fbm(q * 4.5 + uSeed);
    float hold = (aInk + aSeal) * 0.32;            // ink outlives the paper
    float x = uDissolve * 1.75 - (n + hold);       // overdriven so holds clear
    float soak = smoothstep(-0.16, 0.0, x) * (1.0 - smoothstep(0.0, 0.12, x));
    col = mix(col, uInk, soak * 0.3);
    alpha = 1.0 - smoothstep(0.0, 0.12, x);
  }
  frag = vec4(col * alpha, alpha);                 // premultiplied
}`;

function parseColor(str) {
  const s = str.trim();
  if (s[0] === "#") {
    const hex = s.length === 4 ? s.replace(/./g, (c, i) => (i ? c + c : "")) : s.slice(1);
    const n = parseInt(hex, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const m = s.match(/[\d.]+/g);
  return m ? [+m[0] / 255, +m[1] / 255, +m[2] / 255] : [0, 0, 0];
}

export function createInk(canvas, colors) {
  let gl;
  try {
    // alpha:true — the dissolve exit punches holes through to the live page
    gl = canvas.getContext("webgl2", {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
    });
  } catch {
    return null;
  }
  if (!gl) return null;

  const paper = parseColor(colors.paper);
  const ink = parseColor(colors.ink);
  const seal = parseColor(colors.seal);

  gl.clearColor(paper[0], paper[1], paper[2], 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (!gl.getExtension("EXT_color_buffer_float")) return null;

  // ── program plumbing ──
  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("ink shader:", gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };
  const program = (vertSrc, fragSrc) => {
    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  };

  const progs = {
    advect: program(VERT, FRAG_ADVECT),
    divergence: program(VERT, FRAG_DIVERGENCE),
    curl: program(VERT, FRAG_CURL),
    vorticity: program(VERT, FRAG_VORTICITY),
    pressure: program(VERT, FRAG_PRESSURE),
    gradient: program(VERT, FRAG_GRADIENT),
    clear: program(VERT, FRAG_CLEAR),
    splat: program(VERT, FRAG_SPLAT),
    points: program(VERT_POINTS, FRAG_POINTS),
    display: program(VERT, FRAG_DISPLAY),
  };
  if (Object.values(progs).some((p) => !p)) return null;

  // fullscreen quad
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const blit = (target) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.w : gl.drawingBufferWidth, target ? target.h : gl.drawingBufferHeight);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // ── render targets ──
  const createTarget = (w, h, internal, format, filter) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h, texel: [1 / w, 1 / h] };
  };
  const createPair = (w, h, internal, format, filter) => {
    let a = createTarget(w, h, internal, format, filter);
    let b = createTarget(w, h, internal, format, filter);
    return {
      get read() { return a; },
      get write() { return b; },
      swap() { [a, b] = [b, a]; },
      w, h, texel: [1 / w, 1 / h],
    };
  };

  const fit = (base) => {
    const ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
    return ar >= 1
      ? { w: Math.round(base * ar), h: base }
      : { w: base, h: Math.round(base / ar) };
  };

  const small = window.innerWidth < 768;
  const simR = fit(small ? 96 : 144);
  const dyeR = fit(small ? 384 : 560);

  const velocity = createPair(simR.w, simR.h, gl.RG16F, gl.RG, gl.LINEAR);
  const dye = createPair(dyeR.w, dyeR.h, gl.RG16F, gl.RG, gl.LINEAR);
  const divergence = createTarget(simR.w, simR.h, gl.R16F, gl.RED, gl.NEAREST);
  const curl = createTarget(simR.w, simR.h, gl.R16F, gl.RED, gl.NEAREST);
  const pressure = createPair(simR.w, simR.h, gl.R16F, gl.RED, gl.NEAREST);

  const bind = (tex, unit) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    return unit;
  };

  // ── glyph emitters ──
  const glyphBuf = gl.createBuffer();
  let glyphCount = 0;
  let glyphCursor = 0;
  let emitPerFrame = 0;

  // ── simulation constants ──
  const CURL = 22;
  const PRESSURE_ITER = 20;
  const VEL_DISSIPATION = 0.4;
  const DYE_DISSIPATION = 0.14;
  const aspect = () => gl.drawingBufferWidth / gl.drawingBufferHeight;

  const splat = (pair, x, y, r, g, b, radius) => {
    const pr = progs.splat;
    gl.useProgram(pr.p);
    gl.uniform1i(pr.u.uTarget, bind(pair.read.tex, 0));
    gl.uniform1f(pr.u.uAspect, aspect());
    gl.uniform2f(pr.u.uPoint, x, y);
    gl.uniform3f(pr.u.uColor, r, g, b);
    gl.uniform1f(pr.u.uRadius, radius);
    blit(pair.write);
    pair.swap();
  };

  const step = (dt) => {
    gl.disable(gl.BLEND);

    let pr = progs.curl;
    gl.useProgram(pr.p);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uVelocity, bind(velocity.read.tex, 0));
    blit(curl);

    pr = progs.vorticity;
    gl.useProgram(pr.p);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uVelocity, bind(velocity.read.tex, 0));
    gl.uniform1i(pr.u.uCurl, bind(curl.tex, 1));
    gl.uniform1f(pr.u.uStrength, CURL);
    gl.uniform1f(pr.u.uDt, dt);
    blit(velocity.write);
    velocity.swap();

    pr = progs.divergence;
    gl.useProgram(pr.p);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uVelocity, bind(velocity.read.tex, 0));
    blit(divergence);

    pr = progs.clear;
    gl.useProgram(pr.p);
    gl.uniform2fv(pr.u.uTexel, pressure.texel);
    gl.uniform1i(pr.u.uTexture, bind(pressure.read.tex, 0));
    gl.uniform1f(pr.u.uValue, 0.8);
    blit(pressure.write);
    pressure.swap();

    pr = progs.pressure;
    gl.useProgram(pr.p);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uDivergence, bind(divergence.tex, 0));
    for (let i = 0; i < PRESSURE_ITER; i++) {
      gl.uniform1i(pr.u.uPressure, bind(pressure.read.tex, 1));
      blit(pressure.write);
      pressure.swap();
    }

    pr = progs.gradient;
    gl.useProgram(pr.p);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uPressure, bind(pressure.read.tex, 0));
    gl.uniform1i(pr.u.uVelocity, bind(velocity.read.tex, 1));
    blit(velocity.write);
    velocity.swap();

    pr = progs.advect;
    gl.useProgram(pr.p);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1f(pr.u.uDt, dt);
    gl.uniform1f(pr.u.uDissipation, VEL_DISSIPATION);
    const vel = bind(velocity.read.tex, 0);
    gl.uniform1i(pr.u.uVelocity, vel);
    gl.uniform1i(pr.u.uSource, vel);
    blit(velocity.write);
    velocity.swap();

    gl.uniform1f(pr.u.uDissipation, DYE_DISSIPATION);
    gl.uniform1i(pr.u.uVelocity, bind(velocity.read.tex, 0));
    gl.uniform1i(pr.u.uSource, bind(dye.read.tex, 1));
    blit(dye.write);
    dye.swap();

    // ink pools into the glyphs — additive point sprites, one draw call
    if (emitPerFrame > 0 && glyphCount > 0) {
      const prp = progs.points;
      gl.useProgram(prp.p);
      gl.uniform1f(prp.u.uSize, Math.max(2, dye.h * 0.008));
      gl.uniform1f(prp.u.uAmount, 0.16);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, dye.read.fbo);
      gl.viewport(0, 0, dye.w, dye.h);
      gl.bindBuffer(gl.ARRAY_BUFFER, glyphBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      let n = Math.min(emitPerFrame, glyphCount);
      if (glyphCursor + n > glyphCount) {
        gl.drawArrays(gl.POINTS, glyphCursor, glyphCount - glyphCursor);
        n -= glyphCount - glyphCursor;
        glyphCursor = 0;
      }
      gl.drawArrays(gl.POINTS, glyphCursor, n);
      glyphCursor += n;
      gl.disable(gl.BLEND);
    }
  };

  let dissolve = 0;
  const seed = [Math.random() * 100, Math.random() * 100];

  const render = () => {
    const pr = progs.display;
    gl.useProgram(pr.p);
    gl.uniform2f(pr.u.uTexel, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
    gl.uniform1i(pr.u.uDye, bind(dye.read.tex, 0));
    gl.uniform3fv(pr.u.uPaper, paper);
    gl.uniform3fv(pr.u.uInk, ink);
    gl.uniform3fv(pr.u.uSeal, seal);
    gl.uniform1f(pr.u.uDissolve, dissolve);
    gl.uniform1f(pr.u.uAspect, aspect());
    gl.uniform2f(pr.u.uSeed, seed[0], seed[1]);
    blit(null);
  };

  // ── loop ──
  let raf = 0;
  let last = 0;
  let running = false;
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000 || 0.016, 1 / 30);
    last = now;
    step(dt);
    render();
    if (running) raf = requestAnimationFrame(frame);
  };

  render(); // first paint = clean paper, no flash

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    destroy() {
      this.stop();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },

    // pointer stir: uv position + uv delta
    pointer(x, y, dx, dy) {
      splat(velocity, x, y, dx * 900, dy * 900, 0, 3e-4);
      splat(dye, x, y, 0.06, 0, 0, 2.2e-4);
    },

    // a falling drop: hard velocity kick + pigment + micro-splatter ring
    drop(x, y, pigment) {
      const r = 1.5e-3 * (0.7 + Math.random() * 0.6);
      const q = pigment === "seal" ? [0, 0.6] : [0.6, 0];
      splat(velocity, x, y, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, 0, r);
      splat(dye, x, y, q[0], q[1], 0, r);
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 0.02 + Math.random() * 0.05;
        splat(dye, x + Math.cos(a) * d, y + Math.sin(a) * d / aspect(), q[0] * 0.5, q[1] * 0.5, 0, 5e-5);
      }
    },

    // 0→1: the sheet eats away to transparency (see FRAG_DISPLAY)
    setDissolve(t) {
      dissolve = t;
    },

    // one wide, slow stir so the ink is visibly alive while it dissolves
    breath() {
      for (let i = 0; i < 3; i++) {
        splat(
          velocity,
          0.2 + Math.random() * 0.6,
          0.2 + Math.random() * 0.6,
          (Math.random() - 0.5) * 260,
          (Math.random() - 0.5) * 260,
          0,
          8e-3,
        );
      }
    },

    setGlyphs(points) {
      gl.bindBuffer(gl.ARRAY_BUFFER, glyphBuf);
      gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
      glyphCount = points.length / 2;
      glyphCursor = 0;
    },
    setEmit(n) {
      emitPerFrame = Math.round(n);
    },
  };
}

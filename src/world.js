// SIDE BIBLE — an original, living landscape painted with Canvas 2D.
// Geometry and vegetation are cached; water, atmosphere and living things move.
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const lerpColor = (a, b, t) => a.map((v, i) => Math.round(mix(v, b[i], t)));
const rgba = (a, opacity = 1) => `rgba(${a.map(Math.round).join(',')},${clamp(opacity)})`;
const rgb = a => rgba(a);
function random(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(text) { let n = 231; for (const c of String(text)) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
function noise(x, y = 0, seed = 1) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
  const at = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7 + seed * 17.3) * 43758.5453123; return n - Math.floor(n); };
  return mix(mix(at(ix, iy), at(ix + 1, iy), fx), mix(at(ix, iy + 1), at(ix + 1, iy + 1), fx), fy);
}
function fbm(x, y, seed) { return noise(x, y, seed) * .56 + noise(x * 2.03, y * 2.03, seed + 4) * .28 + noise(x * 4.1, y * 4.1, seed + 9) * .12 + noise(x * 8.3, y * 8.3, seed + 19) * .04; }
function surface(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function glow(c, x, y, radius, col, strength) {
  if (radius < .1 || strength <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, rgba(col, strength)); g.addColorStop(.22, rgba(col, strength * .42)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
function line(c, x, y, x2, y2, color, width = 1) { c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
const PALETTES = {
  watchers: { top: [6, 13, 30], middle: [28, 47, 77], haze: [105, 107, 117], light: [246, 211, 152], water: [19, 37, 54], near: [6, 21, 30], grass: [27, 45, 40], earth: [32, 40, 43], night: 1, sunX: .22, sunY: .31, trees: 'cedar' },
  garden: { top: [55, 100, 146], middle: [132, 172, 192], haze: [217, 225, 206], light: [255, 237, 185], water: [48, 100, 130], near: [16, 47, 66], grass: [73, 111, 51], earth: [83, 81, 49], night: 0, sunX: .20, sunY: .32, trees: 'broad' },
  river: { top: [65, 87, 113], middle: [181, 157, 139], haze: [244, 215, 167], light: [255, 230, 157], water: [112, 138, 140], near: [30, 65, 72], grass: [74, 91, 55], earth: [102, 94, 61], night: .12, sunX: .25, sunY: .48, trees: 'willow' },
  city: { top: [26, 37, 67], middle: [107, 88, 115], haze: [205, 151, 117], light: [255, 202, 136], water: [57, 70, 90], near: [17, 33, 44], grass: [62, 65, 47], earth: [79, 71, 56], night: .5, sunX: .22, sunY: .48, trees: 'cypress' },
  wisdom: { top: [27, 49, 82], middle: [76, 109, 139], haze: [189, 194, 181], light: [253, 226, 180], water: [48, 82, 105], near: [18, 45, 58], grass: [41, 64, 47], earth: [65, 62, 48], night: .27, sunX: .27, sunY: .39, trees: 'olive' },
  temple: { top: [53, 72, 100], middle: [128, 145, 157], haze: [225, 207, 172], light: [255, 226, 170], water: [75, 108, 122], near: [29, 56, 68], grass: [70, 78, 53], earth: [107, 97, 71], night: .15, sunX: .2, sunY: .4, trees: 'cypress' },
  birds: { top: [56, 106, 154], middle: [146, 182, 198], haze: [231, 226, 198], light: [255, 239, 191], water: [76, 130, 149], near: [32, 70, 81], grass: [80, 106, 53], earth: [129, 104, 69], night: 0, sunX: .2, sunY: .29, trees: 'olive' },
  desert: { top: [36, 44, 69], middle: [125, 94, 107], haze: [227, 170, 117], light: [255, 219, 157], water: [71, 77, 90], near: [28, 38, 47], grass: [87, 73, 48], earth: [127, 101, 70], night: .48, sunX: .26, sunY: .45, trees: 'bare' },
  dawn: { top: [56, 85, 116], middle: [153, 147, 161], haze: [252, 207, 155], light: [255, 225, 164], water: [97, 128, 144], near: [33, 65, 76], grass: [69, 88, 53], earth: [101, 87, 58], night: .15, sunX: .3, sunY: .48, trees: 'broad' },
  tower: { top: [20, 34, 56], middle: [63, 86, 109], haze: [168, 165, 145], light: [250, 219, 157], water: [47, 72, 92], near: [17, 38, 48], grass: [52, 71, 48], earth: [78, 75, 57], night: .38, sunX: .24, sunY: .38, trees: 'cypress' },
};

export class World {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas?.getContext?.('2d') || null;
    this.theme = 'watchers'; this.progress = .16; this.context = { landing: true };
    this.time = 0; this.charge = 0; this.event = 0; this.transition = 1; this.frame = 0;
    this.pointer = { x: -200, y: -200, tx: -200, ty: -200 }; this.trail = [];
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    this.destroyed = false; this.seed = 3821;
    const R = random(2950);
    this.stars = Array.from({ length: 590 }, () => ({ x: R(), y: R() * .57, r: .25 + R() ** 4 * 1.45, a: .16 + R() * .76, phase: R() * TAU }));
    this.waves = Array.from({ length: 630 }, () => ({ x: R(), y: R(), length: .2 + R(), phase: R() * TAU, speed: .3 + R() * .7 }));
    this.motes = Array.from({ length: 44 }, () => ({ x: R(), y: R(), phase: R() * TAU, speed: .12 + R() * .3 }));
    this.cloudModels = [17, 73, 213, 39].map(seed => this.makeCloud(seed));
    this.resizeHandler = () => this.resize();
    this.visibilityHandler = () => { cancelAnimationFrame(this.frame); this.last = 0; if (!document.hidden) { this.draw(); this.start(); } };
    window.addEventListener('resize', this.resizeHandler, { passive: true }); document.addEventListener('visibilitychange', this.visibilityHandler);
    this.resize(); this.start();
  }
  resize() {
    if (!this.ctx) return;
    const b = this.canvas.getBoundingClientRect(); this.w = b.width || innerWidth; this.h = b.height || innerHeight;
    this.dpr = Math.min(devicePixelRatio || 1, 1.5); this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.mobile = this.w < 700; this.unit = Math.min(this.h / 760, this.w / 1080) * (this.mobile ? 1.8 : 1);
    this.horizon = this.h * .535; this.snapshot = null; this.transition = 1;
    this.buildScene(); this.draw();
  }
  setScene(theme, progress = 0, color = '#c8a979', context = {}) {
    if (!this.ctx) return;
    const same = this.theme === theme && this.context.sceneId === context.sceneId && this.progress === progress && !!this.context.landing === !!context.landing;
    if (same) return;
    if (!this.reduced && this.w) { this.snapshot = surface(this.canvas.width, this.canvas.height); this.snapshot.getContext('2d').drawImage(this.canvas, 0, 0); this.transition = 0; }
    this.theme = PALETTES[theme] ? theme : 'watchers'; this.progress = clamp(Number(progress) || 0); this.context = context;
    this.seed = hash(context.bookId || this.theme); this.sceneSeed = hash(context.sceneId || this.theme);
    this.buildScene(); this.event = this.reduced ? 0 : .1; this.draw(); this.start();
  }
  setPointer(x, y) {
    const b = this.canvas.getBoundingClientRect(); this.pointer.tx = x - b.left; this.pointer.ty = y - b.top;
    if (this.pointer.x < -100 || this.reduced) { this.pointer.x = this.pointer.tx; this.pointer.y = this.pointer.ty; }
    if (this.reduced) this.draw();
  }
  setCharge(value) { this.charge = clamp(Number(value) || 0); if (this.reduced) this.draw(); }
  pulse() { this.event = this.reduced ? 0 : 1; this.draw(); this.start(); }
  setReducedMotion(value) { this.reduced = !!value; cancelAnimationFrame(this.frame); this.last = 0; this.snapshot = null; this.transition = 1; if (this.reduced) this.event = 0; this.draw(); this.start(); }
  start() {
    if (this.destroyed || !this.ctx || this.reduced || document.hidden) return;
    cancelAnimationFrame(this.frame);
    const tick = stamp => {
      if (this.destroyed || this.reduced || document.hidden) return;
      const dt = this.last ? Math.min(.05, (stamp - this.last) / 1000) : 0; this.last = stamp; this.time += dt;
      this.event = Math.max(0, this.event - dt / 3.8); this.transition = Math.min(1, this.transition + dt / 1.65);
      if (this.transition === 1) this.snapshot = null;
      this.pointer.x = mix(this.pointer.x, this.pointer.tx, Math.min(1, dt * 8)); this.pointer.y = mix(this.pointer.y, this.pointer.ty, Math.min(1, dt * 8));
      if (this.pointer.x > 0) { this.trail.push({ x: this.pointer.x, y: this.pointer.y, life: 1 }); if (this.trail.length > 32) this.trail.shift(); }
      this.trail.forEach(p => { p.life -= dt * 1.7; }); this.trail = this.trail.filter(p => p.life > 0);
      this.draw(); this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  destroy() { this.destroyed = true; cancelAnimationFrame(this.frame); window.removeEventListener('resize', this.resizeHandler); document.removeEventListener('visibilitychange', this.visibilityHandler); }
  makeCloud(seed) {
    // Overlapping masses, a broken edge, and a lit shoulder give the cloud volume.
    const w = 384, h = 144, canvas = surface(w, h), c = canvas.getContext('2d'), pixels = c.createImageData(w, h);
    const R = random(seed), masses = Array.from({ length: 7 }, (_, i) => ({ x: .13 + i * .12, y: .50 + (R() - .5) * .23, rx: .105 + R() * .10, ry: .13 + R() * .13 }));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const nx = x / w, ny = y / h;
      let envelope = 0;
      for (const m of masses) envelope = Math.max(envelope, Math.exp(-(((nx - m.x) / m.rx) ** 2 + ((ny - m.y) / m.ry) ** 2) * 1.45));
      const detail = fbm(nx * 14, ny * 7, seed);
      const edge = smooth(clamp(nx / .095)) * smooth(clamp((1 - nx) / .095))
        * smooth(clamp(ny / .085)) * smooth(clamp((1 - ny) / .085));
      const density = smooth(clamp((envelope - .15 + (detail - .5) * .22) * 2.45)) * edge;
      const shoulder = noise(nx * 7, ny * 4, seed + 3);
      const upper = clamp(1.38 - ny * 1.55 + (shoulder - .5) * .42);
      const i = (y * w + x) * 4; pixels.data[i] = Math.round(upper * 255); pixels.data[i + 1] = pixels.data[i]; pixels.data[i + 2] = pixels.data[i]; pixels.data[i + 3] = Math.round(density * 255);
    }
    c.putImageData(pixels, 0, 0); return canvas;
  }
  buildScene() {
    const p = PALETTES[this.theme], w = this.w, h = this.h;
    this.palette = { ...p };
    if (this.theme === 'dawn') { this.palette.sunY = mix(.53, .38, this.progress); this.palette.night = .28 * (1 - this.progress); }
    this.sun = { x: w * p.sunX, y: h * this.palette.sunY, radius: Math.max(13, Math.min(w, h) * (p.night > .8 ? .022 : .028)) };
    this.moon = null;
    if (p.night > .8) {
      const r = this.sun.radius, moon = surface(r * 2 + 4, r * 2 + 4), m = moon.getContext('2d');
      m.fillStyle = rgb(p.light); m.beginPath(); m.arc(r + 2, r + 2, r, 0, TAU); m.fill();
      m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.arc(r + r * .48 + 2, r - r * .19 + 2, r * .99, 0, TAU); m.fill(); this.moon = moon;
    }
    this.backdrop = surface(w * this.dpr, h * this.dpr); const b = this.backdrop.getContext('2d'); b.scale(this.dpr, this.dpr);
    this.paintSky(b); this.paintMountains(b);
    this.ground = surface(w * this.dpr, h * this.dpr); const g = this.ground.getContext('2d'); g.scale(this.dpr, this.dpr);
    this.paintGround(g);
    this.clouds = this.cloudModels.map((model, i) => {
      const c = surface(model.width, model.height), cc = c.getContext('2d'); cc.drawImage(model, 0, 0); const data = cc.getImageData(0, 0, c.width, c.height);
      const daylight = clamp(1 - p.night * 1.25);
      const light = lerpColor(lerpColor(p.haze, p.light, .38), [252, 249, 234], daylight * .88);
      const shade = lerpColor(lerpColor(p.middle, p.top, .28), [110, 133, 157], daylight * .78);
      for (let j = 0; j < data.data.length; j += 4) { const z = data.data[j] / 255; const col = lerpColor(shade, light, clamp(z * .95)); data.data[j] = col[0]; data.data[j + 1] = col[1]; data.data[j + 2] = col[2]; }
      cc.putImageData(data, 0, 0); return { image: c, x: [-.10, .27, .72, .40][i], y: [.30, .20, .35, .43][i], width: [.56, .48, .45, .34][i], opacity: [.94, .90, .91, .58][i] * (p.night > .8 ? .51 : 1) };
    });
    const r = random(this.seed + 249);
    this.birds = Array.from({ length: this.theme === 'birds' ? 20 : 9 }, (_, i) => ({ x: .08 + r() * .9, y: .30 + r() * .19, size: 2 + r() * 4, phase: r() * TAU, speed: .004 + r() * .004, group: i % 3 }));
  }
  paintSky(c) {
    const p = this.palette, w = this.w, h = this.h;
    const g = c.createLinearGradient(0, 0, 0, this.horizon + 10); g.addColorStop(0, rgb(p.top)); g.addColorStop(.52, rgb(p.middle)); g.addColorStop(1, rgb(p.haze)); c.fillStyle = g; c.fillRect(0, 0, w, h);
    glow(c, this.sun.x, this.sun.y, h * .62, p.light, p.night > .8 ? .08 : .18);
    // Extremely soft vertical shafts through distant haze.
    c.save(); c.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) { const beam = c.createLinearGradient(this.sun.x, this.sun.y, this.sun.x + w * .3, h * .63); beam.addColorStop(0, rgba(p.light, .018)); beam.addColorStop(1, rgba(p.light, 0)); c.fillStyle = beam; c.beginPath(); c.moveTo(this.sun.x, this.sun.y); c.lineTo(w * (.44 + i * .19), h * .64); c.lineTo(w * (.49 + i * .19), h * .64); c.closePath(); c.fill(); }
    c.restore();
    if (p.night > .4) {
      const r = random(1967);
      for (let i = 0; i < 3400; i++) { const x = r() * w, yy = h * (.18 + x / w * .10) + (r() + r() + r() - 1.5) * h * .14; c.fillStyle = rgba([191, 203, 216], .009 + r() * .025 * p.night); c.fillRect(x, yy, .6 + r() * 1.5, .6 + r()); }
    }
  }
  ridgeY(x, layer) {
    const n = x / this.w;
    const high = this.theme === 'watchers' || this.theme === 'desert';
    const amplitude = (high ? .19 : .10) * (1 - layer * .15);
    const mountain = fbm(n * 5.6 + layer * 3, .6, this.seed % 991 + layer * 47);
    const valley = Math.exp(-(((n - .4) / .19) ** 2)) * .07;
    return this.h * (.53 + layer * .025 - mountain * amplitude + valley);
  }
  paintMountains(c) {
    const p = this.palette, w = this.w, h = this.h;
    for (let layer = 0; layer < 4; layer++) {
      const color = lerpColor(p.haze, p.near, .20 + layer * .14);
      const gradient = c.createLinearGradient(0, h * .35, 0, h * .63); gradient.addColorStop(0, rgb(color)); gradient.addColorStop(1, rgb(lerpColor(color, p.haze, .25)));
      c.beginPath(); c.moveTo(0, h * .66); for (let x = 0; x <= w + 6; x += 6) c.lineTo(x, this.ridgeY(x, layer)); c.lineTo(w, h * .66); c.closePath(); c.fillStyle = gradient; c.fill();
      c.save(); c.clip();
      // Low-contrast folds follow the mountain instead of regular triangles.
      const R = random(this.seed + layer * 38);
      for (let j = 0; j < 55; j++) { const x = R() * w, y = this.ridgeY(x, layer); c.beginPath(); c.moveTo(x, y - 1); c.bezierCurveTo(x - w * .015, y + h * .03, x + w * .03, y + h * .05, x + w * .04, h * .63); c.strokeStyle = rgba(lerpColor(color, p.haze, .3), .10); c.lineWidth = 3 + R() * 12; c.stroke(); }
      c.restore();
      if (layer === 2) {
        const R2 = random(983 + this.seed); for (let i = 0; i < 170; i++) { const x = R2() * w; if (x < w * .48) continue; const y = this.ridgeY(x, layer), height = (2 + R2() * 7) * this.unit; this.pine(c, x, y + 1, height, color, R2, false); }
      }
    }
    const fog = c.createLinearGradient(0, h * .49, 0, h * .57); fog.addColorStop(0, rgba(p.haze, 0)); fog.addColorStop(.7, rgba(p.haze, .18)); fog.addColorStop(1, rgba(p.haze, 0)); c.fillStyle = fog; c.fillRect(0, h * .49, w, h * .08);
  }
  coastX(y) {
    const t = clamp((y - this.horizon) / (this.h - this.horizon));
    return this.w * (.925 - .43 * t - .115 * Math.sin(t * 4.8) + .022 * Math.sin(t * 13));
  }
  nearY(x) { return this.h * (.61 + .10 * Math.sin(x / this.w * 4.2 + .25)) + (1 - x / this.w) * this.h * .08; }
  landPath(c) {
    c.beginPath(); c.moveTo(this.w, this.horizon - this.h * .012); c.lineTo(this.coastX(this.horizon), this.horizon);
    for (let y = this.horizon; y <= this.h + 5; y += 5) c.lineTo(this.coastX(y), y);
    c.lineTo(this.w, this.h + 5); c.closePath();
  }
  paintGround(c) {
    const w = this.w, h = this.h, p = this.palette, R = random(this.seed + 388);
    this.landPath(c); const ground = c.createLinearGradient(0, this.horizon, 0, h); ground.addColorStop(0, rgb(lerpColor(p.grass, p.haze, .24))); ground.addColorStop(.3, rgb(p.grass)); ground.addColorStop(1, rgb(lerpColor(p.grass, [3, 13, 18], p.night > .6 ? .50 : .30))); c.fillStyle = ground; c.fill();
    c.save(); this.landPath(c); c.clip();
    // Broad undulations: patches of warm earth, shadowed turf and light.
    for (let i = 0; i < 46; i++) { const y = h * (.58 + R() * .49), x = this.coastX(y) + R() * w * .5, radius = (25 + R() * 110) * Math.max(.65, this.unit); c.save(); c.translate(x, y); c.scale(1, .28); glow(c, 0, 0, radius, i % 3 ? p.earth : [9, 24, 28], i % 3 ? .16 : .35); c.restore(); }
    // The path is on the land, narrowing toward the distant settlement.
    if (['temple', 'city', 'tower', 'birds', 'wisdom'].includes(this.theme)) {
      c.beginPath(); c.moveTo(w * .79, h * .62); c.bezierCurveTo(w * .63, h * .76, w * .90, h * .83, w * .69, h * 1.05); c.strokeStyle = rgba(lerpColor(p.earth, p.light, .12), .5); c.lineWidth = w * .018; c.stroke();
      c.beginPath(); c.moveTo(w * .79, h * .62); c.bezierCurveTo(w * .68, h * .76, w * .91, h * .83, w * .69, h * 1.05); c.strokeStyle = rgba(p.earth, .3); c.lineWidth = w * .006; c.stroke();
    }
    // Fine stippled soil and individually leaning grass, deterministic per book.
    const density = this.theme === 'desert' ? 650 : 2800;
    for (let i = 0; i < density; i++) {
      const y = mix(this.horizon, h, R() ** .68), x = this.coastX(y) + R() * (w - this.coastX(y)), depth = (y - this.horizon) / (h - this.horizon);
      const height = (1.5 + R() * 6) * (.3 + depth * 1.8) * Math.max(.45, this.unit);
      const lit = R(), col = lerpColor(p.grass, lit > .45 ? p.haze : p.near, lit > .45 ? .10 + lit * .18 : .3);
      c.strokeStyle = rgba(col, .4 + R() * .45); c.lineWidth = .45 + depth * .6; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - height * .18, y - height * .6, x + (R() - .5) * height, y - height); c.stroke();
      if (i % 3 === 0) { c.fillStyle = rgba(p.earth, .30); c.fillRect(x, y, 1 + depth * 2, .6); }
    }
    // Pebbles glint only on the lit upper edges.
    for (let i = 0; i < 110; i++) { const y = h * (.62 + R() * .43), x = this.coastX(y) + R() * (w - this.coastX(y)); const s = (1 + R() ** 3 * 14) * this.unit * ((y / h - .5) * 2); this.rock(c, x, y, Math.max(1, s), p, R); }
    c.restore();
    // Shoreline: wet dark stone, two thin interrupted pale edges.
    c.beginPath(); for (let y = this.horizon + 4; y < h; y += 3) { const x = this.coastX(y); y === this.horizon + 4 ? c.moveTo(x, y) : c.lineTo(x, y); } c.strokeStyle = rgba(p.near, .9); c.lineWidth = 4 * this.unit; c.stroke();
    c.beginPath(); for (let y = this.horizon + 4; y < h; y += 4) { const x = this.coastX(y) - 2 + Math.sin(y * .08); y === this.horizon + 4 ? c.moveTo(x, y) : c.lineTo(x, y); } c.strokeStyle = rgba(p.haze, .2); c.lineWidth = .9; c.stroke();
    // Far vegetation first; near vegetation and actors naturally occlude it.
    const trees = [];
    if (this.theme !== 'desert') {
      for (let i = 0; i < 27; i++) { const y = h * (.565 + R() * .08), x = Math.max(this.coastX(y) + 12, w * .66 + R() * w * .35); trees.push({ x, y, size: (15 + R() * 30) * this.unit }); }
      const count = ['garden', 'wisdom'].includes(this.theme) ? 13 : this.theme === 'watchers' ? 8 : 6;
      for (let i = 0; i < count; i++) { const y = h * (.67 + R() * .28), x = this.coastX(y) + w * (.04 + R() * .26); trees.push({ x, y, size: (55 + R() * 105) * this.unit * (.75 + (y / h - .65)) }); }
      // One composed, old tree gives the near bank a recognizable silhouette.
      trees.push(this.mobile
        ? { x: w * .80, y: h * .735, size: Math.min(h * .205, w * .45) }
        : { x: w * .88, y: h * .79, size: Math.min(h * .31, w * .29) });
      if (this.mobile) trees.push({ x: w * .94, y: h * .69, size: h * .115 });
      trees.sort((a, b) => a.y - b.y);
      for (const t of trees) { if (t.x > w + t.size * .2) continue; const type = p.trees; if (type === 'cedar' || type === 'cypress') this.pine(c, t.x, t.y, t.size, p.grass, R, true, type === 'cypress'); else this.tree(c, t.x, t.y, t.size, p, R, type); }
    } else {
      this.rock(c, w * .82, h * .71, 74 * this.unit, p, R); this.tree(c, w * .91, h * .85, 120 * this.unit, p, R, 'bare');
      // A shadowed cave cut into the near outcrop.
      c.fillStyle = rgb(lerpColor(p.near, [3, 9, 13], .7)); c.beginPath(); c.ellipse(w * .808, h * .704, 15 * this.unit, 26 * this.unit, -.10, Math.PI, TAU); c.lineTo(w * .827, h * .709); c.closePath(); c.fill();
    }
    this.flowers = [];
    if (['garden', 'dawn', 'birds', 'wisdom'].includes(this.theme)) {
      const flowerCount = 60 + Math.round(this.progress * 110);
      for (let i = 0; i < flowerCount; i++) { const y = h * (.64 + R() * .37), x = this.coastX(y) + R() * (w - this.coastX(y)); const size = (1 + R() * 2.3) * this.unit; this.flower(c, x, y, size, i, p); if (i % 8 === 0) this.flowers.push({ x, y, size }); }
    }
    const buildingX = w * (this.mobile ? .73 : .755), buildingY = h * .64;
    if (['temple', 'city', 'tower'].includes(this.theme)) {
      // Flat terraces underpin each structure; nothing floats in the sky.
      c.fillStyle = rgb(lerpColor(p.earth, p.haze, .2)); c.beginPath(); c.moveTo(buildingX - w * .14, buildingY + 8); c.lineTo(buildingX - w * .10, buildingY - 3); c.lineTo(buildingX + w * .19, buildingY - 3); c.lineTo(buildingX + w * .22, buildingY + h * .04); c.closePath(); c.fill();
      if (this.theme === 'tower') this.tower(c, buildingX, buildingY, Math.min(w * .13, h * .18), p);
      else if (this.theme === 'city') this.city(c, buildingX, buildingY, Math.min(w * .28, h * .38), p, R);
      else this.temple(c, buildingX, buildingY, Math.min(w * .23, h * .27), p);
    }
    this.people = [{ x: w * .71, y: h * (this.mobile ? .729 : .76), size: this.mobile ? 29 : 28 * Math.max(.65, this.unit), robe: [168, 132, 95] }];
    if (this.theme === 'river') this.people.push({ x: w * .728, y: h * .753, size: 29 * Math.max(.65, this.unit), robe: [134, 159, 166] });
    if (this.theme === 'birds') this.people[0] = { x: w * .73, y: h * (this.mobile ? .729 : .762), size: this.mobile ? 25 : 23 * Math.max(.65, this.unit), robe: [196, 159, 112] };
  }
  rock(c, x, y, s, p, R) {
    c.fillStyle = rgb(lerpColor(p.earth, p.near, .34)); c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * .82, y - s * .42); c.lineTo(x - s * .32, y - s * .74); c.lineTo(x + s * .43, y - s * .65); c.lineTo(x + s, y - s * .17); c.lineTo(x + s * .72, y + s * .13); c.closePath(); c.fill();
    c.fillStyle = rgba(lerpColor(p.earth, p.haze, .35), .7); c.beginPath(); c.moveTo(x - s * .80, y - s * .42); c.lineTo(x - s * .32, y - s * .74); c.lineTo(x + s * .43, y - s * .65); c.lineTo(x + s * .15, y - s * .38); c.closePath(); c.fill();
  }
  pine(c, x, y, h, color, R, detailed = false, narrow = false) {
    const p = this.palette, width = h * (narrow ? .15 : .37);
    c.fillStyle = rgb(lerpColor(p.earth, p.near, .5)); c.fillRect(x - h * .025, y - h * .8, h * .05, h * .8);
    c.beginPath(); c.moveTo(x, y - h);
    for (let i = 1; i <= 13; i++) { const t = i / 13; c.lineTo(x + width * t * (.6 + R() * .4), y - h + h * t * .93); c.lineTo(x + width * t * .45, y - h + h * t * .87); }
    c.lineTo(x, y - h * .04);
    for (let i = 13; i > 0; i--) { const t = i / 13; c.lineTo(x - width * t * (.6 + R() * .4), y - h + h * t * .93); c.lineTo(x - width * t * .45, y - h + h * t * .87); }
    c.closePath(); c.fillStyle = rgb(lerpColor(color, p.near, detailed ? .30 : .05)); c.fill();
    if (detailed) for (let i = 1; i < 11; i++) { const t = i / 11; line(c, x - width * t * .75, y - h + h * t * .9, x + width * t * .28, y - h + h * t * .93, rgba(lerpColor(color, p.haze, .28), .35), Math.max(.6, h * .012)); }
  }
  tree(c, x, y, size, p, R, kind) {
    const tw = size * .034, tips = [], limbColor = lerpColor(p.earth, [44, 36, 31], .5);
    c.save(); c.lineCap = 'round';
    // Thick gnarled trunk with limbs tapering independently.
    const branch = (sx, sy, length, angle, width, depth) => {
      const ex = sx + Math.cos(angle) * length, ey = sy + Math.sin(angle) * length;
      c.strokeStyle = rgb(limbColor); c.lineWidth = width; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + Math.cos(angle + .15) * length * .45, sy + Math.sin(angle) * length * .55, ex, ey); c.stroke();
      if (width > size * .008) { c.strokeStyle = rgba(lerpColor(limbColor, p.haze, .35), .7); c.lineWidth = Math.max(.5, width * .19); c.stroke(); }
      if (depth > 0) { branch(ex, ey, length * (.64 + R() * .13), angle - .37 - R() * .35, width * .63, depth - 1); branch(ex, ey, length * (.61 + R() * .18), angle + .36 + R() * .38, width * .57, depth - 1); } else tips.push({ x: ex, y: ey });
    };
    branch(x, y, size * .40, -Math.PI / 2 + (R() - .5) * .2, tw, 3);
    if (kind !== 'bare') {
      const leaf = this.theme === 'garden' ? [74, 124, 54] : kind === 'olive' ? [105, 126, 91] : p.grass;
      // Crowns made of overlapping irregular lobes with dark undersides and sunlit shoulders.
      for (const tip of tips.sort((a, b) => a.y - b.y)) {
        const radius = size * (.08 + R() * .055);
        const lobes = 7 + Math.floor(R() * 5);
        c.beginPath();
        for (let i = 0; i <= 28; i++) { const angle = i / 28 * TAU, rr = radius * (.79 + noise(Math.cos(angle) * 2 + 5, Math.sin(angle) * 2 + 5, Math.floor(tip.x)) * .42); const xx = tip.x + Math.cos(angle) * rr * 1.25, yy = tip.y + Math.sin(angle) * rr * .85; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
        c.closePath(); const cg = c.createLinearGradient(0, tip.y - radius, 0, tip.y + radius); cg.addColorStop(0, rgb(lerpColor(leaf, p.haze, .19))); cg.addColorStop(.48, rgb(lerpColor(leaf, p.near, p.night * .25))); cg.addColorStop(1, rgb(lerpColor(leaf, p.near, .48))); c.fillStyle = cg; c.fill();
        for (let j = 0; j < lobes; j++) { const a = R() * TAU, rr = Math.sqrt(R()) * radius * .78, xx = tip.x + Math.cos(a) * rr * 1.14, yy = tip.y + Math.sin(a) * rr * .7, sr = radius * (.14 + R() * .24); c.fillStyle = rgba(lerpColor(leaf, p.haze, .18 + R() * .16), .34); c.beginPath(); c.ellipse(xx - sr * .15, yy - sr * .18, sr, sr * .68, R(), 0, TAU); c.fill(); }
        if (kind === 'willow') { c.strokeStyle = rgba(leaf, .58); c.lineWidth = .7; for (let j = 0; j < 6; j++) { const xx = tip.x + (R() - .5) * radius * 2; c.beginPath(); c.moveTo(xx, tip.y); c.quadraticCurveTo(xx + size * .045, tip.y + size * .12, xx + size * .016, tip.y + size * .25); c.stroke(); } }
        if (this.theme === 'garden' && R() > .35) { c.fillStyle = rgba([198, 130, 70], .65); c.beginPath(); c.arc(tip.x + radius * .4, tip.y + radius * .5, Math.max(1.2, size * .012), 0, TAU); c.fill(); }
      }
    }
    c.restore();
  }
  flower(c, x, y, s, i, p) {
    const colors = [[221, 205, 151], [225, 190, 182], [170, 173, 210], [216, 225, 209]], col = lerpColor(colors[i % 4], p.grass, p.night * .6);
    line(c, x, y, x + s * .4, y - s * 3, rgba(p.grass, .8), .6);
    for (let j = 0; j < 5; j++) { const a = j / 5 * TAU; c.fillStyle = rgba(col, .80); c.beginPath(); c.ellipse(x + s * .4 + Math.cos(a) * s * .6, y - s * 3 + Math.sin(a) * s * .6, s * .55, s * .85, a + Math.PI / 2, 0, TAU); c.fill(); }
    c.fillStyle = rgba(p.light, .7); c.beginPath(); c.arc(x + s * .4, y - s * 3, s * .35, 0, TAU); c.fill();
  }
  temple(c, x, y, s, p) {
    const stone = lerpColor(p.earth, p.haze, .50), shade = lerpColor(stone, p.near, .34);
    for (let i = 0; i < 4; i++) { c.fillStyle = rgb(lerpColor(stone, p.near, i * .05)); c.fillRect(x - s * (.55 - i * .022), y - i * s * .027, s * (1.1 - i * .044), s * .027); }
    c.fillStyle = rgb(shade); c.fillRect(x - s * .45, y - s * .46, s * .90, s * .40);
    c.fillStyle = rgb(lerpColor(shade, p.near, .55)); c.fillRect(x - s * .12, y - s * .37, s * .24, s * .30);
    for (let i = 0; i < 6; i++) { const xx = x + (i / 5 - .5) * s * .84, g = c.createLinearGradient(xx - s * .023, 0, xx + s * .023, 0); g.addColorStop(0, rgb(stone)); g.addColorStop(1, rgb(shade)); c.fillStyle = g; c.fillRect(xx - s * .025, y - s * .47, s * .05, s * .40); c.fillStyle = rgb(stone); c.fillRect(xx - s * .036, y - s * .49, s * .072, s * .025); }
    c.fillStyle = rgb(stone); c.beginPath(); c.moveTo(x - s * .54, y - s * .48); c.lineTo(x, y - s * .74); c.lineTo(x + s * .54, y - s * .48); c.closePath(); c.fill();
    c.strokeStyle = rgb(shade); c.lineWidth = 2; c.stroke(); line(c, x - s * .52, y - s * .47, x + s * .52, y - s * .47, rgba(p.light, .3), 1);
  }
  tower(c, x, y, s, p) {
    const rows = 4 + Math.round(this.progress * 5), stone = lerpColor(p.earth, p.haze, .38);
    c.fillStyle = rgb(stone); c.fillRect(x - s * .33, y - s * rows * .09, s * .66, s * rows * .09);
    for (let row = 0; row < rows; row++) {
      const yy = y - row * s * .09; line(c, x - s * .33, yy, x + s * .33, yy, rgba(p.near, .52), 1);
      for (let k = 0; k < 4; k++) line(c, x - s * .33 + ((k + row % 2 * .5) / 4) * s * .66, yy, x - s * .33 + ((k + row % 2 * .5) / 4) * s * .66, yy - s * .09, rgba(p.near, .35), .7);
      if (row % 2) { c.fillStyle = rgb(p.near); c.fillRect(x - s * .045, yy - s * .05, s * .09, s * .12); if (row < 1 + this.progress * 7) { c.fillStyle = rgba(p.light, .7); c.fillRect(x - s * .028, yy - s * .035, s * .056, s * .09); } }
    }
    c.fillStyle = rgb(lerpColor(stone, p.near, .25)); c.fillRect(x + s * .28, y - s * rows * .09, s * .1, s * rows * .09);
    for (let i = 0; i < 5; i++) { c.fillStyle = rgb(stone); c.fillRect(x - s * .36 + i * s * .15, y - s * rows * .09 - s * .08, s * .09, s * .10); }
  }
  city(c, x, y, s, p, R) {
    const stone = lerpColor(p.earth, p.haze, .3);
    for (let i = 0; i < 22; i++) {
      const xx = x + (i / 22 - .5) * s, hh = s * (.10 + R() * .25), ww = s * (.035 + R() * .045);
      c.fillStyle = rgb(lerpColor(stone, p.near, R() * .3)); c.fillRect(xx, y - hh, ww, hh);
      c.fillStyle = rgb(stone); c.fillRect(xx - 1, y - hh - 2, ww + 2, 3);
      for (let j = 0; j < 3; j++) { c.fillStyle = rgba(p.light, .16 + this.progress * .5); c.fillRect(xx + ww * .4, y - hh + 6 + j * 10, Math.max(1.1, s * .005), Math.max(2, s * .009)); }
    }
    c.fillStyle = rgb(lerpColor(stone, p.near, .08)); c.fillRect(x - s * .56, y - s * .12, s * 1.12, s * .12);
    for (let i = 0; i < 23; i++) c.fillRect(x - s * .56 + i * s * .05, y - s * .145, s * .028, s * .027);
    c.fillStyle = rgb(p.near); c.beginPath(); c.arc(x, y - s * .035, s * .044, Math.PI, 0); c.lineTo(x + s * .044, y); c.lineTo(x - s * .044, y); c.fill();
  }
  draw() {
    if (!this.ctx || !this.w || this.destroyed) return;
    const c = this.ctx, w = this.w, h = this.h, p = this.palette;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, w, h);
    c.drawImage(this.backdrop, 0, 0, w, h);
    this.drawStars(c); this.drawSun(c); this.drawClouds(c); this.drawWater(c);
    c.drawImage(this.ground, 0, 0, w, h);
    this.drawLife(c); this.drawEvents(c); this.drawSpirit(c);
    // A gentle lens falloff, never an opaque overlay hiding the landscape.
    const vignette = c.createRadialGradient(w * .5, h * .45, h * .12, w * .5, h * .45, Math.max(w * .65, h * .73)); vignette.addColorStop(0, 'rgba(3,8,17,0)'); vignette.addColorStop(.66, 'rgba(3,8,17,.015)'); vignette.addColorStop(1, rgba([3, 8, 17], this.context.landing ? .39 : .27)); c.fillStyle = vignette; c.fillRect(0, 0, w, h);
    if (this.snapshot && this.transition < 1) { c.save(); c.globalAlpha = 1 - smooth(this.transition); c.drawImage(this.snapshot, 0, 0, w, h); c.restore(); }
  }
  drawStars(c) {
    const amount = this.palette.night ** 2;
    if (amount < .03) return;
    for (const s of this.stars) {
      if (s.y * this.h > this.ridgeY(s.x * this.w, 0) - 3) continue;
      const opacity = s.a * amount * (.75 + Math.sin(this.time * .6 + s.phase) * .2) * clamp((.53 - s.y) * 4);
      c.fillStyle = rgba([225, 225, 211], opacity); c.beginPath(); c.arc(s.x * this.w, s.y * this.h, s.r, 0, TAU); c.fill();
      if (s.r > 1.25) glow(c, s.x * this.w, s.y * this.h, 7, this.palette.light, .12 * amount);
    }
  }
  drawSun(c) {
    const s = this.sun, p = this.palette;
    glow(c, s.x, s.y, s.radius * (p.night > .8 ? 5.2 : 11), p.light, p.night > .8 ? .19 : .30);
    if (p.night < .6) { glow(c, s.x, s.y, s.radius * 4.4, [255, 249, 220], .40); glow(c, s.x, s.y, s.radius * 1.8, [255, 253, 238], .25); }
    if (this.moon) c.drawImage(this.moon, s.x - s.radius - 2, s.y - s.radius - 2);
    else { c.fillStyle = rgb(lerpColor(p.light, [255, 255, 247], .88)); c.beginPath(); c.arc(s.x, s.y, s.radius, 0, TAU); c.fill(); }
  }
  drawClouds(c) {
    const w = this.w, h = this.h;
    for (const cloud of this.clouds) {
      const drift = this.reduced ? 0 : Math.sin(this.time * .012 + cloud.x * 3) * w * .022;
      const cw = w * cloud.width, ch = cw * .23;
      c.save(); c.globalAlpha = cloud.opacity; c.drawImage(cloud.image, w * cloud.x + drift, h * cloud.y - ch * .45, cw, ch); c.restore();
    }
    // Almost transparent lake mist moves independently from the clouds.
    c.save(); c.globalAlpha = .075; c.drawImage(this.clouds[0].image, -this.w * .10 + Math.sin(this.time * .02) * 12, this.horizon - 9, this.w * 1.1, this.h * .11); c.restore();
  }
  drawWater(c) {
    const p = this.palette, w = this.w, h = this.h, hz = this.horizon, depth = h - hz;
    const water = c.createLinearGradient(0, hz, 0, h); water.addColorStop(0, rgb(lerpColor(p.water, p.haze, .40))); water.addColorStop(.17, rgb(p.water)); water.addColorStop(1, rgb(p.near)); c.fillStyle = water; c.fillRect(0, hz, w, depth);
    // Broad rippling bands reflect the bright sky, interleaved with dark troughs.
    for (let i = 0; i < 85; i++) {
      const z = (i / 84) ** 1.75, yy = hz + z * depth;
      const wave = Math.sin(i * 1.71 + this.time * .39) * .5 + .5;
      const bh = .55 + z * 5.2, offset = Math.sin(i * 2.47 + this.time * .10) * w * .18;
      const band = c.createLinearGradient(-w * .2 + offset, 0, w * .93 + offset, 0);
      band.addColorStop(0, rgba(p.haze, .006)); band.addColorStop(.30, rgba(p.haze, .018 + wave * .060)); band.addColorStop(.7, rgba(p.haze, .026 + wave * .03)); band.addColorStop(1, rgba(p.haze, 0));
      c.fillStyle = band; c.fillRect(0, yy, w, bh);
    }
    // A connected column of fragmented light travels from horizon to near water.
    const daylight = 1 - p.night * .57;
    for (let i = 0; i < 165; i++) {
      const z = (i / 164) ** 1.8, yy = hz + z * depth;
      const t = this.time * (.46 + z * .9), n = noise(i * .83, t * .25, 91);
      const width = (1.5 + z * w * .11) * (.12 + n * .83);
      const center = this.sun.x + Math.sin(i * 1.87 + t) * w * (.002 + z * .042);
      const alpha = (.22 + Math.sin(i * .79 + t) ** 2 * .54) * daylight * (1 - z * .30);
      const shine = c.createLinearGradient(center - width, 0, center + width, 0);
      const color = lerpColor(p.light, [255, 255, 235], .53);
      shine.addColorStop(0, rgba(color, 0)); shine.addColorStop(.22, rgba(color, alpha * .55)); shine.addColorStop(.52, rgba(color, alpha)); shine.addColorStop(.79, rgba(color, alpha * .68)); shine.addColorStop(1, rgba(color, 0));
      c.fillStyle = shine; c.fillRect(center - width, yy, width * 2, .45 + z * 2.3);
    }
    // The reflection widens toward the eye and fragments along moving ripples.
    for (const a of this.waves) {
      const z = a.y ** 1.8, y = hz + z * depth;
      const x = a.x * w + Math.sin(this.time * a.speed + a.phase) * (1 + z * 6), len = (.8 + z * 35) * a.length;
      const wobble = Math.sin(this.time * .7 + a.phase + z * 22) * z * w * .035;
      const beamWidth = w * (.007 + z * .11), reflection = Math.exp(-(((x - this.sun.x - wobble) / beamWidth) ** 2) * 1.4);
      const shine = reflection * (.2 + (Math.sin(a.phase + this.time * 1.15) + 1) * .25) * (1 - z * .23);
      c.strokeStyle = rgba(shine > .1 ? p.light : lerpColor(p.water, p.haze, .42), shine > .1 ? shine * (.65 + this.charge * .15) : (.02 + z * .09)); c.lineWidth = .35 + z * 1.5; c.beginPath(); c.moveTo(x - len * .5, y); c.quadraticCurveTo(x, y + Math.sin(a.phase + this.time) * z, x + len * .5, y); c.stroke();
    }
    line(c, 0, hz, w, hz, rgba(p.haze, .18), .7);
    // Subtle reflections of the tree-lined shore.
    for (let i = 0; i < 50; i++) { const yy = hz + (i / 50) ** 1.3 * depth, xx = this.coastX(yy), len = 4 + i * .34; line(c, xx - len - 1, yy, xx, yy, rgba(p.grass, .20), 1 + i / 40); }
  }
  drawLife(c) {
    const p = this.palette, w = this.w, h = this.h;
    // Two independently moving flocks, lit by the same sky.
    for (const b of this.birds) {
      const lifted = this.theme === 'birds' ? this.progress * .10 + this.event * .03 : 0;
      const x = ((b.x + this.time * b.speed) % 1.25 - .08) * w;
      const y = h * (b.y - lifted) + Math.sin(this.time * .35 + b.phase) * h * .012;
      const size = b.size * Math.max(.65, this.unit), flap = Math.sin(this.time * 3.4 + b.phase) * .7;
      c.strokeStyle = rgba(lerpColor(p.near, p.haze, b.group === 0 ? .12 : .48), .72); c.lineWidth = Math.max(.6, size * .15); c.beginPath(); c.moveTo(x - size, y - size * (.35 + flap)); c.quadraticCurveTo(x - size * .36, y - size * .34, x, y); c.quadraticCurveTo(x + size * .35, y - size * .34, x + size, y - size * (.35 + flap)); c.stroke();
    }
    for (const person of this.people) this.person(c, person.x, person.y, person.size, person.robe);
    if (['garden', 'dawn', 'river'].includes(this.theme)) {
      const count = this.mobile ? 2 : 5;
      for (let i = 0; i < count; i++) {
        const x = w * (this.mobile ? .77 + i * .11 : .745 + i * .036);
        const y = h * (this.mobile ? .704 + i % 2 * .023 : .828 + Math.sin(i * 2) * .018);
        this.animal(c, x, y, this.mobile ? 15 : (18 + i % 2 * 3) * Math.max(.72, this.unit), i === count - 1 ? 'deer' : 'sheep', i);
      }
    }
    // Soft reeds and their moving tips on the closest bank.
    if (['river', 'garden', 'birds'].includes(this.theme)) {
      const baseY = h * .92, baseX = this.coastX(baseY) + w * .015;
      for (let i = 0; i < 17; i++) { const xx = baseX + Math.sin(i * 7.3) * 25 * this.unit, hh = (17 + noise(i) * 37) * this.unit; c.strokeStyle = rgba(lerpColor(p.grass, p.haze, .2), .7); c.lineWidth = 1; c.beginPath(); c.moveTo(xx, baseY + i % 3 * 3); c.quadraticCurveTo(xx + 3, baseY - hh * .55, xx + Math.sin(this.time * .9 + i * .4) * 4 * this.unit, baseY - hh); c.stroke(); }
    }
    if (this.theme === 'river') {
      for (let i = 0; i < 3; i++) { const x = w * (.41 + i * .1) + Math.sin(this.time * .22 + i * 2) * w * .035, y = h * (.70 + i * .045), s = (5 + i) * this.unit; c.fillStyle = rgba(p.near, .42); c.beginPath(); c.ellipse(x, y, s * 1.4, s * .38, -.1, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 2, y - s * .55); c.lineTo(x - s * 2, y + s * .4); c.fill(); }
    }
  }
  person(c, x, y, s, robe) {
    const p = this.palette, dark = lerpColor(robe, p.near, p.night * .68 + .08);
    c.save(); c.fillStyle = rgba(p.near, .28); c.beginPath(); c.ellipse(x + s * .2, y + 1, s * .42, s * .07, .1, 0, TAU); c.fill();
    c.fillStyle = rgb(lerpColor([187, 152, 113], p.near, p.night * .56)); c.beginPath(); c.ellipse(x, y - s * .87, s * .095, s * .12, 0, 0, TAU); c.fill();
    c.fillStyle = rgb(dark); c.beginPath(); c.moveTo(x - s * .095, y - s * .76); c.quadraticCurveTo(x - s * .10, y - s * .35, x - s * .19, y - s * .07); c.quadraticCurveTo(x, y - s * .025, x + s * .17, y - s * .065); c.lineTo(x + s * .1, y - s * .74); c.closePath(); c.fill();
    line(c, x - s * .08, y - s * .7, x - s * .22, y - s * .4, rgb(dark), s * .06); line(c, x + s * .08, y - s * .7, x + s * .17, y - s * .43, rgb(dark), s * .055);
    line(c, x - s * .03, y - s * .07, x - s * .09, y, rgb(p.near), s * .045); line(c, x + s * .06, y - s * .07, x + s * .11, y, rgb(p.near), s * .045);
    line(c, x - s * .065, y - s * .72, x - s * .145, y - s * .13, rgba(p.light, .24), .7); c.restore();
  }
  animal(c, x, y, s, kind, seed) {
    const p = this.palette, deer = kind === 'deer', coat = deer ? [157, 116, 70] : [221, 217, 190];
    const color = lerpColor(coat, p.near, p.night * .48), shade = lerpColor(color, p.earth, .36);
    const browse = this.reduced ? .4 : .35 + Math.sin(this.time * .6 + seed * 2) * .18;
    c.save();
    c.fillStyle = rgba(p.near, .24); c.beginPath(); c.ellipse(x, y + 1, s * .82, s * .09, 0, 0, TAU); c.fill();
    const leg = deer ? s * .61 : s * .34, bodyY = y - leg - s * .14;
    for (let i = 0; i < 4; i++) { const xx = x + (i < 2 ? -.38 : .37) * s + i % 2 * s * .12; line(c, xx, bodyY + s * .12, xx + (i % 2 ? .05 : -.04) * s, y, rgb(lerpColor(shade, p.near, .12)), deer ? s * .055 : s * .07); }
    const fur = c.createLinearGradient(0, bodyY - s * .3, 0, bodyY + s * .32); fur.addColorStop(0, rgb(lerpColor(color, p.light, .16))); fur.addColorStop(1, rgb(shade)); c.fillStyle = fur;
    c.beginPath(); c.ellipse(x, bodyY, s * .60, s * (deer ? .25 : .34), -.04, 0, TAU); c.fill();
    if (!deer) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.arc(x + Math.cos(a) * s * .43, bodyY + Math.sin(a) * s * .24, s * .15, 0, TAU); c.fill(); }
    const neckX = x + s * .47, neckY = bodyY - (deer ? s * .45 : s * .03) + browse * s * .4;
    line(c, x + s * .39, bodyY, neckX + s * .08, neckY, rgb(color), s * (deer ? .17 : .2));
    c.fillStyle = rgb(deer ? color : lerpColor(color, [104, 94, 77], .44)); c.beginPath(); c.ellipse(neckX + s * .14, neckY, s * .22, s * .13, browse * .5, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(neckX + s * .06, neckY - s * .12, s * .055, s * (deer ? .20 : .12), -.4, 0, TAU); c.fill();
    line(c, x - s * .55, bodyY - s * .07, x - s * .69, bodyY - s * .13 + Math.sin(this.time + seed) * s * .04, rgb(shade), s * .07);
    c.restore();
  }
  drawEvents(c) {
    const w = this.w, h = this.h, p = this.palette;
    if (this.theme === 'watchers' && !this.context.landing) {
      const amount = 4 + Math.round(this.progress * 9);
      for (let i = 0; i < amount; i++) {
        const phase = (i * .137 + (this.reduced ? 0 : this.time * .015)) % 1;
        const x = w * (.51 + noise(i * 2.7, 0, this.sceneSeed % 97) * .4), destination = this.ridgeY(x, 0) - 8;
        const y = mix(h * .11, destination, this.reduced ? .8 : phase);
        const opacity = Math.sin(phase * Math.PI) * .65;
        glow(c, x, y, 9 + this.event * 9, p.light, opacity * .5);
        const tail = c.createLinearGradient(0, y - 33, 0, y); tail.addColorStop(0, rgba(p.light, 0)); tail.addColorStop(1, rgba(p.light, opacity)); c.strokeStyle = tail; c.lineWidth = .7; c.beginPath(); c.moveTo(x - 3, y - 33); c.quadraticCurveTo(x - 1, y - 11, x, y); c.stroke(); c.fillStyle = rgba(p.light, opacity); c.beginPath(); c.arc(x, y, 1.25, 0, TAU); c.fill();
      }
    }
    if (this.palette.night > .15 || this.theme === 'garden') {
      for (const m of this.motes) {
        const x = w * (.55 + m.x * .4) + Math.sin(this.time * m.speed + m.phase) * 8, y = h * (.58 + m.y * .31) + Math.cos(this.time * .45 + m.phase) * 9;
        const alpha = Math.max(0, Math.sin(this.time * .65 + m.phase)) * .38 * (this.theme === 'garden' ? .7 : 1);
        glow(c, x, y, 5, [232, 214, 145], alpha); c.fillStyle = rgba([232, 218, 165], alpha); c.fillRect(x, y, 1.2, 1.2);
      }
    }
    if (this.event > 0 && !this.reduced) {
      const t = 1 - this.event;
      if (['river', 'wisdom', 'tower'].includes(this.theme)) {
        const x = w * .42, y = h * .73;
        for (let i = 0; i < 3; i++) { const radius = (8 + t * 95 + i * 17) * this.unit; c.beginPath(); c.ellipse(x, y, radius, radius * .16, 0, 0, TAU); c.strokeStyle = rgba(p.light, this.event * .22 * (1 - i * .2)); c.lineWidth = .8; c.stroke(); }
      }
      if (['garden', 'dawn', 'birds'].includes(this.theme)) for (const f of this.flowers || []) glow(c, f.x, f.y - f.size * 3, (5 + Math.sin(t * Math.PI) * 12) * this.unit, p.light, this.event * .28);
      const x = this.pointer.x > 0 ? this.pointer.x : w * .5, y = this.pointer.y > 0 ? this.pointer.y : h * .44;
      for (let i = 0; i < 28; i++) { const angle = i * 2.399, dist = (15 + t * (60 + i % 5 * 15)) * this.unit, xx = x + Math.cos(angle) * dist, yy = y + Math.sin(angle) * dist * .5 - t * 26; glow(c, xx, yy, 3, p.light, this.event * .16); }
    }
  }
  drawSpirit(c) {
    const sp = this.pointer, p = this.palette; if (sp.x < 0 || sp.y < 0 || sp.x > this.w || sp.y > this.h) return;
    for (let i = 0; i < this.trail.length; i += 2) { const t = this.trail[i]; glow(c, t.x, t.y, 12 * t.life, [173, 204, 236], t.life * .07); }
    glow(c, sp.x, sp.y, 32 + this.charge * 70, [189, 218, 244], .18 + this.charge * .14);
    glow(c, sp.x, sp.y, 8 + this.charge * 4, [232, 242, 249], .55);
    c.fillStyle = 'rgba(237,247,251,.9)'; c.beginPath(); c.arc(sp.x, sp.y, 1.5 + this.charge * .8, 0, TAU); c.fill();
    if (this.charge > 0) { c.beginPath(); c.arc(sp.x, sp.y, 19 + Math.sin(this.time * 3) * 1.5, -Math.PI / 2, -Math.PI / 2 + this.charge * TAU); c.strokeStyle = rgba(p.light, .55); c.lineWidth = .65; c.stroke(); }
  }
}

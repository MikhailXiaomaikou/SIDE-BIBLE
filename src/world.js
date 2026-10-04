// Original procedural landscape for SIDE BIBLE. No image assets or reference code.
const TAU = Math.PI * 2;
const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function rgb(hex) {
  const m = /^#([a-f\d]{6})$/i.exec(hex);
  return m ? [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)) : [200, 169, 121];
}

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') || null;
    this.theme = 'watchers'; this.progress = 0; this.color = [200, 169, 121];
    this.charge = 0; this.pulseAmount = 0; this.time = 0; this.frame = 0;
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    this.pointer = { x: -1000, y: -1000 }; this.destroyed = false;
    const r = rng(73921);
    this.stars = Array.from({ length: 290 }, () => ({ x: r(), y: r() * .72, s: .3 + r() * 1.2, a: .15 + r() * .65, phase: r() * TAU }));
    this.dust = Array.from({ length: 42 }, () => ({ x: r(), y: r(), s: .4 + r() * 1.5, speed: .1 + r(), phase: r() * TAU }));
    this.onResize = () => this.resize();
    this.onVisibility = () => { if (document.hidden) cancelAnimationFrame(this.frame); else { this.last = 0; this.draw(); this.start(); } };
    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    this.resize(); this.start();
  }

  tint(alpha = 1, offset = 0) { return `rgba(${this.color.map(v => clamp(v + offset, 0, 255)).join(',')},${alpha})`; }
  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    this.w = rect.width || window.innerWidth; this.h = rect.height || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.mobile = this.w < 700;
    this.focus = { x: this.w * (this.mobile ? .57 : .727), y: this.h * (this.mobile ? .31 : .43) };
    this.unit = Math.min(this.w * (this.mobile ? .79 : .39), this.h * .66);
    this.draw();
  }
  setScene(theme, progress = 0, color = '#c8a979') {
    this.theme = theme; this.progress = clamp(Number(progress) || 0); this.color = rgb(color); this.pulseAmount = this.reduced ? 0 : .7;
    this.draw(); this.start();
  }
  setPointer(x, y) {
    if (!this.canvas) return;
    const b = this.canvas.getBoundingClientRect(); this.pointer = { x: x - b.left, y: y - b.top };
    if (this.reduced) this.draw();
  }
  setCharge(value) { this.charge = clamp(Number(value) || 0); if (this.reduced) this.draw(); }
  pulse() { this.pulseAmount = 1; this.draw(); this.start(); }
  setReducedMotion(value) { this.reduced = !!value; cancelAnimationFrame(this.frame); this.last = 0; this.draw(); this.start(); }
  start() {
    if (this.destroyed || !this.ctx || this.reduced || document.hidden) return;
    cancelAnimationFrame(this.frame);
    const tick = stamp => {
      if (this.destroyed || document.hidden || this.reduced) return;
      const dt = this.last ? Math.min(.06, (stamp - this.last) / 1000) : 0;
      this.last = stamp; this.time += dt; this.pulseAmount = Math.max(0, this.pulseAmount - dt * .4);
      this.draw(); this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  destroy() {
    this.destroyed = true; cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize); document.removeEventListener('visibilitychange', this.onVisibility);
  }
  gradient(x, y, radius, inner, outer) {
    const g = this.ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius)); g.addColorStop(0, inner); g.addColorStop(1, outer); return g;
  }
  line(points, color, width = 1) {
    const c = this.ctx; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  glow(x, y, r, alpha = .2) {
    const c = this.ctx; c.fillStyle = this.gradient(x, y, r, this.tint(alpha, 18), this.tint(0)); c.fillRect(x - r, y - r, r * 2, r * 2);
  }

  draw() {
    if (!this.ctx || !this.w || this.destroyed) return;
    const c = this.ctx, w = this.w, h = this.h, f = this.focus, u = this.unit;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, w, h);
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0a1520'); sky.addColorStop(.40, '#162735'); sky.addColorStop(.65, '#344044'); sky.addColorStop(1, '#0c171e');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    const horizon = this.gradient(f.x, f.y + u * .28, Math.max(w * .6, h * .75), this.tint(.24 + this.progress * .1), this.tint(0));
    c.fillStyle = horizon; c.fillRect(0, 0, w, h);
    this.drawStars(); this.drawClouds();
    this.drawMountains();
    this.glow(f.x, f.y + u * .19, u * .72, .08 + this.charge * .1);
    this.drawMotif();
    this.drawTerrain();
    this.drawDust(); this.drawPointer();
    // Soft cinema vignette leaves the central scene luminous and text legible.
    const vig = c.createRadialGradient(w * .63, h * .43, h * .1, w * .6, h * .46, Math.max(w * .75, h * .85));
    vig.addColorStop(0, 'rgba(4,10,16,0)'); vig.addColorStop(.65, 'rgba(4,10,16,.04)'); vig.addColorStop(1, 'rgba(3,9,15,.64)');
    c.fillStyle = vig; c.fillRect(0, 0, w, h);
  }
  drawStars() {
    const c = this.ctx, w = this.w, h = this.h;
    this.stars.forEach(s => {
      const twinkle = this.reduced ? .8 : .74 + Math.sin(this.time * .42 + s.phase) * .26;
      c.fillStyle = `rgba(229,230,215,${s.a * twinkle * (1 - s.y)})`; c.beginPath(); c.arc(s.x * w, s.y * h, s.s * (this.mobile ? .7 : .8), 0, TAU); c.fill();
    });
    // A sparse band of remote starlight gives the sky depth, not a wallpaper grid.
    const r = rng(87);
    c.fillStyle = 'rgba(201,212,218,.065)';
    for (let i = 0; i < 130; i++) { const x = r() * w; const y = h * (.24 - x / w * .16 + (r() - .5) * .17); c.fillRect(x, y, .75, .75); }
  }
  drawClouds() {
    const c = this.ctx, f = this.focus, u = this.unit;
    c.save(); c.globalAlpha = .5;
    for (let i = 0; i < 5; i++) {
      c.save(); c.translate(f.x - u * .4 + i * u * .12, f.y + u * (.03 + i * .10)); c.scale(2.7, .18);
      c.fillStyle = this.gradient(0, 0, u * .51, this.tint(.07), this.tint(0)); c.fillRect(-u, -u, u * 2, u * 2); c.restore();
    }
    c.restore();
  }
  drawMountains() {
    const c = this.ctx, w = this.w, h = this.h;
    const base = this.mobile ? .49 : .62;
    const colors = ['#344044', '#2b393f', '#233139', '#1b2931'];
    for (let layer = 0; layer < 4; layer++) {
      const r = rng(551 + layer * 44); const points = [];
      for (let i = -1; i <= 25; i++) {
        const x = i / 24 * w; const dip = Math.exp(-Math.pow((x / w - .72) * 3.7, 2));
        const y = h * (base + layer * .052 - (.07 + r() * .15) * (1 - dip * .55));
        points.push([x, y]);
      }
      c.beginPath(); c.moveTo(-w * .1, h);
      points.forEach(p => c.lineTo(...p)); c.lineTo(w * 1.1, h); c.closePath(); c.fillStyle = colors[layer]; c.fill();
      // Small exposed ridgelines are the only bright part of the distant stone.
      c.strokeStyle = this.tint(.04 + .018 * (3 - layer)); c.lineWidth = .7; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.stroke();
    }
  }
  drawMotif() {
    const c = this.ctx, f = this.focus, u = this.unit;
    c.save(); c.translate(f.x, f.y);
    const growth = .82 + this.progress * .18;
    c.scale(growth, growth);
    switch (this.theme) {
      case 'garden': this.tree(0, u * .19, u * .72); break;
      case 'river': this.portal(u, true); this.fish(u); break;
      case 'city': this.city(u); break;
      case 'wisdom': this.armillary(u, true); break;
      case 'temple': this.temple(u); break;
      case 'birds': this.portal(u, false); this.birds(u); break;
      case 'desert': this.desert(u); break;
      case 'dawn': this.dawn(u); break;
      case 'tower': this.tower(u); break;
      default: this.armillary(u); this.portal(u, false); this.watchers(u);
    }
    this.person(u * .075, u * .30, u * .052);
    c.restore();
  }
  armillary(u, wisdom = false) {
    const c = this.ctx, r = u * .315;
    this.glow(0, 0, u * .58, .13 + this.charge * .11);
    c.save(); c.rotate(-.15);
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, 0, r + i * u * .018, r + i * u * .018, 0, 0, TAU); c.strokeStyle = this.tint(i === 1 ? .48 : .15); c.lineWidth = i === 1 ? 1.05 : .6; c.stroke(); }
    for (let i = 0; i < 64; i++) {
      const a = i / 64 * TAU, outer = r + u * .024, inner = outer - u * (i % 4 === 0 ? .016 : .008);
      this.line([[Math.cos(a) * inner, Math.sin(a) * inner], [Math.cos(a) * outer, Math.sin(a) * outer]], this.tint(i % 4 ? .3 : .6), .7);
    }
    c.strokeStyle = this.tint(.23); c.lineWidth = .85;
    [-.7, .68].forEach(rot => { c.beginPath(); c.ellipse(0, 0, r * 1.08, r * .34, rot, 0, TAU); c.stroke(); });
    this.line([[-r * 1.22, 0], [r * 1.22, 0]], this.tint(.2), .65);
    this.line([[0, -r * 1.22], [0, r * 1.22]], this.tint(.2), .65);
    const orbit = this.reduced ? -.8 : -.8 + this.time * .015;
    for (let i = 0; i < 5; i++) { const a = orbit + i * TAU / 5; this.glow(Math.cos(a) * r, Math.sin(a) * r, u * .014, .8); c.fillStyle = this.tint(.9, 32); c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, i === 0 ? 2 : 1.3, 0, TAU); c.fill(); }
    c.restore();
    if (wisdom) {
      // A hovering open codex inside its cosmological diagram.
      const y = u * .02;
      c.fillStyle = '#203039'; c.strokeStyle = this.tint(.68); c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(0, y - u * .06); c.quadraticCurveTo(-u * .095, y - u * .13, -u * .19, y - u * .08); c.lineTo(-u * .19, y + u * .12); c.quadraticCurveTo(-u * .09, y + u * .08, 0, y + u * .15); c.quadraticCurveTo(u * .09, y + u * .08, u * .19, y + u * .12); c.lineTo(u * .19, y - u * .08); c.quadraticCurveTo(u * .095, y - u * .13, 0, y - u * .06); c.fill(); c.stroke();
      this.line([[0, y - u * .05], [0, y + u * .14]], this.tint(.6), 1);
      for (let j = 0; j < 6; j++) [-1, 1].forEach(s => this.line([[s * u * .03, y + u * (-.035 + j * .025)], [s * u * .16, y + u * (-.058 + j * .025)]], this.tint(.22), .8));
    }
  }
  portal(u, water = false) {
    const c = this.ctx, top = -u * .21, bottom = u * .28, width = u * .13;
    this.glow(0, u * .06, u * .3, .16 + this.progress * .12);
    const inside = c.createLinearGradient(0, top, 0, bottom); inside.addColorStop(0, this.tint(.06)); inside.addColorStop(1, this.tint(.22));
    c.fillStyle = inside; c.fillRect(-width + u * .023, top, width * 2 - u * .046, bottom - top);
    [-1, 1].forEach(s => {
      const x = s < 0 ? -width - u * .018 : width - u * .018;
      c.fillStyle = '#253139'; c.fillRect(x, top, u * .038, bottom - top);
      c.fillStyle = this.tint(.42); c.fillRect(s < 0 ? x + u * .037 : x, top, 1.15, bottom - top);
      c.fillStyle = '#354046'; c.fillRect(x - u * .008, top - u * .018, u * .054, u * .032);
      c.fillRect(x - u * .008, bottom - u * .024, u * .054, u * .038);
      for (let k = 0; k < 9; k++) this.line([[x + u * .004, top + k * u * .053], [x + u * .033, top + k * u * .053]], this.tint(.12), .8);
    });
    c.fillStyle = '#364047'; c.fillRect(-width - u * .03, top - u * .035, width * 2 + u * .06, u * .034);
    this.line([[-width - u * .03, top - u * .035], [width + u * .03, top - u * .035]], this.tint(.62), 1);
    for (let i = 0; i < 5; i++) { const sw = width + u * .025 + i * u * .024; c.fillStyle = i % 2 ? '#27323a' : '#303940'; c.fillRect(-sw, bottom + i * u * .014, sw * 2, u * .014); this.line([[-sw, bottom + i * u * .014], [sw, bottom + i * u * .014]], this.tint(.23), .8); }
    if (water) {
      c.save(); c.globalAlpha = .32; c.translate(0, u * .62); c.scale(1, -.45); c.fillStyle = this.tint(.12); c.fillRect(-width, top, width * 2, bottom - top); c.restore();
    }
  }
  tree(x, y, size) {
    const c = this.ctx; this.glow(x, y - size * .42, size * .6, .19);
    const r = rng(88);
    const branch = (bx, by, len, angle, depth) => {
      const ex = bx + Math.cos(angle) * len, ey = by + Math.sin(angle) * len;
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + Math.cos(angle) * len * .2, by + Math.sin(angle) * len * .7, ex, ey); c.strokeStyle = depth > 2 ? '#887d64' : this.tint(.6); c.lineWidth = Math.max(.6, depth * size * .007); c.stroke();
      if (depth) { branch(ex, ey, len * (.65 + r() * .1), angle - .42 - r() * .22, depth - 1); branch(ex, ey, len * (.66 + r() * .1), angle + .4 + r() * .22, depth - 1); }
      else { this.glow(ex, ey, size * .032, .24); c.fillStyle = this.tint(.52); c.beginPath(); c.ellipse(ex, ey, size * .013, size * .024, angle, 0, TAU); c.fill(); }
    };
    branch(x, y, size * .29, -Math.PI / 2, 5);
    for (let i = 0; i < 6; i++) this.line([[x, y], [x + (i - 2.5) * size * .048, y + size * .025]], '#6f6957', 2);
    for (let i = 0; i < 8 + Math.round(this.progress * 8); i++) { const a = r() * TAU, radius = r() * size * .29; this.glow(x + Math.cos(a) * radius, y - size * .51 + Math.sin(a) * radius * .7, size * .011, .8); }
  }
  city(u) {
    const c = this.ctx, r = rng(452);
    this.glow(0, -u * .03, u * .53, .19);
    for (let i = 0; i < 22; i++) {
      const x = (i / 21 - .5) * u * .9, hh = (.05 + r() * .19 + .1 * (1 - Math.abs(i / 21 - .5) * 2)) * u, ww = u * (.032 + r() * .025);
      c.fillStyle = i % 2 ? '#374144' : '#2c393d'; c.fillRect(x, u * .24 - hh, ww, hh);
      this.line([[x, u * .24 - hh], [x + ww, u * .24 - hh], [x + ww, u * .24]], this.tint(.24), .8);
      for (let k = 0; k < 3; k++) { c.fillStyle = this.tint(.42 + this.progress * .2); c.fillRect(x + ww * .38, u * .26 - hh + k * u * .041, 2, 3); }
    }
    this.temple(u * .69);
  }
  temple(u) {
    const c = this.ctx, y = u * .21;
    this.glow(0, 0, u * .5, .15);
    c.fillStyle = '#344048'; c.beginPath(); c.moveTo(-u * .32, -u * .14); c.lineTo(0, -u * .34); c.lineTo(u * .32, -u * .14); c.closePath(); c.fill(); c.strokeStyle = this.tint(.55); c.lineWidth = 1; c.stroke();
    c.fillStyle = '#233039'; c.fillRect(-u * .26, -u * .13, u * .52, u * .36);
    for (let i = 0; i < 6; i++) { const x = (i / 5 - .5) * u * .49; c.fillStyle = '#46504f'; c.fillRect(x - u * .015, -u * .13, u * .03, u * .36); this.line([[x - u * .014, -u * .13], [x - u * .014, y]], this.tint(.43), 1); c.fillRect(x - u * .026, -u * .14, u * .052, u * .022); }
    for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#26343b' : '#3a4446'; c.fillRect(-u * (.3 + i * .02), y + u * .02 * i, u * (.6 + i * .04), u * .02); }
    this.glow(0, u * .13, u * .09, .56);
  }
  birds(u) {
    const c = this.ctx;
    for (let i = 0; i < 12; i++) {
      const x = Math.sin(i * 2.3) * u * .37, y = -u * (.06 + i / 12 * .38), s = u * (.012 + (i % 3) * .003), flap = Math.sin(this.time * 2.3 + i) * s * .4;
      c.beginPath(); c.moveTo(x - s, y - s * .5 - flap); c.quadraticCurveTo(x - s * .4, y - s, x, y); c.quadraticCurveTo(x + s * .4, y - s, x + s, y - s * .5 - flap); c.strokeStyle = this.tint(.4 + .04 * (i % 4), 28); c.lineWidth = 1.2; c.stroke();
    }
  }
  fish(u) {
    const c = this.ctx;
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * u * .1 + Math.sin(this.time * .25 + i) * u * .02, y = u * (.38 + i % 2 * .04);
      c.strokeStyle = this.tint(.31); c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, u * .024, u * .008, -.12, 0, TAU); c.stroke();
      this.line([[x - u * .022, y], [x - u * .036, y - u * .012], [x - u * .036, y + u * .012], [x - u * .022, y]], this.tint(.31), 1);
    }
  }
  desert(u) {
    const c = this.ctx;
    // Ascetic cave and a distant crescent, with layered sand below.
    this.glow(0, -u * .17, u * .27, .17);
    c.fillStyle = this.tint(.8, 20); c.beginPath(); c.arc(u * .16, -u * .25, u * .07, 0, TAU); c.fill(); c.fillStyle = '#26333b'; c.beginPath(); c.arc(u * .18, -u * .27, u * .07, 0, TAU); c.fill();
    c.fillStyle = '#2c3638'; c.beginPath(); c.moveTo(-u * .34, u * .3); c.lineTo(-u * .24, -.06 * u); c.lineTo(-u * .11, -.18 * u); c.lineTo(u * .05, -.08 * u); c.lineTo(u * .18, u * .3); c.closePath(); c.fill();
    c.fillStyle = '#0b1720'; c.beginPath(); c.ellipse(-u * .075, u * .18, u * .067, u * .12, .18, Math.PI, TAU); c.lineTo(0, u * .31); c.lineTo(-u * .16, u * .31); c.fill();
    this.line([[-u * .24, -u * .055], [-u * .11, -u * .18], [u * .05, -u * .08]], this.tint(.32), 1);
    this.glow(-u * .08, u * .25, u * .046, .72);
  }
  dawn(u) {
    const c = this.ctx, r = u * (.12 + this.progress * .035);
    this.glow(0, -u * .08, u * .66, .28);
    c.fillStyle = this.gradient(0, -u * .08, r, this.tint(.86, 46), this.tint(.52, 14)); c.beginPath(); c.arc(0, -u * .08, r, 0, TAU); c.fill();
    for (let i = 0; i < 13; i++) { const a = Math.PI + i / 12 * Math.PI; this.line([[Math.cos(a) * r * 1.3, -u * .08 + Math.sin(a) * r * 1.3], [Math.cos(a) * r * 2.4, -u * .08 + Math.sin(a) * r * 2.4]], this.tint(.13), 1); }
    this.tree(u * .25, u * .28, u * .27); this.birds(u * .7);
  }
  tower(u) {
    const c = this.ctx;
    this.glow(0, 0, u * .52, .17);
    for (let i = 0; i < 7; i++) {
      const width = u * (.46 - i * .052), y = u * (.27 - i * .077), height = u * .082;
      c.fillStyle = i % 2 ? '#3b4546' : '#333f42'; c.fillRect(-width / 2, y - height, width, height);
      this.line([[-width / 2, y - height], [width / 2, y - height], [width / 2, y]], this.tint(.45), 1);
      for (let j = 0; j < 4; j++) { c.fillStyle = this.tint(.24 + this.progress * .22); c.fillRect(-width * .34 + j * width * .22, y - height * .58, u * .009, u * .022); }
    }
    this.line([[0, -u * .272], [0, -u * .39]], this.tint(.7), 1); this.glow(0, -u * .39, u * .016, .9);
  }
  watchers(u) {
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * u * .14, y = -u * (.37 + (i % 2) * .10);
      this.glow(x, y, u * .055, .21); this.person(x, y + u * .026, u * .036, true);
      this.line([[x - u * .043, y - u * .014], [x - u * .02, y + u * .009], [x, y - u * .004], [x + u * .02, y + u * .009], [x + u * .043, y - u * .014]], this.tint(.44), .8);
    }
  }
  person(x, y, size, luminous = false) {
    const c = this.ctx; c.fillStyle = luminous ? this.tint(.52, 20) : '#09141d';
    c.beginPath(); c.arc(x, y - size * .89, size * .095, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x - size * .07, y - size * .75); c.lineTo(x - size * .15, y - size * .12); c.lineTo(x + size * .15, y - size * .12); c.lineTo(x + size * .07, y - size * .75); c.closePath(); c.fill();
    this.line([[x - size * .06, y - size * .15], [x - size * .08, y]], luminous ? this.tint(.6) : '#0a151c', Math.max(1, size * .045));
    this.line([[x + size * .06, y - size * .15], [x + size * .08, y]], luminous ? this.tint(.6) : '#0a151c', Math.max(1, size * .045));
    if (!luminous) this.line([[x - size * .06, y - size * .73], [x - size * .13, y - size * .17]], this.tint(.54), .7);
  }
  drawTerrain() {
    const c = this.ctx, w = this.w, h = this.h, f = this.focus, u = this.unit;
    const y = f.y + u * .36;
    // The winding illuminated valley is a perspective anchor below the monument.
    const water = c.createLinearGradient(0, y, 0, h); water.addColorStop(0, this.tint(.25)); water.addColorStop(1, this.tint(.02));
    c.fillStyle = water; c.beginPath(); c.moveTo(f.x - u * .018, y); c.bezierCurveTo(f.x - u * .13, y + u * .2, w * .98, h * .79, w * .52, h * 1.1); c.lineTo(w * .78, h * 1.1); c.bezierCurveTo(w * 1.03, h * .76, f.x - u * .09, y + u * .2, f.x + u * .02, y); c.closePath(); c.fill();
    c.strokeStyle = this.tint(.16); c.lineWidth = .8; c.beginPath(); c.moveTo(f.x, y); c.bezierCurveTo(f.x - u * .10, y + u * .23, w * 1.02, h * .80, w * .66, h * 1.1); c.stroke();
    const r = rng(267);
    for (let i = 0; i < 100; i++) {
      const yy = y + r() * (h - y), perspective = (yy - y) / Math.max(1, h - y);
      const xx = f.x + Math.sin(perspective * 4.6) * w * .09 + (r() - .5) * (u * .018 + perspective * w * .17);
      this.line([[xx, yy], [xx + 2 + r() * 16 * perspective, yy]], this.tint(.04 + r() * .10), .5);
    }
    // Dark near rocks frame the panorama while leaving room for the narrative.
    c.fillStyle = '#0b171e'; c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * .78); c.lineTo(w * .10, h * .75); c.lineTo(w * .17, h * .83); c.lineTo(w * .25, h * .82); c.lineTo(w * .40, h); c.closePath(); c.fill();
    c.fillStyle = '#0d1920'; c.beginPath(); c.moveTo(w, h); c.lineTo(w, h * .73); c.lineTo(w * .94, h * .78); c.lineTo(w * .92, h * .88); c.lineTo(w * .83, h); c.closePath(); c.fill();
    this.line([[w * .94, h * .78], [w * .92, h * .88], [w * .83, h]], this.tint(.08), 1);
  }
  drawDust() {
    const c = this.ctx, f = this.focus, u = this.unit;
    for (const d of this.dust) {
      const drift = this.reduced ? 0 : this.time * d.speed * .012;
      const x = f.x + (d.x - .5) * u * 1.65 + Math.sin(d.phase + this.time * .1) * u * .018;
      const y = f.y + u * (.55 - ((d.y + drift) % 1));
      c.fillStyle = this.tint((.1 + this.charge * .24) * (1 + Math.sin(d.phase + this.time)) * .5, 22); c.beginPath(); c.arc(x, y, d.s * .8, 0, TAU); c.fill();
    }
    if (this.pulseAmount > .01) {
      const p = 1 - this.pulseAmount; c.strokeStyle = this.tint(this.pulseAmount * .2); c.lineWidth = .8; c.beginPath(); c.arc(f.x, f.y, u * (.15 + p * .52), 0, TAU); c.stroke();
    }
  }
  drawPointer() {
    const { x, y } = this.pointer; if (x < 0 || y < 0 || x > this.w || y > this.h) return;
    const c = this.ctx, radius = 32 + this.charge * 38;
    this.glow(x, y, radius, .08 + this.charge * .16);
    c.strokeStyle = this.tint(.32 + this.charge * .4); c.lineWidth = .7; c.beginPath(); c.arc(x, y, 7 + this.charge * 8, 0, TAU); c.stroke();
    c.fillStyle = this.tint(.75, 35); c.beginPath(); c.arc(x, y, 1.35 + this.charge, 0, TAU); c.fill();
    if (this.charge) { c.strokeStyle = this.tint(.9, 15); c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, 18, -Math.PI / 2, -Math.PI / 2 + this.charge * TAU); c.stroke(); }
  }
}

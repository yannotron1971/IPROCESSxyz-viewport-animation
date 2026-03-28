(() => {
  // Configuration, local/session storage etc.

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ─────────────────────────────────────────────────────────
  // "PENS" REGISTRY - 10 Optimized Animations
  // ─────────────────────────────────────────────────────────

  const pens = [
    // Pen 1 – Simplex Noise Particle Flow
    {
      name: "simplexFlow",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="c" style="display:block; width:100%; height:100%;"></canvas>';
        const canvas = stage.querySelector('#c');
        
        var SimplexNoise = (function () {
          'use strict';
          var GRAD3 = new Float32Array([
            1,1,0, -1,1,0, 1,-1,0, -1,-1,0,
            1,0,1, -1,0,1, 1,0,-1, -1,0,-1,
            0,1,1, 0,-1,1, 0,1,-1, 0,-1,-1
          ]);
          var F3 = 1 / 3;
          var G3 = 1 / 6;
          function buildPerm(rng) {
            var i, t = new Uint8Array(256);
            for (i = 0; i < 256; i++) t[i] = i;
            for (i = 255; i > 0; i--) {
              var j = (rng() * (i + 1)) | 0;
              var tmp = t[i]; t[i] = t[j]; t[j] = tmp;
            }
            return t;
          }
          function SimplexNoise(seed) {
            var rng = (typeof seed === 'function') ? seed : Math.random;
            var p = buildPerm(rng);
            this.perm = new Uint8Array(512);
            this.permMod12 = new Uint8Array(512);
            for (var i = 0; i < 512; i++) {
              this.perm[i] = p[i & 255];
              this.permMod12[i] = this.perm[i] % 12;
            }
          }
          SimplexNoise.prototype.noise3D = function (xin, yin, zin) {
            var perm = this.perm, pm12 = this.permMod12, g3 = GRAD3;
            var s = (xin + yin + zin) * F3;
            var i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
            var t = (i + j + k) * G3;
            var x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
            var i1, j1, k1, i2, j2, k2;
            if (x0 >= y0) {
              if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
              else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
              else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
            } else {
              if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
              else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
              else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
            }
            var x1 = x0-i1+G3, y1 = y0-j1+G3, z1 = z0-k1+G3;
            var x2 = x0-i2+2*G3, y2 = y0-j2+2*G3, z2 = z0-k2+2*G3;
            var x3 = x0-1+0.5, y3 = y0-1+0.5, z3 = z0-1+0.5;
            var ii = i & 255, jj = j & 255, kk = k & 255;
            var n0, n1, n2, n3;
            var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
            if (t0 < 0) n0 = 0;
            else { var gi0 = pm12[ii + perm[jj + perm[kk]]] * 3; t0 *= t0; n0 = t0*t0*(g3[gi0]*x0 + g3[gi0+1]*y0 + g3[gi0+2]*z0); }
            var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
            if (t1 < 0) n1 = 0;
            else { var gi1 = pm12[ii+i1 + perm[jj+j1 + perm[kk+k1]]] * 3; t1 *= t1; n1 = t1*t1*(g3[gi1]*x1 + g3[gi1+1]*y1 + g3[gi1+2]*z1); }
            var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
            if (t2 < 0) n2 = 0;
            else { var gi2 = pm12[ii+i2 + perm[jj+j2 + perm[kk+k2]]] * 3; t2 *= t2; n2 = t2*t2*(g3[gi2]*x2 + g3[gi2+1]*y2 + g3[gi2+2]*z2); }
            var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
            if (t3 < 0) n3 = 0;
            else { var gi3 = pm12[ii+1 + perm[jj+1 + perm[kk+1]]] * 3; t3 *= t3; n3 = t3*t3*(g3[gi3]*x3 + g3[gi3+1]*y3 + g3[gi3+2]*z3); }
            return 32 * (n0 + n1 + n2 + n3);
          };
          return SimplexNoise;
        })();

        var ctx = canvas.getContext('2d');
        var W, H, cx, cy, hueBase = 0, zoff = 0, animationId = 0, simplex = new SimplexNoise();
        var step = 5, base = 1000, zInc = 0.001, baseMul = 1.75 / base, PI6 = Math.PI * 6, DEG = 180 / Math.PI;
        var INTERACT_R = 400, REPEL_F = 60, VEL_DECAY = 0.85, CLICK_THRESHOLD = 200;
        var MIN_LIFE = 300, MAX_LIFE = 1200, NOISE_RAMP = 0.008;
        var particleNum = Math.min(Math.round(stage.clientWidth * stage.clientHeight / 2073), 1000);
        var mouseX = 0, mouseY = 0, mL = false, mR = false, clickTimer = null;
        var STRIDE = 13, X=0, Y=1, PX=2, PY=3, PH=4, PS=5, PL=6, PA=7, VX=8, VY=9, LF=10, ML=11, NM=12;
        var pBuf = new Float32Array(1000 * STRIDE);

        function setupCanvas() {
          W = canvas.width = stage.clientWidth;
          H = canvas.height = stage.clientHeight;
          cx = W * 0.5; cy = H * 0.5;
          ctx.lineWidth = 0.3;
          ctx.lineCap = ctx.lineJoin = 'round';
        }

        function seedParticle(idx) {
          var o = idx * STRIDE;
          var px = W * Math.random(), py = H * Math.random();
          pBuf[o + X] = px; pBuf[o + Y] = py; pBuf[o + PX] = px; pBuf[o + PY] = py;
          pBuf[o + PH] = hueBase + Math.atan2(cy - py, cx - px) * DEG;
          pBuf[o + PS] = 1; pBuf[o + PL] = 0.5; pBuf[o + PA] = 0;
          pBuf[o + VX] = 0; pBuf[o + VY] = 0; pBuf[o + LF] = 0;
          pBuf[o + ML] = MIN_LIFE + Math.random() * (MAX_LIFE - MIN_LIFE);
          pBuf[o + NM] = 1;
        }

        function fbm(x, y, z) {
          var amp = 1, f = 1, sum = 0;
          amp *= 0.5; sum += amp * (simplex.noise3D(x, y, z) + 1) * 0.5; f = 2;
          amp *= 0.5; sum += amp * (simplex.noise3D(x * f, y * f, z * f) + 1) * 0.5; f = 4;
          amp *= 0.5; sum += amp * (simplex.noise3D(x * f, y * f, z * f) + 1) * 0.5; f = 8;
          amp *= 0.5; sum += amp * (simplex.noise3D(x * f, y * f, z * f) + 1) * 0.5;
          return sum;
        }

        function update() {
          for (var i = 0; i < particleNum; i++) {
            var o = i * STRIDE;
            pBuf[o + LF]++;
            if (pBuf[o + LF] > pBuf[o + ML]) { seedParticle(i); continue; }
            var px = pBuf[o + X], py = pBuf[o + Y];
            pBuf[o + PX] = px; pBuf[o + PY] = py;
            var angle = PI6 * fbm(px * baseMul, py * baseMul, zoff);
            var vx = pBuf[o + VX], vy = pBuf[o + VY], nm = pBuf[o + NM];
            if (nm < 1) { nm = Math.min(1, nm + NOISE_RAMP); pBuf[o + NM] = nm; }
            if (mR) {
              var ddx = px - mouseX, ddy = py - mouseY, dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (dist < INTERACT_R && dist > 0) {
                vx += (ddx / dist) * (1 - dist / INTERACT_R) * REPEL_F;
                vy += (ddy / dist) * (1 - dist / INTERACT_R) * REPEL_F;
              }
            }
            vx *= VEL_DECAY; vy *= VEL_DECAY;
            pBuf[o + VX] = vx; pBuf[o + VY] = vy;
            var nx = px + Math.cos(angle) * step * nm + vx, ny = py + Math.sin(angle) * step * nm + vy;
            pBuf[o + X] = nx; pBuf[o + Y] = ny;
            var a = pBuf[o + PA];
            if (a < 1) { a = Math.min(1, a + 0.003); pBuf[o + PA] = a; }
            ctx.beginPath();
            ctx.strokeStyle = 'hsla(' + (pBuf[o + PH] | 0) + ',' + (pBuf[o + PS] * 100) + '%,' + (pBuf[o + PL] * 100) + '%,' + a + ')';
            ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
            if (nx < 0 || nx > W || ny < 0 || ny > H) seedParticle(i);
          }
          hueBase += 0.1; zoff += zInc;
          animationId = requestAnimationFrame(update);
        }

        setupCanvas();
        for (var i = 0; i < particleNum; i++) seedParticle(i);

        canvas.addEventListener('mousemove', (e) => {
          mouseX = e.clientX - stage.getBoundingClientRect().left;
          mouseY = e.clientY - stage.getBoundingClientRect().top;
          if (mL && clickTimer === null) {
            for (var i = 0; i < 3; i++) {
              var idx = Math.floor(Math.random() * particleNum);
              var o = idx * STRIDE;
              pBuf[o + X] = mouseX + (Math.random() - 0.5) * 10;
              pBuf[o + Y] = mouseY + (Math.random() - 0.5) * 10;
              pBuf[o + PX] = pBuf[o + X]; pBuf[o + PY] = pBuf[o + Y];
              pBuf[o + PA] = 0.8; pBuf[o + NM] = 0;
            }
          }
        });

        canvas.addEventListener('mousedown', (e) => {
          mouseX = e.clientX - stage.getBoundingClientRect().left;
          mouseY = e.clientY - stage.getBoundingClientRect().top;
          if (e.button === 0) { mL = true; clickTimer = setTimeout(() => { clickTimer = null; }, CLICK_THRESHOLD); }
          if (e.button === 2) mR = true;
        });

        canvas.addEventListener('mouseup', (e) => {
          if (e.button === 0) mL = false;
          if (e.button === 2) mR = false;
        });

        let resizeTimer = null;

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('mouseup', (e) => { if (e.button === 2) mR = false; });
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            setupCanvas();
          }, 200);
        });

        update();
      }
    },

    // Pen 2 – tsParticles Network
    {
      name: "tsParticles",
      deps: ["https://cdn.jsdelivr.net/npm/tsparticles@1.15.1/dist/tsparticles.min.js"],
      mount(stage) {
        stage.innerHTML = '<div id="tsparticles" style="width:100%;height:100%;"></div>';
        if (typeof tsParticles === 'undefined') return;
        
        tsParticles.load("tsparticles", {
          fpsLimit: 60,
          particles: {
            number: { value: 100, density: { enable: true, value_area: 1000 } },
            color: { value: "#ff0000", animation: { enable: true, speed: 100, sync: true } },
            shape: { type: "circle", stroke: { width: 0, color: "#000000" } },
            opacity: { value: 0.5, random: false, anim: { enable: false, speed: 3, opacity_min: 0.1, sync: false } },
            size: { value: 3, random: true, anim: { enable: false, speed: 20, size_min: 0.1, sync: false } },
            line_linked: {
              enable: true, distance: 100, color: "random", opacity: 1, width: 2,
              triangles: { enable: true, color: "#05f0e7", opacity: 0.2 }
            },
            move: { enable: true, speed: 5, direction: "none", random: false, straight: false, out_mode: "out",
              attract: { enable: false, rotateX: 600, rotateY: 1200 } }
          },
          interactivity: {
            detect_on: "window",
            events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
            modes: {
              grab: { distance: 400, line_linked: { opacity: 1 } },
              bubble: { distance: 400, size: 40, duration: 2, opacity: 0.8, speed: 3 },
              repulse: { distance: 50, size: 40 },
              push: { particles_nb: 4 },
              remove: { particles_nb: 2 }
            }
          },
          retina_detect: true,
          background: { color: "#000000", image: "", position: "50% 50%", repeat: "no-repeat", size: "cover" }
        });
      }
    },

    // Pen 3 – PRNG Particle Swarm
    {
      name: "prngSwarm",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="swarm" style="display:block; width:100%; height:100%;"></canvas>';
        const canvas = stage.querySelector('#swarm');
        const ctx = canvas.getContext('2d');
        let W = canvas.width = stage.clientWidth, H = canvas.height = stage.clientHeight;

        const PRNG = function(seed) { this.s = (seed >>> 0) || 1; };
        PRNG.prototype.random = function(min, max) {
          this.s ^= this.s << 13; this.s ^= this.s >> 17; this.s ^= this.s << 5;
          var v = (this.s >>> 0) / 4294967296;
          return min === undefined ? v : min + v * (max - min);
        };

        const rng = new PRNG(Date.now());
        const particles = [];
        const PARTICLE_COUNT = Math.min(Math.round(W * H / 10000), 400);
        let hue = 0;
        let animationId = 0;

        class Particle {
          constructor() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.vx = rng.random() - 0.5;
            this.vy = rng.random() - 0.5;
            this.size = rng.random(0.5, 3);
            this.hue = Math.random() * 360;
          }
          update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > W) this.vx *= -1;
            if (this.y < 0 || this.y > H) this.vy *= -1;
          }
          draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'hsl(' + this.hue + ', 100%, 50%)';
            ctx.fill();
          }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

        function animate() {
          ctx.clearRect(0, 0, W, H);
          particles.forEach(p => { p.update(); p.draw(); });
          hue = (hue + 1) % 360;
          animationId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => {
          W = canvas.width = stage.clientWidth;
          H = canvas.height = stage.clientHeight;
        });

        animate();
      }
    },

    // Pen 4 – Trail Canvas Animation
    {
      name: "trailCanvas",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<div style="width:100%;height:100%;position:relative;"><canvas id="main-canvas" style="position:absolute;top:0;left:0;"></canvas></div>';
        const canvas = stage.querySelector('#main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;

        let particles = [];
        let hue = 0;
        const MAX_P = Math.min(Math.round(stage.clientWidth * stage.clientHeight / 253), 16384);

        class Particle {
          constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 2 + 0.1;
          }
          update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
          }
          draw() {
            ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        for (let i = 0; i < 100; i++) particles.push(new Particle());

        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach(p => { p.update(); p.draw(); });
          if (particles.length < MAX_P && Math.random() < 0.1) particles.push(new Particle());
          hue = (hue + 1) % 360;
          requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        });

        animate();
      }
    },

    // Pen 5 – Confetti (simplified non-Three.js version)
    {
      name: "simplifiedConfetti",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="confetti" style="display:block; width:100%; height:100%;"></canvas>';
        const canvas = stage.querySelector('#confetti');
        const ctx = canvas.getContext('2d');
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;

        const particles = [];
        let hue = 0;
        const CONFETTI_NUM = 300;

        class ConfettiParticle {
          constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = Math.random() * 2 + 1;
            this.size = Math.random() * 5 + 2;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.1;
          }
          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotSpeed;
            this.vy += 0.1;
          }
          draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
          }
        }

        for (let i = 0; i < CONFETTI_NUM; i++) particles.push(new ConfettiParticle());

        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach(p => { p.update(); p.draw(); });
          particles.forEach((p, i) => {
            if (p.y > canvas.height) particles[i] = new ConfettiParticle();
          });
          hue = (hue + 1) % 360;
          requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        });

        animate();
      }
    },

    // Pen 6 – Pointer Particles
    {
      name: "pointerParticles",
      deps: [],
      mount(stage) {
        stage.style.overflow = 'hidden';
        stage.innerHTML = '<pointer-particles></pointer-particles>';

        class PointerParticle {
          constructor(x, y, hue) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.size = Math.random() * 5 + 2;
            this.color = 'hsl(' + hue + 'deg 90% 60%)';
            this.decay = 0.05;
          }
          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.size -= this.decay;
          }
          draw(ctx) {
            if (this.size <= 0) return;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        class PointerParticles extends HTMLElement {
          constructor() {
            super();
            this.canvas = null;
            this.particles = [];
            this.hue = 0;
          }
          connectedCallback() {
            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
            this.appendChild(canvas);
            this.canvas = canvas;
            this.canvas.width = stage.clientWidth;
            this.canvas.height = stage.clientHeight;
            const ctx = this.canvas.getContext('2d');

            window.addEventListener('click', (e) => {
              const rect = stage.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              for (let i = 0; i < 50; i++) {
                this.particles.push(new PointerParticle(x, y, this.hue));
              }
            });

            const animate = () => {
              ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
              for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                this.particles[i].draw(ctx);
                if (this.particles[i].size <= 0) this.particles.splice(i, 1);
              }
              this.hue = (this.hue + 3) % 360;
              requestAnimationFrame(animate);
            };

            window.addEventListener('resize', () => {
              this.canvas.width = stage.clientWidth;
              this.canvas.height = stage.clientHeight;
            });

            animate();
          }
        }

        customElements.define('pointer-particles', PointerParticles);
      }
    },

    // Pen 7 – Bubbles
    {
      name: "bubbles",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="canvas" style="display:block; width:100%; height:100%;"></canvas>';
        const canvas = stage.querySelector('#canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;

        const bSize = 12, bSpeed = 3, bDep = 0.03, bDist = 30;
        const particles = [];
        let hue = 0;
        let mouseX, mouseY;

        class Bubble {
          constructor(x, y) {
            this.x = x !== undefined ? x : Math.random() * canvas.width;
            this.y = y !== undefined ? y : Math.random() * canvas.height;
            this.size = Math.random() * bSize + 0.1;
            this.vx = (Math.random() - 0.5) * bSpeed;
            this.vy = (Math.random() - 0.5) * bSpeed;
            this.color = 'hsl(' + hue + ', 100%, 50%)';
          }
          update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            if (this.size > bDep) this.size -= bDep;
          }
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        for (let i = 0; i < 50; i++) particles.push(new Bubble());

        window.addEventListener('mousemove', (e) => {
          const rect = canvas.getBoundingClientRect();
          mouseX = e.clientX - rect.left;
          mouseY = e.clientY - rect.top;
          for (let i = 0; i < 2; i++) particles.push(new Bubble(mouseX, mouseY));
        });

        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            for (let j = i + 1; j < particles.length; j++) {
              const dx = particles[i].x - particles[j].x;
              const dy = particles[i].y - particles[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < bDist && dist > 0) {
                ctx.beginPath();
                ctx.strokeStyle = particles[i].color;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
              }
            }
            if (particles[i].size <= bDep) particles.splice(i, 1);
          }
          hue = (hue + 1) % 360;
          requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        });

        animate();
      }
    },

    // Pen 8 – Connected Particles
    {
      name: "connectedParticles",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="canvas" style="display:block; width:100%; height:100%;"></canvas>';
        const canvas = stage.querySelector('#canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;

        const particles = [];
        let hue = 0;
        let mouseX, mouseY;

        class Particle {
          constructor(x, y) {
            this.x = x !== undefined ? x : Math.random() * canvas.width;
            this.y = y !== undefined ? y : Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.1;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.color = 'hsl(' + hue + ', 100%, 50%)';
          }
          update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            if (this.size > 0.2) this.size -= 0.01;
          }
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        for (let i = 0; i < 100; i++) particles.push(new Particle());

        window.addEventListener('mousemove', (e) => {
          const rect = canvas.getBoundingClientRect();
          mouseX = e.clientX - rect.left;
          mouseY = e.clientY - rect.top;
          for (let i = 0; i < 3; i++) particles.push(new Particle(mouseX, mouseY));
        });

        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            for (let j = i + 1; j < particles.length; j++) {
              const dx = particles[i].x - particles[j].x;
              const dy = particles[i].y - particles[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 90 && dist > 0) {
                ctx.beginPath();
                ctx.strokeStyle = particles[i].color;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
              }
            }
            if (particles[i].size <= 0.3) particles.splice(i, 1);
          }
          hue = (hue + 1) % 360;
          requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        });

        animate();
      }
    },

    // Pen 9 – Hold Particles
    {
      name: "holdParticles",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="canvas" style="display:block; width:100%; height:100%;"></canvas>';
        const canvas = stage.querySelector('#canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;

        const particles = [];
        let hue = 0;
        let mouseX, mouseY;

        class Particle {
          constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = Math.random() * 5 + 1;
            this.color = 'hsl(' + hue + ', 100%, 50%)';
          }
          update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.size >= 1) this.size -= 0.1;
          }
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        window.addEventListener('click', (e) => {
          const rect = canvas.getBoundingClientRect();
          mouseX = e.clientX - rect.left;
          mouseY = e.clientY - rect.top;
          for (let i = 0; i < 5; i++) {
            particles.push(new Particle(mouseX + (Math.random() - 0.5) * 20, mouseY + (Math.random() - 0.5) * 20));
          }
        });

        function animate() {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].size <= 0.5) particles.splice(i, 1);
          }
          hue = (hue + 1) % 360;
          requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        });

        animate();
      }
    },

    // Pen 10 – Hold Particles (variant)
    {
      name: "holdParticles2",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="canvas" style="display:block; width:100%; height:100%;"></canvas>';
        const canvas = stage.querySelector('#canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;

        const particles = [];
        let hue = 0;
        let mouseX, mouseY;

        class Particle {
          constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4 - 1;
            this.size = Math.random() * 3 + 1;
            this.color = 'hsl(' + hue + ', 100%, 50%)';
          }
          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy -= 0.1;
            if (this.size >= 1) this.size -= 0.08;
          }
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        window.addEventListener('click', (e) => {
          const rect = canvas.getBoundingClientRect();
          mouseX = e.clientX - rect.left;
          mouseY = e.clientY - rect.top;
          for (let i = 0; i < 8; i++) {
            particles.push(new Particle(mouseX + (Math.random() - 0.5) * 30, mouseY + (Math.random() - 0.5) * 30));
          }
        });

        function animate() {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].size <= 0.3) particles.splice(i, 1);
          }
          hue = (hue + 2) % 360;
          requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        });

        animate();
      }
    }
  ];

  function pickRandomPen() {
    return pens[Math.floor(Math.random() * pens.length)];
  }

  async function run() {
    const stage = document.querySelector("#intro-stage, .intro-stage");
    if (stage) {
      const pen = pickRandomPen();
      if (pen) {
        console.log("%c Running Pen: " + pen.name, "background: #222; color: #bada55; font-size: 20px; padding: 10px; border-radius: 5px;");
        (async () => {
          for (const dep of pen.deps) {
            try { await loadScript(dep); } catch (e) { console.error("Failed to load", dep, e); }
          }
          try { pen.mount(stage); } catch (e) { console.error("Pen error:", e); }
        })();
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();

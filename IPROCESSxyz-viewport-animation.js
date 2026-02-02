(() => {
  // Configuration, local/session storage etc.
  const STORAGE_KEY = "iprocess_intro_shown";
  const USE_SESSION_STORAGE = true; // "false" means localStorage (once per device), "true" means sessionStorage (once per session)
  const EXPIRY_DAYS = 30; // null to never expire
  const AUTO_HIDE_MS = null; // null to require manual skip

  const store = USE_SESSION_STORAGE ? window.sessionStorage : window.localStorage;

  // HELPERS
  const now = () => Date.now();

  function hasSeen() {
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !data.t) return true;
      if (EXPIRY_DAYS == null) return true;
      const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      return (now() - data.t) < expiryMs;
    } catch {
      return false;
    }
  }

  function markSeen() {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify({ t: now() }));
    } catch { }
  }

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



  function cleanupStage() {
    const stage = document.getElementById("intro-stage");
    if (stage) {
      stage.innerHTML = "";
    }
  }

  function showOverlay() {
    const overlay = document.getElementById("intro-overlay");
    if (overlay) {
      overlay.style.display = "block";
      overlay.style.visibility = "visible";
      document.documentElement.classList.add('is-intro-loading');
    }
  }

  function hideOverlay() {
    const overlay = document.getElementById("intro-overlay");
    if (overlay) {
      overlay.style.display = "none";
      overlay.style.visibility = "hidden";
      document.documentElement.classList.remove('is-intro-loading');
    }
    cleanupStage();
    markSeen();
  }

  // GSAP Intro Logic
  async function runIntroAnimation() {
    if (!window.gsap) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js");
    }

    // Configuration from snippet
    const CONFIG = {
      logoText: 'IPROCESSxyz',
      goldStartIndex: 8,
      scrambleChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      scrambleCharsLower: 'abcdefghijklmnopqrstuvwxyz0123456789',
      charRevealStagger: 0.025,
      scrambleSpeed: 50,
      resolveDelay: 100,
      holdDuration: 0.8,
      safetyTimeout: 4000
    };

    const overlay = document.querySelector('.intro-overlay'); // or #intro-overlay
    const logo = document.querySelector('.intro-logo');
    const loader = document.querySelector('.intro-loader');
    const loaderBar = document.querySelector('.intro-loader-bar');

    if (!overlay || !logo) {
      console.warn('[Intro] Required elements not found');
      hideOverlay();
      return;
    }

    // Split logo text
    let logoHTML = '';
    for (let i = 0; i < CONFIG.logoText.length; i++) {
      const char = CONFIG.logoText[i];
      const isGold = i >= CONFIG.goldStartIndex;
      const scrambleSet = isGold ? CONFIG.scrambleCharsLower : CONFIG.scrambleChars;
      const randomChar = scrambleSet[Math.floor(Math.random() * scrambleSet.length)];
      const goldClass = isGold ? ' is-gold' : '';
      logoHTML += `<span class="char${goldClass}" data-target="${char}">${randomChar}</span>`;
    }
    logo.innerHTML = logoHTML;
    // logo.classList.add('is-ready'); // logic from snippet

    const chars = logo.querySelectorAll('.char');

    // Set initial states
    gsap.set(chars, { opacity: 0, y: 12 });
    if (loader) gsap.set(loader, { opacity: 0 });
    if (loaderBar) gsap.set(loaderBar, { width: '0%' });

    // Scramble Function
    function scrambleText(charElements) {
      return new Promise((resolve) => {
        let currentIndex = 0;
        const scrambleIntervals = [];

        // Start scrambling
        for (let i = 0; i < charElements.length; i++) {
          ((index) => {
            const el = charElements[index];
            const isGold = el.classList.contains('is-gold');
            const scrambleSet = isGold ? CONFIG.scrambleCharsLower : CONFIG.scrambleChars;
            scrambleIntervals[index] = setInterval(() => {
              el.textContent = scrambleSet[Math.floor(Math.random() * scrambleSet.length)];
            }, CONFIG.scrambleSpeed);
          })(i);
        }

        // Resolve one by one
        function resolveNext() {
          if (currentIndex >= charElements.length) {
            resolve();
            return;
          }
          const el = charElements[currentIndex];
          clearInterval(scrambleIntervals[currentIndex]);
          el.textContent = el.dataset.target;
          currentIndex++;
          setTimeout(resolveNext, CONFIG.resolveDelay);
        }
        setTimeout(resolveNext, 400);
      });
    }

    // Slide Out Function
    function slideOutOverlay() {
      gsap.to(overlay, {
        yPercent: -100,
        duration: 0.7,
        ease: 'power3.inOut',
        onComplete: () => {
          hideOverlay(); // This handles display:none and markSeen()
          // window.dispatchEvent(new CustomEvent('introComplete'));
        }
      });
    }

    // Main Animation Sequence
    const tl = gsap.timeline();
    if (loader) {
      tl.to(loader, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    }
    tl.to(chars, {
      opacity: 1, y: 0, duration: 0.4, stagger: CONFIG.charRevealStagger, ease: 'power3.out'
    }, 0.1);
    if (loaderBar) {
      tl.to(loaderBar, { width: '100%', duration: 2.0, ease: 'power1.inOut' }, 0.2);
    }

    // Run scramble then slide out
    setTimeout(() => {
      scrambleText(chars).then(() => {
        setTimeout(slideOutOverlay, CONFIG.holdDuration * 1000);
      });
    }, 350);

    // Safety fallback
    setTimeout(() => {
      const style = window.getComputedStyle(overlay);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        console.warn('[Intro] Safety timeout triggered');
        slideOutOverlay();
      }
    }, CONFIG.safetyTimeout);
  }

  function cleanupStage() {
    const stage = document.getElementById("intro-stage");
    if (!stage) return;
    stage.innerHTML = "";
  }
  // -----------------------------


  // -----------------------------
  // "PENS" REGISTRY
  // Each pen defines:
  // - deps: external scripts to load
  // - mount(stageEl): inserts required HTML (canvas/divs) and runs init code
  //
  // IMPORTANT:
  // Some of your attached pens rely on extra scripts like tsparticles, fscreen, Stage, stats.js, dat.gui, etc.
  // Examples shown below reference those exact dependencies from your file. :contentReference[oaicite:0]{index=0}
  // -----------------------------

  const pens = [
    // Pen 1 – tsParticles
    {
      name: "tsParticles",
      deps: [
        "https://cdn.jsdelivr.net/npm/tsparticles@1.15.1/dist/tsparticles.min.js"
      ],
      mount(stage) {
        stage.innerHTML = '<div id="tsparticles" style="width:100%;height:100%"></div>';
        tsParticles.load("tsparticles", {
          fpsLimit: 60,
          particles: {
            number: {
              value: 100,
              density: {
                enable: true,
                value_area: 1000
              }
            },
            color: {
              value: "#ff0000",
              animation: {
                enable: true,
                speed: 100,
                sync: true
              }
            },
            shape: {
              type: "circle",
              stroke: {
                width: 0,
                color: "#000000"
              },
              polygon: {
                nb_sides: 5
              },
              image: {
                src: "https://cdn.matteobruni.it/images/particles/github.svg",
                width: 100,
                height: 100
              }
            },
            opacity: {
              value: 0.5,
              random: false,
              anim: {
                enable: false,
                speed: 3,
                opacity_min: 0.1,
                sync: false
              }
            },
            size: {
              value: 3,
              random: true,
              anim: {
                enable: false,
                speed: 20,
                size_min: 0.1,
                sync: false
              }
            },
            line_linked: {
              enable: true,
              distance: 100,
              color: "random",
              opacity: 1,
              width: 2,
              triangles: {
                enable: true,
                color: "#05f0e7",
                opacity: 0.2
              }
            },
            move: {
              enable: true,
              speed: 5,
              direction: "none",
              random: false,
              straight: false,
              out_mode: "out",
              attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200
              }
            }
          },
          interactivity: {
            detect_on: "window",
            events: {
              onhover: {
                enable: true,
                mode: "grab"
              },
              onclick: {
                enable: true,
                mode: "push"
              },
              resize: true
            },
            modes: {
              grab: {
                distance: 400,
                line_linked: {
                  opacity: 1
                }
              },
              bubble: {
                distance: 400,
                size: 40,
                duration: 2,
                opacity: 0.8,
                speed: 3
              },
              repulse: {
                distance: 50,
                size: 40
              },
              push: {
                particles_nb: 4
              },
              remove: {
                particles_nb: 2
              }
            }
          },
          retina_detect: true,
          background: {
            color: "#000000",
            image: "",
            position: "50% 50%",
            repeat: "no-repeat",
            size: "cover"
          }
        });

        // Function to handle left-click
        function handleLeftClick(event) {
          if (event.button === 0) {
            console.log("Left click detected");
            // Add your left-click functionality here
          }
        }

        // Function to handle right-click
        function handleRightClick(event) {
          event.preventDefault(); // Prevent the default context menu
          console.log("Right click detected");
          // Add your right-click functionality here
        }

        // Function to handle middle mouse wheel click
        function handleMiddleClick(event) {
          if (event.button === 1) {
            console.log("Middle mouse wheel click detected");
            // Add your middle mouse wheel click functionality here
          }
        }

        // Add event listeners to the relevant element (e.g., document or a specific div)
        document.addEventListener("mousedown", handleLeftClick);
        document.addEventListener("contextmenu", handleRightClick);
        document.addEventListener("mousedown", handleMiddleClick);

      }
    },
    // Pen 2 – particle demo with Stats.js and dat.GUI
    {
      name: "particleVector",
      deps: [
        "https://s3-us-west-2.amazonaws.com/s.cdpn.io/188512/codepen-utilities.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/stats.js/r11/Stats.js",
        "https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.5.1/dat.gui.min.js"
      ],
      mount(stage) {
        stage.innerHTML = '<canvas id="particleCanvas"></canvas>';
        // Paste the JS from CodePen 2 here, but replace any document‑level event
        // listeners (mousedown, contextmenu, etc.) with listeners on the stage:
        // stage.addEventListener('mousedown', …);
        JS:
        /*
          Click and drag to attract
          Right click to repulse
          Mouse-wheel click to create a time dilation field
          Use the Controls to decrease or increase
          the particle count to tweak performance.
        */

        +(function (root) {
          'use strict';
          var SmallPRNG = function (s) { this.seed = s || 0; };
          SmallPRNG.prototype.random = function (min, max) {
            this.seed = (this.seed * 9301 + 49297) % 233280;
            var rnd = this.seed / 233280;
            if (min === undefined) return rnd;
            return min + rnd * (max - min);
          };
          root.SmallPRNG = SmallPRNG;

          var Vector3D = function Vector3D(x, y, z) {
            this.set(x, y, z);
          }, v3dp = Vector3D.prototype;

          v3dp.dot2d = function (x, y) {
            return ((this.x * x) + (this.y * y));
          };

          v3dp.dot3d = function (x, y, z) {
            return ((this.x * x) + (this.y * y) + (this.z * z));
          };

          v3dp.set = function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;

            return this;
          };

          v3dp.add = function (other) {
            if (typeof other === "number") {
              this.x += other, this.y += other, this.z += other;
              return this;
            }
            this.x += other.x, this.y += other.y, this.z += other.z;
            return this;
          };

          v3dp.sub = function (other) {
            if (typeof other === "number") {
              this.x -= other, this.y -= other, this.z -= other;
              return this;
            }
            this.x -= other.x, this.y -= other.y, this.z -= other.z;
            return this;
          };

          v3dp.mul = function (other) {
            if (typeof other === "number") {
              this.x *= other, this.y *= other, this.z *= other;
              return this;
            }
            this.x *= other.x, this.y *= other.y, this.z *= other.z;
            return this;
          };

          v3dp.div = function (other) {
            if (typeof other === "number") {
              this.x /= other, this.y /= other, this.z /= other;
              return this;
            }
            this.x /= other.x, this.y /= other.y, this.z /= other.z;
            return this;
          };

          v3dp.move = function (dest) {
            if (dest instanceof Vector3D) {
              dest.x = this.x, dest.y = this.y, dest.z = this.z;
            }
            return this;
          };

          v3dp.within2d = function (bounds) {
            return (this.x >= 0 && this.x < bounds.x && this.y >= 0 && this.y < bounds.y);
          };

          v3dp.wrap2d = function (bounds) {
            if (this.x > bounds.x) {
              this.x = 0;
              return true;
            }

            if (this.x < 0) {
              this.x = bounds.x;
              return true;
            }

            if (this.y > bounds.y) {
              this.y = 0;
              return true;
            }

            if (this.y < 0) {
              this.y = bounds.y;
              return true;
            }
          };

          v3dp.eq = function (other) {
            return (other instanceof Vector3D) && this.x === other.x && this.y === other.y && this.z === other.z;
          };

          v3dp.distance = function (other) {
            var dx = (this.x - other.x),
              dy = (this.y - other.y);

            return Math.sqrt(dx * dx + dy * dy);
          };

          v3dp.clone = function () {
            return new Vector3D(this.x, this.y, this.z);
          };

          root.Vector3D = Vector3D;
        }(window));

        +(function (root) {
          'use strict';
          // a simple non-optimized Perlin Simplex Noise. I wrote this
          // to understand Simplex Noise a bit more.

          // fully self-contained state, so you can influence the outcome
          // of each simplex noise state
          var Perlin = function Perlin() {
            this.grad3 = [
              new Vector3D(1, 1, 0), new Vector3D(-1, 1, 0), new Vector3D(1, -1, 0), new Vector3D(-1, -1, 0),
              new Vector3D(1, 0, 1), new Vector3D(-1, 0, 1), new Vector3D(1, 0, -1), new Vector3D(-1, 0, -1),
              new Vector3D(0, 1, 1), new Vector3D(0, -1, 1), new Vector3D(0, 1, -1), new Vector3D(0, -1, -1)
            ];

            this.p = [
              0x97, 0xa0, 0x89, 0x5b, 0x5a, 0x0f, 0x83, 0x0d, 0xc9, 0x5f, 0x60, 0x35, 0xc2, 0xe9, 0x07, 0xe1,
              0x8c, 0x24, 0x67, 0x1e, 0x45, 0x8e, 0x08, 0x63, 0x25, 0xf0, 0x15, 0x0a, 0x17, 0xbe, 0x06, 0x94,
              0xf7, 0x78, 0xea, 0x4b, 0x00, 0x1a, 0xc5, 0x3e, 0x5e, 0xfc, 0xdb, 0xcb, 0x75, 0x23, 0x0b, 0x20,
              0x39, 0xb1, 0x21, 0x58, 0xed, 0x95, 0x38, 0x57, 0xae, 0x14, 0x7d, 0x88, 0xab, 0xa8, 0x44, 0xaf,
              0x4a, 0xa5, 0x47, 0x86, 0x8b, 0x30, 0x1b, 0xa6, 0x4d, 0x92, 0x9e, 0xe7, 0x53, 0x6f, 0xe5, 0x7a,
              0x3c, 0xd3, 0x85, 0xe6, 0xdc, 0x69, 0x5c, 0x29, 0x37, 0x2e, 0xf5, 0x28, 0xf4, 0x66, 0x8f, 0x36,
              0x41, 0x19, 0x3f, 0xa1, 0x01, 0xd8, 0x50, 0x49, 0xd1, 0x4c, 0x84, 0xbb, 0xd0, 0x59, 0x12, 0xa9,
              0xc8, 0xc4, 0x87, 0x82, 0x74, 0xbc, 0x9f, 0x56, 0xa4, 0x64, 0x6d, 0xc6, 0xad, 0xba, 0x03, 0x40,
              0x34, 0xd9, 0xe2, 0xfa, 0x7c, 0x7b, 0x05, 0xca, 0x26, 0x93, 0x76, 0x7e, 0xff, 0x52, 0x55, 0xd4,
              0xcf, 0xce, 0x3b, 0xe3, 0x2f, 0x10, 0x3a, 0x11, 0xb6, 0xbd, 0x1c, 0x2a, 0xdf, 0xb7, 0xaa, 0xd5,
              0x77, 0xf8, 0x98, 0x02, 0x2c, 0x9a, 0xa3, 0x46, 0xdd, 0x99, 0x65, 0x9b, 0xa7, 0x2b, 0xac, 0x09,
              0x81, 0x16, 0x27, 0xfd, 0x13, 0x62, 0x6c, 0x6e, 0x4f, 0x71, 0xe0, 0xe8, 0xb2, 0xb9, 0x70, 0x68,
              0xda, 0xf6, 0x61, 0xe4, 0xfb, 0x22, 0xf2, 0xc1, 0xee, 0xd2, 0x90, 0x0c, 0xbf, 0xb3, 0xa2, 0xf1,
              0x51, 0x33, 0x91, 0xeb, 0xf9, 0x0e, 0xef, 0x6b, 0x31, 0xc0, 0xd6, 0x1f, 0xb5, 0xc7, 0x6a, 0x9d,
              0xb8, 0x54, 0xcc, 0xb0, 0x73, 0x79, 0x32, 0x2d, 0x7f, 0x04, 0x96, 0xfe, 0x8a, 0xec, 0xcd, 0x5d,
              0xde, 0x72, 0x43, 0x1d, 0x18, 0x48, 0xf3, 0x8d, 0x80, 0xc3, 0x4e, 0x42, 0xd7, 0x3d, 0x9c, 0xb4
            ];

            this.permutation = new Array(512);
            this.gradP = new Array(512);

            // skew and unskew factors for 2D or 3D, can be modified per state!
            this.F2 = (0.5 * (Math.sqrt(3) - 1));
            this.G2 = ((3 - Math.sqrt(3)) / 6);
            this.F3 = (1 / 3);
            this.G3 = (1 / 6);
          }, pp = Perlin.prototype;

          pp.init = function (prng) {
            if (typeof prng !== "function") {
              throw new TypeError("prng needs to be a function returning an int between 0 and 255");
            }

            for (var i = 0; i < 256; i += 1) {
              var randval = (this.p[i] ^ prng());
              this.permutation[i] = this.permutation[i + 256] = randval;
              this.gradP[i] = this.gradP[i + 256] = this.grad3[randval % this.grad3.length];
            }
          };

          // I removed the pp.simplex2d function, because I don't need it in this project
          // pp.simplex2d = function(x, y) {};

          pp.simplex3d = function (x, y, z) {
            var n0, n1, n2, n3, i1, j1, k1, i2, j2, k2,
              x1, y1, z1, x2, y2, z2, x3, y3, z3,
              gi0, gi1, gi2, gi3, t0, t1, t2, t3,
              s = ((x + y + z) * this.F3),
              i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s),
              t = ((i + j + k) * this.G3),
              x0 = (x - i + t), y0 = (y - j + t), z0 = (z - k + t);

            if (x0 >= y0) {
              if (y0 >= z0) {
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
              } else if (x0 >= z0) {
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
              } else {
                i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
              }
            } else {
              if (y0 < z0) {
                i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
              } else if (x0 < z0) {
                i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
              } else {
                i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
              }
            }

            x1 = (x0 - i1 + this.G3), y1 = (y0 - j1 + this.G3), z1 = (z0 - k1 + this.G3);
            x2 = (x0 - i2 + 2 * this.G3), y2 = (y0 - j2 + 2 * this.G3), z2 = (z0 - k2 + 2 * this.G3);
            x3 = (x0 - 1 + 3 * this.G3), y3 = (y0 - 1 + 3 * this.G3), z3 = (z0 - 1 + 3 * this.G3);

            i &= 255, j &= 255, k &= 255;

            gi0 = this.gradP[i + this.permutation[j + this.permutation[k]]];
            gi1 = this.gradP[i + i1 + this.permutation[j + j1 + this.permutation[k + k1]]];
            gi2 = this.gradP[i + i2 + this.permutation[j + j2 + this.permutation[k + k2]]];
            gi3 = this.gradP[i + 1 + this.permutation[j + 1 + this.permutation[k + 1]]];

            t0 = (0.6 - x0 * x0 - y0 * y0 - z0 * z0);
            t1 = (0.6 - x1 * x1 - y1 * y1 - z1 * z1);
            t2 = (0.6 - x2 * x2 - y2 * y2 - z2 * z2);
            t3 = (0.6 - x3 * x3 - y3 * y3 - z3 * z3);
            n0 = (t0 < 0 ? 0 : (t0 *= t0, t0 * t0 * gi0.dot3d(x0, y0, z0)));
            n1 = (t1 < 0 ? 0 : (t1 *= t1, t1 * t1 * gi1.dot3d(x1, y1, z1)));
            n2 = (t2 < 0 ? 0 : (t2 *= t2, t2 * t2 * gi2.dot3d(x2, y2, z2)));
            n3 = (t3 < 0 ? 0 : (t3 *= t3, t3 * t3 * gi3.dot3d(x3, y3, z3)));

            return (32 * (n0 + n1 + n2 + n3));
          };

          root.Perlin = Perlin;
        }(window));

        ; (function (root) {
          'use strict';

          var MouseMonitor = function (element) {
            this.position = new Vector3D(0, 0, 0);
            this.state = { left: false, middle: false, right: false };
            this.element = element;

            var that = this;
            window.addEventListener('mousemove', function (event) {
              var dot, eventDoc, doc, body, pageX, pageY;
              event = event || window.event;
              if (event.pageX == null && event.clientX != null) {
                eventDoc = (event.target && event.target.ownerDocument) || document;
                doc = eventDoc.documentElement;
                body = eventDoc.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
              }

              that.position.x = event.pageX;
              that.position.y = event.pageY;
            });

            element.addEventListener('contextmenu', function (event) {
              return event.preventDefault();
            });

            element.addEventListener('mousedown', function (event) {
              if (event.which === 1) that.state.left = true;
              if (event.which === 2) that.state.middle = true;
              if (event.which === 3) that.state.right = true;

              return event.preventDefault();
            });

            element.addEventListener('mouseup', function (event) {
              that.state.left = that.state.middle = that.state.right = false;

              return event.preventDefault();
            });
          };

          root.MouseMonitor = MouseMonitor;
        }(window));

        +(function (root) {
          'use strict';

          var Particle = function Particle(generator, bounds, rctx, mon) {
            this.p = new Vector3D(); // position
            this.t = new Vector3D(); // trail to
            this.v = new Vector3D(); // velocity
            this.g = generator; // simplex noise generator
            this.b = bounds;    // window bounds for wrapping
            this.r = rctx;      // random context
            this.m = mon;       // mouse position monitor

            this.reset();
          }, pp = Particle.prototype;

          pp.reset = function () {
            // new random position
            this.p.x = this.t.x = Math.floor(this.r.random() * this.b.x);
            this.p.y = this.t.y = Math.floor(this.r.random() * this.b.y);

            // reset velocity
            this.v.set(1, 1, 0);

            // iteration and life
            this.i = 0;
            this.l = this.r.random(1000, 10000); // life time before particle respawns
          };

          pp.step = function () {
            if (this.i++ > this.l) {
              this.reset();
            }

            var xx = (this.p.x / 200),
              yy = (this.p.y / 200),
              zz = (Date.now() / 5000),
              a = (this.r.random() * Math.Tau),
              rnd = (this.r.random() / 4);

            // calculate the new velocity based on the noise
            // random velocity in a random direction
            this.v.x += (rnd * Math.sin(a) + this.g.simplex3d(xx, yy, -zz)); // sin or cos, no matter
            this.v.y += (rnd * Math.cos(a) + this.g.simplex3d(xx, yy, zz));  // opposite zz's matters

            if (this.m.state.left) {
              // add a difference between mouse pos and particle pos (a fraction of it) to the velocity.
              this.v.add(this.m.position.clone().sub(this.p).mul(.00085));
            }

            // repulse the particles if the right mouse button is down and the distance between
            // the mouse and particle is below an arbitrary value between 200 and 250.
            if (this.m.state.right && this.p.distance(this.m.position) < this.r.random(200, 250)) {
              this.v.add(this.p.clone().sub(this.m.position).mul(.02));
            }

            // time dilation field, stuff moves at 10% here, depending on distance
            if (this.m.state.middle) {
              var d = this.p.distance(this.m.position),
                l = this.r.random(200, 250);

              if (d < l) {
                this.v.mul(d / l);
              }
            }

            // keep a copy of the current position, for a nice line between then and now and add velocity
            this.p.move(this.t).add(this.v.mul(.94)); // slow down the velocity slightly

            // wrap around the edges
            if (this.p.wrap2d(this.b)) {
              this.p.move(this.t);
            }
          };

          // plot the line, but do not stroke yet.
          pp.render = function (context) {
            context.moveTo(this.t.x, this.t.y);
            context.lineTo(this.p.x, this.p.y);
          };

          root.Particle = Particle;
        }(window));

        // window.addEventListener('load', function () { // Removed wrapper
        {
          var rctx = new SmallPRNG(+new Date()), // random generator, see ref
            p = new Perlin(), // simplex noise generator
            canvas = stage.querySelector("#particleCanvas"),
            context = canvas.getContext("2d"),
            stats = new Stats(),
            monitor = new MouseMonitor(canvas),
            hue = 0, particles = [], resize,
            width, height, bounds = new Vector3D(0, 0, 0),
            settings = {
              particleNum: 5000,
              fadeOverlay: true,
              rotateColor: true,
              staticColor: { r: 0, g: 75, b: 50 },
              staticColorString: 'rgba(0, 75, 50, 0.55)'
            };

          // seed perlin with random bytes from SmallPRNG
          p.init(function () {
            // called for each permutation (256 times)
            return rctx.random(0, 255);
          });

          resize = function () {
            // resize the canvas
            canvas.width = width = bounds.x = stage.clientWidth;
            canvas.height = height = bounds.y = stage.clientHeight;

            // remove this and see weird gorgeous stuffs, the history of particles.
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
          }; resize();

          window.addEventListener('resize', resize);

          // generate a few particles
          for (var i = 0; i < settings.particleNum; i += 1) {
            particles.push(new Particle(p, bounds, rctx, monitor));
          }

          +(function render() {
            requestAnimFrame(render);

            stats.begin();
            context.beginPath();
            // render each particle and trail
            for (var i = 0; i < particles.length; i += 1) {
              particles[i].step(), particles[i].render(context);
            }

            context.globalCompositeOperation = 'source-over';
            if (settings.fadeOverlay) {
              context.fillStyle = 'rgba(0, 0, 0, .085)';
            } else {
              context.fillStyle = 'rgba(0, 0, 0, 1)';
            }
            context.fillRect(0, 0, width, height);

            context.globalCompositeOperation = 'lighter';
            if (settings.rotateColor) {
              context.strokeStyle = 'hsla(' + hue + ', 75%, 50%, .55)';
            } else {
              context.strokeStyle = settings.staticColorString;
            }
            context.stroke();
            context.closePath();

            stats.end();

            hue = ((hue + .5) % 360);
          }());
        }

      }
    },
    // Pen 4 – confetti sphere with Three.js modules
    {
      name: "threeConfetti",
      deps: [
        "https://ga.jspm.io/npm:es-module-shims@1.6.3/dist/es-module-shims.js"
      ],
      mount(stage) {
        // Inject the import map so the ES modules resolve:
        const importMap = document.createElement('script');
        importMap.type = 'importmap';
        importMap.textContent = JSON.stringify({
          imports: {
            "three": "https://unpkg.com/three@0.159.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.159.0/examples/jsm/"
          }
        });
        document.head.appendChild(importMap);

        // Create a container for the renderer
        stage.innerHTML = '<div id="three-container" style="width:100%;height:100%"></div>';

        // Dynamically import the module and run the animation
        import('three').then(THREE => {
          import('three/addons/controls/OrbitControls.js').then(module => {
            const OrbitControls = module.OrbitControls;
            // Paste the rest of the confetti code here, but render to
            // stage.querySelector('#three-container')



            (function () {
              const worldRadius = 5;
              const confettiSize = 0.07;
              const confettiNum = 3000;
              const rotateRange_x = Math.PI / 30;
              const rotateRange_y = Math.PI / 50;
              const speed_y = 0.01;
              const speed_x = 0.003;
              const speed_z = 0.005;

              let camera, scene, renderer, controls;
              let confettiMesh;
              const dummy = new THREE.Object3D();
              const matrix = new THREE.Matrix4();
              const color = new THREE.Color();

              init();

              function init() {
                const container = stage.querySelector('#three-container');
                camera = new THREE.PerspectiveCamera(
                  35,
                  container.clientWidth / container.clientHeight,
                  1,
                  worldRadius * 3
                );
                camera.position.z = worldRadius * Math.sqrt(2);

                scene = new THREE.Scene();

                function getRandomColor() {
                  let saturation = 100;
                  let lightness = 50;
                  const colors = [
                    "hsl(0, " + saturation + "%, " + lightness + "%)",
                    "hsl(30, " + saturation + "%, " + lightness + "%)",
                    "hsl(60, " + saturation + "%, " + lightness + "%)",
                    "hsl(90, " + saturation + "%, " + lightness + "%)",
                    "hsl(120, " + saturation + "%, " + lightness + "%)",
                    "hsl(150, " + saturation + "%, " + lightness + "%)",
                    "hsl(180, " + saturation + "%, " + lightness + "%)",
                    "hsl(210, " + saturation + "%, " + lightness + "%)",
                    "hsl(240, " + saturation + "%, " + lightness + "%)",
                    "hsl(270, " + saturation + "%, " + lightness + "%)",
                    "hsl(300, " + saturation + "%, " + lightness + "%)",
                    "hsl(330, " + saturation + "%, " + lightness + "%)"
                  ];
                  return colors[Math.floor(Math.random() * colors.length)];
                }

                const confettiGeometry = new THREE.PlaneGeometry(
                  confettiSize / 2,
                  confettiSize
                );
                const confettiMaterial = new THREE.MeshBasicMaterial({
                  color: 0xffffff,
                  side: THREE.DoubleSide
                });
                confettiMesh = new THREE.InstancedMesh(
                  confettiGeometry,
                  confettiMaterial,
                  confettiNum
                );

                for (let i = 0; i < confettiNum; i++) {
                  matrix.makeRotationFromEuler(
                    new THREE.Euler(
                      Math.random() * Math.PI,
                      Math.random() * Math.PI,
                      Math.random() * Math.PI
                    )
                  );
                  matrix.setPosition(
                    THREE.MathUtils.randFloat(-worldRadius, worldRadius),
                    THREE.MathUtils.randFloat(-worldRadius, worldRadius),
                    THREE.MathUtils.randFloat(-worldRadius, worldRadius)
                  );
                  confettiMesh.setMatrixAt(i, matrix);
                  confettiMesh.setColorAt(i, color.set(getRandomColor()));
                }
                scene.add(confettiMesh);

                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(container.clientWidth, container.clientHeight);
                renderer.shadowMap.enabled = false;
                container.appendChild(renderer.domElement);

                controls = new OrbitControls(camera, renderer.domElement);
                controls.target.y = 0.5;
                controls.autoRotate = true;
                controls.autoRotateSpeed = 2;
                controls.enableDamping = true;
                controls.enablePan = false; // Disable panning
                controls.mouseButtons = {
                  LEFT: THREE.MOUSE.ROTATE,
                  MIDDLE: THREE.MOUSE.ROTATE,
                  RIGHT: THREE.MOUSE.ROTATE
                };
                controls.minDistance = 1;
                controls.maxDistance = worldRadius * Math.sqrt(2);
                controls.minPolarAngle = 0;
                controls.maxPolarAngle = Math.PI / 2;
                controls.update();

                stage.addEventListener("click", animateConfetti);
                stage.addEventListener("contextmenu", (event) => {
                  event.preventDefault();
                  animateConfetti(event);
                });
                stage.addEventListener("mousedown", (event) => {
                  if (event.button === 1) {
                    animateConfetti(event);
                  }
                });

                animate();
                window.addEventListener("resize", onWindowResize);
              }

              function animateConfetti(event) {
                for (let i = 0; i < confettiNum; i++) {
                  confettiMesh.getMatrixAt(i, matrix);
                  matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                  dummy.position.y -= speed_y * ((i % 4) + 1);

                  if (dummy.position.y < -worldRadius) {
                    dummy.position.y = worldRadius;
                    dummy.position.x = THREE.MathUtils.randFloat(-worldRadius, worldRadius);
                    dummy.position.z = THREE.MathUtils.randFloat(-worldRadius, worldRadius);
                  } else {
                    if (i % 4 == 1) {
                      dummy.position.x += speed_x;
                      dummy.position.z += speed_z;
                    } else if (i % 4 == 2) {
                      dummy.position.x += speed_x;
                      dummy.position.z -= speed_z;
                    } else if (i % 4 == 3) {
                      dummy.position.x -= speed_x;
                      dummy.position.z += speed_z;
                    } else {
                      dummy.position.x -= speed_x;
                      dummy.position.z -= speed_z;
                    }
                  }

                  dummy.rotation.x += THREE.MathUtils.randFloat(0, rotateRange_x);
                  dummy.rotation.z += THREE.MathUtils.randFloat(0, rotateRange_y);

                  dummy.updateMatrix();
                  confettiMesh.setMatrixAt(i, dummy.matrix);
                }
                confettiMesh.instanceMatrix.needsUpdate = true;
              }

              function onWindowResize() {
                const container = stage.querySelector('#three-container');
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
              }

              function animate() {
                requestAnimationFrame(animate);
                controls.update();

                if (confettiMesh) {
                  for (let i = 0; i < confettiNum; i++) {
                    confettiMesh.getMatrixAt(i, matrix);
                    matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                    dummy.position.y -= speed_y * ((i % 4) + 1);

                    if (dummy.position.y < -worldRadius) {
                      dummy.position.y = worldRadius;
                      dummy.position.x = THREE.MathUtils.randFloat(
                        -worldRadius,
                        worldRadius
                      );
                      dummy.position.z = THREE.MathUtils.randFloat(
                        -worldRadius,
                        worldRadius
                      );
                    } else {
                      if (i % 4 == 1) {
                        dummy.position.x += speed_x;
                        dummy.position.z += speed_z;
                      } else if (i % 4 == 2) {
                        dummy.position.x += speed_x;
                        dummy.position.z -= speed_z;
                      } else if (i % 4 == 3) {
                        dummy.position.x -= speed_x;
                        dummy.position.z += speed_z;
                      } else {
                        dummy.position.x -= speed_x;
                        dummy.position.z -= speed_z;
                      }
                    }

                    dummy.rotation.x += THREE.MathUtils.randFloat(0, rotateRange_x);
                    dummy.rotation.z += THREE.MathUtils.randFloat(0, rotateRange_y);

                    dummy.updateMatrix();
                    confettiMesh.setMatrixAt(i, dummy.matrix);
                  }
                  confettiMesh.instanceMatrix.needsUpdate = true;
                }

                renderer.render(scene, camera);
              }
            })();

          });
        });
      }
    },
    // Pen 5 - Simple Particles
    {
      name: "simpleParticles",
      deps: [],
      mount(stage) {
        // Create canvas inside stage
        stage.innerHTML = '<canvas id="particleCanvas" style="display:block; width:100%; height:100%;"></canvas>';
        const canvas = stage.querySelector("#particleCanvas");
        const ctx = canvas.getContext("2d");

        // Fit canvas to stage dimensions
        const resize = () => {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        };
        resize();
        window.addEventListener("resize", () => {
          resize();
          particles.length = 0;
        });

        const particles = [];
        const maxParticles = 300; // Set a maximum limit for particles
        const colors = ["#FF5733", "#FFBD33", "#33FF57", "#3383FF", "#A833FF"];

        class Particle {
          constructor(x, y) {
            this.x = x !== undefined ? x : Math.random() * canvas.width;
            this.y = y !== undefined ? y : Math.random() * canvas.height;
            this.radius = Math.random() * 5 + 2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
          }

          move() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x <= 0 || this.x >= canvas.width) this.vx *= -1;
            if (this.y <= 0 || this.y >= canvas.height) this.vy *= -1;
          }

          draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
          }
        }

        function getClosest(particle) {
          return particles
            .map(p => ({ p, d: Math.hypot(p.x - particle.x, p.y - particle.y) }))
            .sort((a, b) => a.d - b.d)
            .slice(1, 2)
            .map(p => p.p)[0];
        }

        function drawLines() {
          particles.forEach(p => {
            const closest = getClosest(p);
            if (!closest) return;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(closest.x, closest.y);

            const gradient = ctx.createLinearGradient(p.x, p.y, closest.x, closest.y);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, closest.color);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });
        }

        let animationId;
        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawLines();
          particles.forEach(p => {
            p.move();
            p.draw();
          });
          animationId = requestAnimationFrame(animate);
        }

        animate();

        // Helper to add particle at event position (relative to canvas)
        function addParticleAtEvent(event) {
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          addParticle(x, y);
        }

        // Function to handle left-click
        function handleLeftClick(event) {
          if (event.button === 0) {
            addParticleAtEvent(event);
          }
        }

        // Function to handle right-click
        function handleRightClick(event) {
          event.preventDefault(); // Prevent the default context menu
          addParticleAtEvent(event);
        }

        // Function to handle middle mouse wheel click
        function handleMiddleClick(event) {
          if (event.button === 1) {
            addParticleAtEvent(event);
          }
        }

        // Function to handle hover
        function handleHover(event) {
          addParticleAtEvent(event);
        }

        // Function to add a particle and remove the oldest if max limit is reached
        function addParticle(x, y) {
          if (particles.length >= maxParticles) {
            particles.shift(); // Remove the oldest particle
          }
          particles.push(new Particle(x, y));
        }

        // Add event listeners to the stage instead of document
        // We use 'mousedown' for clicks to catch button state more easily if desired, 
        // but user had specific handlers.
        window.addEventListener('mousedown', handleLeftClick);
        window.addEventListener('contextmenu', handleRightClick);
        window.addEventListener('mousedown', handleMiddleClick);
        window.addEventListener('mousemove', handleHover);
      }
    },
    // Pen 6 - Pointer Particles
    {
      name: "pointerParticles",
      deps: [],
      mount(stage) {
        stage.style.overflow = 'hidden';

        class PointerParticle {
          constructor(spread, speed, component) {
            const { ctx, pointer, hue } = component;

            this.ctx = ctx;
            this.x = pointer.x;
            this.y = pointer.y;
            this.mx = pointer.mx * 0.1;
            this.my = pointer.my * 0.1;
            this.size = Math.random() + 2;
            this.decay = 0.01;
            this.speed = speed * 0.08;
            this.spread = spread * this.speed;
            this.spreadX = (Math.random() - 0.5) * this.spread - this.mx;
            this.spreadY = (Math.random() - 0.5) * this.spread - this.my;
            this.color = `hsl(${hue}deg 90% 60%)`;
          }

          draw() {
            this.ctx.fillStyle = this.color;
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            this.ctx.fill();
          }

          collapse() {
            this.size -= this.decay;
          }

          trail() {
            this.x += this.spreadX * this.size;
            this.y += this.spreadY * this.size;
          }

          update() {
            this.draw();
            this.trail();
            this.collapse();
          }
        }

        class PointerParticles extends HTMLElement {
          static register(tag = "pointer-particles") {
            if ("customElements" in window && !customElements.get(tag)) {
              customElements.define(tag, this);
            }
          }

          static css = `
            :host {
              display: grid;
              width: 100%;
              height: 100%;
              pointer-events: none;
            }
          `;

          constructor() {
            super();

            this.canvas;
            this.ctx;
            this.fps = 60;
            this.msPerFrame = 1000 / this.fps;
            this.timePrevious;
            this.particles = [];
            this.pointer = {
              x: 0,
              y: 0,
              mx: 0,
              my: 0
            };
            this.hue = 0;
          }

          connectedCallback() {
            const canvas = document.createElement("canvas");
            const sheet = new CSSStyleSheet();

            this.shadowroot = this.attachShadow({ mode: "open" });

            sheet.replaceSync(PointerParticles.css);
            this.shadowroot.adoptedStyleSheets = [sheet];

            this.shadowroot.append(canvas);

            this.canvas = this.shadowroot.querySelector("canvas");
            this.ctx = this.canvas.getContext("2d");
            this.setCanvasDimensions();
            this.setupEvents();
            this.timePrevious = performance.now();
            this.animateParticles();
          }

          createParticles(event, { count, speed, spread }) {
            this.setPointerValues(event);

            for (let i = 0; i < count; i++) {
              this.particles.push(new PointerParticle(spread, speed, this));
            }
          }

          setPointerValues(event) {
            const rect = this.parentNode.getBoundingClientRect();
            this.pointer.x = event.clientX - rect.left;
            this.pointer.y = event.clientY - rect.top;
            this.pointer.mx = event.movementX;
            this.pointer.my = event.movementY;
          }

          setupEvents() {
            const parent = this.parentNode;

            window.addEventListener("click", (event) => {
              this.createParticles(event, {
                count: 300,
                speed: Math.random() + 1,
                spread: Math.random() + 50
              });
            });

            window.addEventListener("contextmenu", (event) => {
              event.preventDefault(); // Prevent the default context menu
              this.createParticles(event, {
                count: 300,
                speed: Math.random() + 1,
                spread: Math.random() + 50
              });
            });

            window.addEventListener("mousedown", (event) => {
              if (event.button === 1) {
                // Check if the middle mouse button is pressed
                this.createParticles(event, {
                  count: 300,
                  speed: Math.random() + 1,
                  spread: Math.random() + 50
                });
              }
            });

            window.addEventListener("pointermove", (event) => {
              this.createParticles(event, {
                count: 20,
                speed: this.getPointerVelocity(event),
                spread: 1
              });
            });

            window.addEventListener("resize", () => this.setCanvasDimensions());
          }

          getPointerVelocity(event) {
            const a = event.movementX;
            const b = event.movementY;
            const c = Math.floor(Math.sqrt(a * a + b * b));

            return c;
          }

          handleParticles() {
            for (let i = 0; i < this.particles.length; i++) {
              this.particles[i].update();

              if (this.particles[i].size <= 0.1) {
                this.particles.splice(i, 1);
                i--;
              }
            }
          }

          setCanvasDimensions() {
            const rect = this.parentNode.getBoundingClientRect();

            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
          }

          animateParticles() {
            requestAnimationFrame(() => this.animateParticles());

            const timeNow = performance.now();
            if (!this.timePrevious) this.timePrevious = timeNow;
            const timePassed = timeNow - this.timePrevious;

            if (timePassed < this.msPerFrame) return;

            const excessTime = timePassed % this.msPerFrame;

            this.timePrevious = timeNow - excessTime;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.hue = this.hue > 360 ? 0 : (this.hue += 3);

            this.handleParticles();
          }
        }

        PointerParticles.register();
        stage.innerHTML = '<pointer-particles></pointer-particles>';
      }
    },
    // Pen 7 - Bubbles
    {
      name: "bubbles",
      deps: [],
      mount(stage) {
        // --- System Parameters (Recommended)--- 
        let bNum = 3;
        let bSize = 12;
        let bSpeed = 3;
        let bDep = 0.03;
        let bDist = 25;

        // --- Main Program --- 
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;
        stage.appendChild(canvas);

        let spots = [];
        let hue = 0;

        const mouse = {
          x: undefined,
          y: undefined
        }

        // Generate initial particles so it's not empty
        class Particle {
          constructor() {
            this.x = mouse.x;
            this.y = mouse.y;
            this.size = Math.random() * bSize + 0.1;
            this.speedX = Math.random() * bSpeed - bSpeed / 2;
            this.speedY = Math.random() * bSpeed - bSpeed / 2;
            this.color = "hsl(" + hue + ", 100%, 50%)";
            this.deg = 0;
          }
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(this.x, this.y, this.size, this.size, 2);
            } else {
              ctx.rect(this.x, this.y, this.size, this.size);
            }
            ctx.rotate(this.deg);
            ctx.stroke();
          }
          update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size > bDep) this.size -= bDep;
          }
        }

        console.log("Bubbles Pen: Generating initial particles");
        for (let i = 0; i < 20; i++) {
          mouse.x = Math.random() * canvas.width;
          mouse.y = Math.random() * canvas.height;
          for (let j = 0; j < bNum; j++) {
            spots.push(new Particle());
          }
        }

        function handleMouseMove(event) {
          const rect = canvas.getBoundingClientRect();
          mouse.x = event.clientX - rect.left;
          mouse.y = event.clientY - rect.top;

          for (let i = 0; i < bNum; i++) {
            spots.push(new Particle());
          }
        }

        window.addEventListener("mousemove", handleMouseMove);

        function handleResize() {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        }

        window.addEventListener("resize", handleResize);



        function handleParticle() {
          for (let i = 0; i < spots.length; i++) {
            spots[i].update();
            spots[i].draw();
            for (let j = i; j < spots.length; j++) {
              const dx = spots[i].x - spots[j].x;
              const dy = spots[i].y - spots[j].y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < bDist) {
                ctx.beginPath();
                ctx.strokeStyle = spots[i].color;
                ctx.lineWidth = spots[i].size / 3;
                ctx.moveTo(spots[i].x, spots[i].y);
                ctx.bezierCurveTo(spots[j].x, spots[j].y, spots[j].x, spots[i].y, spots[j].x, spots[j].y);
                ctx.stroke();
              }
            }
            if (spots[i].size <= bDep) {
              spots.splice(i, 1);
              i--;
            }
          }
        }

        let animationId;
        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          handleParticle();
          hue++;
          animationId = requestAnimationFrame(animate);
        }

        animate();

        function handleLeftClick(event) {
          if (event.button === 0) {
            console.log("Left click detected");
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
            for (let i = 0; i < bNum; i++) {
              spots.push(new Particle());
            }
          }
        }

        function handleRightClick(event) {
          event.preventDefault();
          console.log("Right click detected");
          const rect = canvas.getBoundingClientRect();
          mouse.x = event.clientX - rect.left;
          mouse.y = event.clientY - rect.top;
          for (let i = 0; i < bNum; i++) {
            spots.push(new Particle());
          }
        }

        function handleMiddleClick(event) {
          if (event.button === 1) {
            console.log("Middle mouse wheel click detected");
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
            for (let i = 0; i < bNum; i++) {
              spots.push(new Particle());
            }
          }
        }

        canvas.addEventListener("mousedown", handleLeftClick);
        canvas.addEventListener("contextmenu", handleRightClick);
        canvas.addEventListener("mousedown", handleMiddleClick);
      }
    },

    // Pen 8 - Connected Particles
    {
      name: "connectedParticles",
      deps: [],
      mount(stage) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;
        stage.appendChild(canvas);

        let spots = [];
        let hue = 0;

        const mouse = {
          x: undefined,
          y: undefined
        }

        window.addEventListener("mousemove", function (event) {
          const rect = canvas.getBoundingClientRect();
          mouse.x = event.clientX - rect.left;
          mouse.y = event.clientY - rect.top;

          for (let i = 0; i < 3; i++) {
            spots.push(new Particle());
          }
        })

        class Particle {
          constructor() {
            this.x = mouse.x;
            this.y = mouse.y;
            this.size = Math.random() * 2 + 0.1;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.color = "hsl(" + hue + ", 100%, 50%)";
          }
          update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size > 0.2) this.size -= 0.01;
          }
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        function handleParticle() {
          for (let i = 0; i < spots.length; i++) {
            spots[i].update();
            spots[i].draw();
            for (let j = i; j < spots.length; j++) {
              const dx = spots[i].x - spots[j].x;
              const dy = spots[i].y - spots[j].y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 90) {
                ctx.beginPath();
                ctx.strokeStyle = spots[i].color;
                ctx.lineWidth = spots[i].size / 10;
                ctx.moveTo(spots[i].x, spots[i].y);
                ctx.lineTo(spots[j].x, spots[j].y);
                ctx.stroke();
              }
            }
            if (spots[i].size <= 0.3) {
              spots.splice(i, 1);
              i--;
            }
          }
        }

        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          handleParticle();
          hue++;
          requestAnimationFrame(animate);
        }

        window.addEventListener("resize", function () {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        })

        stage.addEventListener("mouseout", function () {
          mouse.x = undefined;
          mouse.y = undefined;
        })

        animate();

        // Function to handle left-click
        function handleLeftClick(event) {
          if (event.button === 0) {
            console.log("Left click detected");
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
            for (let i = 0; i < 3; i++) {
              spots.push(new Particle());
            }
          }
        }

        // Function to handle right-click
        function handleRightClick(event) {
          event.preventDefault(); // Prevent the default context menu
          console.log("Right click detected");
          const rect = canvas.getBoundingClientRect();
          mouse.x = event.clientX - rect.left;
          mouse.y = event.clientY - rect.top;
          for (let i = 0; i < 3; i++) {
            spots.push(new Particle());
          }
        }

        // Function to handle middle mouse wheel click
        function handleMiddleClick(event) {
          if (event.button === 1) {
            console.log("Middle mouse wheel click detected");
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
            for (let i = 0; i < 3; i++) {
              spots.push(new Particle());
            }
          }
        }

        // Add event listeners to the relevant element
        stage.addEventListener("mousedown", handleLeftClick);
        stage.addEventListener("contextmenu", handleRightClick);
        stage.addEventListener("mousedown", handleMiddleClick);
      }
    },
    // Pen 9 - Hold Particles
    {
      name: "holdParticles",
      deps: [],
      mount(stage) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        stage.appendChild(canvas);

        const mouse = {
          x: undefined,
          y: undefined,
        }

        const holdParticles = [];
        let hue = 0;

        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;

        function handleResize() {
          canvas.width = stage.clientWidth;
          canvas.height = stage.clientHeight;
        }
        window.addEventListener('resize', handleResize);

        function handleMouseClick(event) {
          const rect = canvas.getBoundingClientRect();
          mouse.x = event.clientX - rect.left;
          mouse.y = event.clientY - rect.top;
          for (let i = 0; i < 2; i++) {
            holdParticles.push(new Particle());
          }
        }
        stage.addEventListener('click', handleMouseClick);

        function handleMouseMove(event) {
          const rect = canvas.getBoundingClientRect();
          mouse.x = event.clientX - rect.left;
          mouse.y = event.clientY - rect.top;
          for (let i = 0; i < 2; i++) {
            holdParticles.push(new Particle());
          }
        }
        window.addEventListener('mousemove', handleMouseMove);

        class Particle {
          constructor() {
            this.x = mouse.x;
            this.y = mouse.y;
            this.size = Math.random() * 5 + 1;
            this.speedX = Math.random() * 3 - 1.5;
            this.speedY = Math.random() * 3 - 1.5;
            this.color = `hsl(${hue}, 100%, 50%)`;
          }
          update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size >= 1) this.size -= 0.2;
          }
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        function handleParticles() {
          for (let i = 0; i < holdParticles.length; i++) {
            holdParticles[i].update();
            holdParticles[i].draw();
            if (holdParticles[i].size <= 0.5) {
              holdParticles.splice(i, 1);
              i--;
            }
          }
        }

        function animate() {
          ctx.fillStyle = 'rgba(0,0,0,0.01)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // ctx.fill(); // fillRect already fills

          handleParticles();
          hue++;

          requestAnimationFrame(animate);
        }

        animate();

        // Function to handle left-click
        function handleLeftClick(event) {
          if (event.button === 0) {
            console.log("Left click detected");
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
            for (let i = 0; i < 2; i++) {
              holdParticles.push(new Particle());
            }
          }
        }

        // Function to handle right-click
        function handleRightClick(event) {
          event.preventDefault();
          console.log("Right click detected");
          const rect = canvas.getBoundingClientRect();
          mouse.x = event.clientX - rect.left;
          mouse.y = event.clientY - rect.top;
          for (let i = 0; i < 2; i++) {
            holdParticles.push(new Particle());
          }
        }

        // Function to handle middle mouse wheel click
        function handleMiddleClick(event) {
          if (event.button === 1) {
            console.log("Middle mouse wheel click detected");
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
            for (let i = 0; i < 2; i++) {
              holdParticles.push(new Particle());
            }
          }
        }

        stage.addEventListener("mousedown", handleLeftClick);
        stage.addEventListener("contextmenu", handleRightClick);
        stage.addEventListener("mousedown", handleMiddleClick);
      }
    }
  ];



  function pickRandomPen() {
    return pens[Math.floor(Math.random() * pens.length)];
    // return pens.find(p => p.name === "bubbles"); // Force bubbles for debugging
  }

  async function run() {
    // 1. Check if Intro should run
    if (hasSeen()) {
      hideOverlay();
      return;
    }

    // 2. Start Intro Animation immediately (Text Scramble)
    showOverlay();
    // This is async but we don't wait for it; visuals start immediately
    runIntroAnimation();

    // 3. Initialize Background Pen (Particles)
    // Run this in parallel so it doesn't block the intro text start
    const stage = document.getElementById("intro-stage");
    if (stage) {
      const pen = pickRandomPen();
      if (pen) {
        console.log("%c Running Pen: " + pen.name, "background: #222; color: #bada55; font-size: 20px; padding: 10px; border-radius: 5px;");
        // Load dependencies and mount
        (async () => {
          for (const dep of pen.deps) {
            try { await loadScript(dep); } catch (e) { }
          }
          try { pen.mount(stage); } catch (e) { }
        })();
      }
    }
  }

  // Run after Webflow finishes
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();


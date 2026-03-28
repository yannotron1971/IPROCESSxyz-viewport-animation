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
      welcomeName: "Welcome 1",
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
        var particleNum = stage.clientWidth < 768 ? 400 : Math.min(Math.round(stage.clientWidth * stage.clientHeight / 2073), 1000);
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

        function paintParticle(idx) {
          var o = idx * STRIDE;
          pBuf[o + X]  = mouseX + (Math.random() - 0.5) * 10;
          pBuf[o + Y]  = mouseY + (Math.random() - 0.5) * 10;
          pBuf[o + PX] = pBuf[o + X]; pBuf[o + PY] = pBuf[o + Y];
          pBuf[o + PH] = hueBase + Math.atan2(cy - pBuf[o + Y], cx - pBuf[o + X]) * DEG;
          pBuf[o + PS] = 1; pBuf[o + PL] = 0.5; pBuf[o + PA] = 0.8;
          pBuf[o + VX] = (Math.random() - 0.5) * 0.5;
          pBuf[o + VY] = (Math.random() - 0.5) * 0.5;
          pBuf[o + LF] = 0;
          pBuf[o + ML] = MIN_LIFE + Math.random() * (MAX_LIFE - MIN_LIFE);
          pBuf[o + NM] = 0;
        }

        function resetNoise() {
          ctx.clearRect(0, 0, W, H);
          simplex = new SimplexNoise();
          particleNum = stage.clientWidth < 768 ? 400 : Math.min(Math.round(stage.clientWidth * stage.clientHeight / 2073), 1000);
          for (var i = 0; i < particleNum; i++) seedParticle(i);
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
            var paintCount = canvas.width < 768 ? 2 : 5;
            for (var i = 0; i < paintCount; i++) paintParticle(Math.floor(Math.random() * particleNum));
          }
        });

        canvas.addEventListener('mousedown', (e) => {
          mouseX = e.clientX - stage.getBoundingClientRect().left;
          mouseY = e.clientY - stage.getBoundingClientRect().top;
          if (e.button === 0) { mL = true; clickTimer = setTimeout(() => { clickTimer = null; }, CLICK_THRESHOLD); }
          if (e.button === 1) { e.preventDefault(); resetNoise(); }
          if (e.button === 2) mR = true;
        });

        canvas.addEventListener('mouseup', (e) => {
          if (e.button === 0) {
            mL = false;
            if (clickTimer !== null) {
              clearTimeout(clickTimer); clickTimer = null;
              var burst = Math.max(20, Math.round(particleNum * 0.20));
              for (var i = 0; i < burst; i++) paintParticle(Math.floor(Math.random() * particleNum));
            }
          }
          if (e.button === 2) mR = false;
        });

        canvas.addEventListener('mouseleave', () => {
          mL = false; mR = false;
          if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        });

        let resizeTimer = null;

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('mouseup', (e) => { if (e.button === 2) mR = false; });
        canvas.addEventListener('touchstart', function(e) {
          if (e.touches.length) {
            var rect = stage.getBoundingClientRect();
            mouseX = e.touches[0].clientX - rect.left;
            mouseY = e.touches[0].clientY - rect.top;
            mL = true;
          }
        }, false);
        canvas.addEventListener('touchend', function() { mL = false; }, false);
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            setupCanvas();
            particleNum = stage.clientWidth < 768 ? 400 : Math.min(Math.round(stage.clientWidth * stage.clientHeight / 2073), 1000);
          }, 200);
        });
        document.addEventListener('visibilitychange', function() {
          if (document.hidden) cancelAnimationFrame(animationId);
          else update();
        });

        update();
      }
    },

    // Pen 2 – Particle Network (custom, no CDN)
    {
      name: "tsParticles",
      welcomeName: "Welcome 2",
      deps: [],
      mount(stage) {
        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
        stage.appendChild(canvas);

        var LINK_DIST=100, GRAB_DIST=400, MOVE_SPEED=5, MAX_SIZE=3, P_OPACITY=0.5, LINK_WIDTH=2;
        var TRI_R=5, TRI_G=240, TRI_B=231, TRI_A=0.2;
        var FPS_LIMIT=60, HUE_SPEED=1, EXPLODE_R=200, TAU=Math.PI*2, CLICK_THRESHOLD=200;
        var MAX_SPAWN=400, MAX_NEIGH=8, MAX_LINKS=MAX_SPAWN*MAX_NEIGH, ADJ_COLS=MAX_NEIGH;
        var linkA=new Int16Array(MAX_LINKS), linkB=new Int16Array(MAX_LINKS), linkD=new Float32Array(MAX_LINKS);
        var adjBuf=new Int16Array(MAX_SPAWN*ADJ_COLS), adjLen=new Int16Array(MAX_SPAWN);
        var adjMat=new Uint8Array(MAX_SPAWN*MAX_SPAWN);
        var ctx, W, H, dpr, particles=[], hue=0, mouseX=0, mouseY=0, mouseActive=false;
        var rafId=0, lastTime=0, minDt=1000/FPS_LIMIT, mR=false, mM=false, mL=false, clickTimer=null;

        function calcCount() { return Math.min(stage.clientWidth<768?40:Math.round(stage.clientWidth*stage.clientHeight/10000),400); }
        function calcBurst() { return Math.max(4,Math.round(stage.clientWidth*stage.clientHeight/207360)); }
        var PARTICLE_COUNT=calcCount(), CLICK_BURST=calcBurst();

        function Particle(x,y) {
          this.x=x!=null?x:Math.random()*W; this.y=y!=null?y:Math.random()*H;
          this.s=(Math.random()*MAX_SIZE+0.5)*dpr;
          this.vx=Math.random()-0.5; this.vy=Math.random()-0.5;
          this.hue=(Math.random()*360)|0;
        }

        function resize() {
          dpr=Math.min(window.devicePixelRatio||1,1.5);
          W=stage.clientWidth*dpr; H=stage.clientHeight*dpr;
          canvas.width=W; canvas.height=H;
          canvas.style.width=stage.clientWidth+'px'; canvas.style.height=stage.clientHeight+'px';
          ctx=canvas.getContext('2d');
          PARTICLE_COUNT=calcCount(); CLICK_BURST=calcBurst();
        }

        function spawnBurst(ex,ey) {
          var r=canvas.getBoundingClientRect();
          var mx2=(ex-r.left)*dpr, my2=(ey-r.top)*dpr;
          for (var i=0;i<CLICK_BURST;i++) {
            if (particles.length>=MAX_SPAWN) return;
            particles.push(new Particle(mx2+(Math.random()-0.5)*20*dpr, my2+(Math.random()-0.5)*20*dpr));
          }
        }

        resize();
        for (var i=0;i<PARTICLE_COUNT;i++) particles.push(new Particle());

        canvas.addEventListener('mousemove',function(e){var r=canvas.getBoundingClientRect();mouseX=(e.clientX-r.left)*dpr;mouseY=(e.clientY-r.top)*dpr;mouseActive=true;});
        canvas.addEventListener('mouseleave',function(){mouseActive=false;mR=false;mM=false;mL=false;if(clickTimer){clearTimeout(clickTimer);clickTimer=null;}});
        canvas.addEventListener('mousedown',function(e){var r=canvas.getBoundingClientRect();mouseX=(e.clientX-r.left)*dpr;mouseY=(e.clientY-r.top)*dpr;mouseActive=true;if(e.button===0){mL=true;clickTimer=setTimeout(function(){clickTimer=null;},CLICK_THRESHOLD);}if(e.button===1){e.preventDefault();mM=true;}if(e.button===2)mR=true;});
        canvas.addEventListener('mouseup',function(e){if(e.button===0){mL=false;if(clickTimer!==null){clearTimeout(clickTimer);clickTimer=null;spawnBurst(e.clientX,e.clientY);}}if(e.button===1)mM=false;if(e.button===2)mR=false;});
        window.addEventListener('mouseup',function(e){if(e.button===2)mR=false;});
        canvas.addEventListener('contextmenu',function(e){e.preventDefault();mR=true;});
        canvas.addEventListener('touchstart',function(e){var t=e.touches[0];spawnBurst(t.clientX,t.clientY);},{passive:true});
        canvas.addEventListener('touchmove',function(e){var t=e.touches[0],r=canvas.getBoundingClientRect();mouseX=(t.clientX-r.left)*dpr;mouseY=(t.clientY-r.top)*dpr;mouseActive=true;},{passive:true});
        canvas.addEventListener('touchend',function(){mouseActive=false;});
        var resizeTimer2;
        window.addEventListener('resize',function(){clearTimeout(resizeTimer2);resizeTimer2=setTimeout(resize,200);});
        document.addEventListener('visibilitychange',function(){if(document.hidden)cancelAnimationFrame(rafId);else{lastTime=performance.now();loop(lastTime);}});

        lastTime=performance.now(); loop(lastTime);

        function loop(now) {
          rafId=requestAnimationFrame(loop);
          var dt=now-lastTime; if(dt<minDt)return; lastTime=now-(dt%minDt);
          ctx.clearRect(0,0,W,H);
          var n=particles.length, spd=MOVE_SPEED*dpr*0.5, ld=LINK_DIST*dpr, ld2=ld*ld;
          var ed=EXPLODE_R*dpr, gd=GRAB_DIST*dpr, gd2=gd*gd;
          hue=(hue+HUE_SPEED)%360; var h=hue|0;
          var i,p,ddx,ddy,dist,f;
          for(i=0;i<n;i++){
            p=particles[i];
            if(mL&&clickTimer===null&&mouseActive){p.vx+=(mouseX-p.x)*0.0003;p.vy+=(mouseY-p.y)*0.0003;p.vx*=0.92;p.vy*=0.92;}
            if(mR&&mouseActive){ddx=p.x-mouseX;ddy=p.y-mouseY;dist=Math.sqrt(ddx*ddx+ddy*ddy);if(dist<ed&&dist>0){f=(1-dist/ed)*0.3;p.vx+=(ddx/dist)*f;p.vy+=(ddy/dist)*f;}}
            if(mM&&mouseActive){ddx=p.x-mouseX;ddy=p.y-mouseY;dist=Math.sqrt(ddx*ddx+ddy*ddy);if(dist<ed){f=dist/ed;p.vx*=f;p.vy*=f;}}
            p.x+=p.vx*spd;p.y+=p.vy*spd;
            if(p.x<-p.s)p.x+=W+p.s*2;else if(p.x>W+p.s)p.x-=W+p.s*2;
            if(p.y<-p.s)p.y+=H+p.s*2;else if(p.y>H+p.s)p.y-=H+p.s*2;
          }
          var lc=0,j,dx,dy,d2,ai,aj;
          for(i=0;i<n;i++)adjLen[i]=0;
          for(i=0;i<n;i++){var pi=particles[i];for(j=i+1;j<n;j++){if(adjLen[i]>=MAX_NEIGH||adjLen[j]>=MAX_NEIGH)continue;var pj=particles[j];dx=pi.x-pj.x;dy=pi.y-pj.y;d2=dx*dx+dy*dy;if(d2<ld2){linkA[lc]=i;linkB[lc]=j;linkD[lc]=Math.sqrt(d2);lc++;adjMat[i*MAX_SPAWN+j]=1;adjMat[j*MAX_SPAWN+i]=1;ai=adjLen[i];adjBuf[i*ADJ_COLS+ai]=j;adjLen[i]++;aj=adjLen[j];adjBuf[j*ADJ_COLS+aj]=i;adjLen[j]++;}}}
          ctx.fillStyle='rgba('+TRI_R+','+TRI_G+','+TRI_B+','+TRI_A+')';ctx.beginPath();
          for(var li=0;li<lc;li++){var a=linkA[li],b=linkB[li],naLen=adjLen[a];for(var ni=0;ni<naLen;ni++){var c=adjBuf[a*ADJ_COLS+ni];if(c<=b)continue;if(adjMat[b*MAX_SPAWN+c]){ctx.moveTo(particles[a].x,particles[a].y);ctx.lineTo(particles[b].x,particles[b].y);ctx.lineTo(particles[c].x,particles[c].y);ctx.closePath();}}}
          ctx.fill();
          for(var li=0;li<lc;li++){adjMat[linkA[li]*MAX_SPAWN+linkB[li]]=0;adjMat[linkB[li]*MAX_SPAWN+linkA[li]]=0;}
          ctx.lineWidth=LINK_WIDTH*dpr;
          for(var li=0;li<lc;li++){var opacity=1-linkD[li]/ld;ctx.strokeStyle='hsla('+particles[linkA[li]].hue+',100%,50%,'+opacity+')';ctx.beginPath();ctx.moveTo(particles[linkA[li]].x,particles[linkA[li]].y);ctx.lineTo(particles[linkB[li]].x,particles[linkB[li]].y);ctx.stroke();}
          if(mouseActive){ctx.lineWidth=dpr;ctx.strokeStyle='hsla('+h+',100%,50%,0.3)';ctx.beginPath();for(i=0;i<n;i++){p=particles[i];dx=p.x-mouseX;dy=p.y-mouseY;d2=dx*dx+dy*dy;if(d2<gd2){ctx.moveTo(mouseX,mouseY);ctx.lineTo(p.x,p.y);}}ctx.stroke();}
          ctx.fillStyle='hsla('+h+',100%,50%,'+P_OPACITY+')';ctx.beginPath();
          for(i=0;i<n;i++){p=particles[i];ctx.moveTo(p.x+p.s,p.y);ctx.arc(p.x,p.y,p.s,0,TAU);}
          ctx.fill();
        }
      }
    },

    // Pen 3 – PRNG Noise Swarm
    {
      name: "prngSwarm",
      welcomeName: "Welcome 3",
      deps: [],
      mount(stage) {
        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
        stage.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        var TAU=Math.PI*2, CLICK_THRESHOLD=200;

        function PRNG(seed){this.s=(seed>>>0)||1;}
        PRNG.prototype.random=function(min,max){this.s^=this.s<<13;this.s^=this.s>>17;this.s^=this.s<<5;var v=(this.s>>>0)/4294967296;return min===undefined?v:min+v*(max-min);};

        var GRAD3=[1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1];
        var F3=1/3,G3=1/6,perm3=new Uint8Array(512),gradP3=new Uint16Array(512);
        function initNoise(rng){
          var p=[0x97,0xa0,0x89,0x5b,0x5a,0x0f,0x83,0x0d,0xc9,0x5f,0x60,0x35,0xc2,0xe9,0x07,0xe1,0x8c,0x24,0x67,0x1e,0x45,0x8e,0x08,0x63,0x25,0xf0,0x15,0x0a,0x17,0xbe,0x06,0x94,0xf7,0x78,0xea,0x4b,0x00,0x1a,0xc5,0x3e,0x5e,0xfc,0xdb,0xcb,0x75,0x23,0x0b,0x20,0x39,0xb1,0x21,0x58,0xed,0x95,0x38,0x57,0xae,0x14,0x7d,0x88,0xab,0xa8,0x44,0xaf,0x4a,0xa5,0x47,0x86,0x8b,0x30,0x1b,0xa6,0x4d,0x92,0x9e,0xe7,0x53,0x6f,0xe5,0x7a,0x3c,0xd3,0x85,0xe6,0xdc,0x69,0x5c,0x29,0x37,0x2e,0xf5,0x28,0xf4,0x66,0x8f,0x36,0x41,0x19,0x3f,0xa1,0x01,0xd8,0x50,0x49,0xd1,0x4c,0x84,0xbb,0xd0,0x59,0x12,0xa9,0xc8,0xc4,0x87,0x82,0x74,0xbc,0x9f,0x56,0xa4,0x64,0x6d,0xc6,0xad,0xba,0x03,0x40,0x34,0xd9,0xe2,0xfa,0x7c,0x7b,0x05,0xca,0x26,0x93,0x76,0x7e,0xff,0x52,0x55,0xd4,0xcf,0xce,0x3b,0xe3,0x2f,0x10,0x3a,0x11,0xb6,0xbd,0x1c,0x2a,0xdf,0xb7,0xaa,0xd5,0x77,0xf8,0x98,0x02,0x2c,0x9a,0xa3,0x46,0xdd,0x99,0x65,0x9b,0xa7,0x2b,0xac,0x09,0x81,0x16,0x27,0xfd,0x13,0x62,0x6c,0x6e,0x4f,0x71,0xe0,0xe8,0xb2,0xb9,0x70,0x68,0xda,0xf6,0x61,0xe4,0xfb,0x22,0xf2,0xc1,0xee,0xd2,0x90,0x0c,0xbf,0xb3,0xa2,0xf1,0x51,0x33,0x91,0xeb,0xf9,0x0e,0xef,0x6b,0x31,0xc0,0xd6,0x1f,0xb5,0xc7,0x6a,0x9d,0xb8,0x54,0xcc,0xb0,0x73,0x79,0x32,0x2d,0x7f,0x04,0x96,0xfe,0x8a,0xec,0xcd,0x5d,0xde,0x72,0x43,0x1d,0x18,0x48,0xf3,0x8d,0x80,0xc3,0x4e,0x42,0xd7,0x3d,0x9c,0xb4];
          for(var i=0;i<256;i++){var r=p[i]^(Math.floor(rng.random(0,256)));perm3[i]=perm3[i+256]=r;gradP3[i]=gradP3[i+256]=(r%12)*3;}
        }
        function noise3D(x,y,z){
          var s=(x+y+z)*F3,i=Math.floor(x+s),j=Math.floor(y+s),k=Math.floor(z+s);
          var t=(i+j+k)*G3,x0=x-i+t,y0=y-j+t,z0=z-k+t;
          var i1,j1,k1,i2,j2,k2;
          if(x0>=y0){if(y0>=z0){i1=1;j1=0;k1=0;i2=1;j2=1;k2=0;}else if(x0>=z0){i1=1;j1=0;k1=0;i2=1;j2=0;k2=1;}else{i1=0;j1=0;k1=1;i2=1;j2=0;k2=1;}}else{if(y0<z0){i1=0;j1=0;k1=1;i2=0;j2=1;k2=1;}else if(x0<z0){i1=0;j1=1;k1=0;i2=0;j2=1;k2=1;}else{i1=0;j1=1;k1=0;i2=1;j2=1;k2=0;}}
          var x1=x0-i1+G3,y1=y0-j1+G3,z1=z0-k1+G3,x2=x0-i2+2*G3,y2=y0-j2+2*G3,z2=z0-k2+2*G3,x3=x0-0.5,y3=y0-0.5,z3=z0-0.5;
          i&=255;j&=255;k&=255;
          var gi0=gradP3[i+perm3[j+perm3[k]]],gi1=gradP3[i+i1+perm3[j+j1+perm3[k+k1]]],gi2=gradP3[i+i2+perm3[j+j2+perm3[k+k2]]],gi3=gradP3[i+1+perm3[j+1+perm3[k+1]]];
          var t0=0.6-x0*x0-y0*y0-z0*z0,t1=0.6-x1*x1-y1*y1-z1*z1,t2=0.6-x2*x2-y2*y2-z2*z2,t3=0.6-x3*x3-y3*y3-z3*z3;
          var n0=t0<0?0:(t0*=t0,t0*t0*(GRAD3[gi0]*x0+GRAD3[gi0+1]*y0+GRAD3[gi0+2]*z0));
          var n1=t1<0?0:(t1*=t1,t1*t1*(GRAD3[gi1]*x1+GRAD3[gi1+1]*y1+GRAD3[gi1+2]*z1));
          var n2=t2<0?0:(t2*=t2,t2*t2*(GRAD3[gi2]*x2+GRAD3[gi2+1]*y2+GRAD3[gi2+2]*z2));
          var n3=t3<0?0:(t3*=t3,t3*t3*(GRAD3[gi3]*x3+GRAD3[gi3+1]*y3+GRAD3[gi3+2]*z3));
          return 32*(n0+n1+n2+n3);
        }

        var STRIDE3=8,PX3=0,PY3=1,TX3=2,TY3=3,VX3=4,VY3=5,LF3=6,ML3=7;
        var MAX_NUM3=16384;
        function calcNum3(){return Math.min(Math.round(stage.clientWidth*stage.clientHeight/253),MAX_NUM3);}
        function calcBurst3(){return Math.max(4,Math.round(stage.clientWidth*stage.clientHeight/207360));}
        var NUM3=calcNum3(),buf3;
        var mx3=0,my3=0,mL3=false,mM3=false,mR3=false,clickTimer3=null;
        var W3,H3,hue3=0,rng3;
        var elapsed3=Math.random()*100000,lastTs3=null;

        function getCoords3(e){var r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}

        function resetParticle3(i){
          var o=i*STRIDE3,px=Math.floor(rng3.random()*W3),py=Math.floor(rng3.random()*H3);
          buf3[o+PX3]=px;buf3[o+PY3]=py;buf3[o+TX3]=px;buf3[o+TY3]=py;
          buf3[o+VX3]=1;buf3[o+VY3]=1;buf3[o+LF3]=0;buf3[o+ML3]=rng3.random(1000,10000);
        }
        function spawnBurst3(){
          var count=calcBurst3();
          for(var i=0;i<count;i++){var idx=Math.floor(rng3.random()*NUM3),o=idx*STRIDE3;buf3[o+PX3]=mx3;buf3[o+PY3]=my3;buf3[o+TX3]=mx3;buf3[o+TY3]=my3;buf3[o+VX3]=(rng3.random()-0.5)*4;buf3[o+VY3]=(rng3.random()-0.5)*4;buf3[o+LF3]=0;buf3[o+ML3]=rng3.random(200,800);}
        }
        function stepParticle3(i){
          var o=i*STRIDE3,li=buf3[o+LF3]+1;buf3[o+LF3]=li;
          if(li>buf3[o+ML3]){resetParticle3(i);return;}
          var px=buf3[o+PX3],py=buf3[o+PY3],vx=buf3[o+VX3],vy=buf3[o+VY3];
          var xx=px/200,yy=py/200,zz=(elapsed3/5000)%100;
          var a=rng3.random()*TAU,r=rng3.random()/4;
          vx+=r*Math.sin(a)+noise3D(xx,yy,-zz);vy+=r*Math.cos(a)+noise3D(xx,yy,zz);
          var nspd=Math.sqrt(vx*vx+vy*vy);if(nspd>15){vx=vx/nspd*15;vy=vy/nspd*15;}
          if(mL3&&clickTimer3===null){vx+=(mx3-px)*0.00085;vy+=(my3-py)*0.00085;}
          if(mR3){var ddx=px-mx3,ddy=py-my3,dist=Math.sqrt(ddx*ddx+ddy*ddy);if(dist<rng3.random(200,250)){vx+=ddx*0.02;vy+=ddy*0.02;}}
          if(mM3){var ddx2=px-mx3,ddy2=py-my3,dist2=Math.sqrt(ddx2*ddx2+ddy2*ddy2),lim=rng3.random(200,250);if(dist2<lim){var f=dist2/lim;vx*=f;vy*=f;}}
          vx*=0.94;vy*=0.94;
          buf3[o+TX3]=px;buf3[o+TY3]=py;px+=vx;py+=vy;
          if(px>W3){px=0;buf3[o+TX3]=px;}else if(px<0){px=W3;buf3[o+TX3]=px;}
          if(py>H3){py=0;buf3[o+TY3]=py;}else if(py<0){py=H3;buf3[o+TY3]=py;}
          buf3[o+PX3]=px;buf3[o+PY3]=py;buf3[o+VX3]=vx;buf3[o+VY3]=vy;
        }

        rng3=new PRNG(Date.now()); initNoise(rng3);
        W3=canvas.width=stage.clientWidth; H3=canvas.height=stage.clientHeight;
        buf3=new Float32Array(MAX_NUM3*STRIDE3);
        for(var i=0;i<NUM3;i++) resetParticle3(i);

        canvas.addEventListener('mousemove',function(e){var c=getCoords3(e);mx3=c.x;my3=c.y;});
        canvas.addEventListener('touchmove',function(e){if(e.touches.length){var r=canvas.getBoundingClientRect();mx3=e.touches[0].clientX-r.left;my3=e.touches[0].clientY-r.top;}},{passive:true});
        canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
        canvas.addEventListener('mousedown',function(e){e.preventDefault();var c=getCoords3(e);mx3=c.x;my3=c.y;if(e.button===0){mL3=true;clickTimer3=setTimeout(function(){clickTimer3=null;},CLICK_THRESHOLD);}if(e.button===1)mM3=true;if(e.button===2)mR3=true;});
        canvas.addEventListener('mouseup',function(e){if(e.button===0){mL3=false;if(clickTimer3!==null){clearTimeout(clickTimer3);clickTimer3=null;spawnBurst3();}}if(e.button===1)mM3=false;if(e.button===2)mR3=false;});
        window.addEventListener('mouseup',function(e){if(e.button===2)mR3=false;});
        canvas.addEventListener('touchstart',function(e){mL3=true;var r=canvas.getBoundingClientRect();if(e.touches.length){mx3=e.touches[0].clientX-r.left;my3=e.touches[0].clientY-r.top;}e.preventDefault();spawnBurst3();});
        canvas.addEventListener('touchend',function(){mL3=false;mM3=false;mR3=false;});
        window.addEventListener('resize',function(){W3=canvas.width=stage.clientWidth;H3=canvas.height=stage.clientHeight;var n=calcNum3();if(n>NUM3){for(var i=NUM3;i<n;i++)resetParticle3(i);}NUM3=n;});
        document.addEventListener('visibilitychange',function(){if(!document.hidden)requestAnimationFrame(render3);});

        requestAnimationFrame(render3);
        function render3(timestamp){
          requestAnimationFrame(render3);
          if(lastTs3!==null)elapsed3+=Math.min(timestamp-lastTs3,50);
          lastTs3=timestamp;
          ctx.beginPath();
          for(var i=0;i<NUM3;i++){stepParticle3(i);var o=i*STRIDE3;ctx.moveTo(buf3[o+TX3],buf3[o+TY3]);ctx.lineTo(buf3[o+PX3],buf3[o+PY3]);}
          var _p=ctx.globalCompositeOperation;
          ctx.globalCompositeOperation='destination-out';ctx.fillStyle='rgba(0,0,0,0.085)';ctx.fillRect(0,0,W3,H3);
          ctx.globalCompositeOperation='lighter';ctx.strokeStyle='hsla('+((hue3|0)%360)+',75%,50%,0.55)';ctx.stroke();ctx.closePath();
          ctx.globalCompositeOperation=_p;hue3+=0.5;
        }
      }
    },

    // Pen 4 – Fireworks
    {
      name: "trailCanvas",
      welcomeName: "Welcome 4",
      deps: [],
      mount(mountEl) {
        mountEl.innerHTML = `<div style="height:100%;display:flex;justify-content:center;align-items:center;"><div class="fw4-stage" style="overflow:hidden;box-sizing:initial;width:100%;height:100%;"><div class="fw4-canvas" style="width:100%;height:100%;position:relative;"><canvas id="fw4-trails" style="position:absolute;top:0;left:0;mix-blend-mode:lighten;transform:translateZ(0);background:transparent;opacity:0;animation:fw4FadeIn 600ms ease forwards;"></canvas><canvas id="fw4-main" style="position:absolute;top:0;left:0;mix-blend-mode:lighten;transform:translateZ(0);background:transparent;opacity:0;animation:fw4FadeIn 600ms ease forwards;"></canvas></div></div></div>`;
        if (!document.getElementById('fw4-style')) {
          var fw4st = document.createElement('style'); fw4st.id = 'fw4-style';
          fw4st.textContent = '@keyframes fw4FadeIn{to{opacity:1}}';
          document.head.appendChild(fw4st);
        }

        const Ticker4 = (function(window) {
          'use strict';
          const T = {};
          let started=false,lastTimestamp=0,listeners=[];
          T.addListener = function(cb){
            if(typeof cb!=='function') throw('Ticker.addListener() requires a function');
            listeners.push(cb);
            if(!started){started=true;requestAnimationFrame(fh);}
          };
          function fh(ts){
            let ft=ts-lastTimestamp; lastTimestamp=ts;
            if(ft<0)ft=17; else if(ft>68)ft=68;
            listeners.forEach(l=>l.call(window,ft,ft/16.6667));
            requestAnimationFrame(fh);
          }
          return T;
        })(window);

        const Stage4 = (function(window,document,Ticker) {
          'use strict';
          let lastTouchTs=0;
          function Stage4(canvas){
            if(typeof canvas==='string') canvas=document.getElementById(canvas);
            this.canvas=canvas; this.ctx=canvas.getContext('2d');
            this.canvas.style.touchAction='none';
            this.speed=1;
            this.dpr=Stage4.disableHighDPI?1:((window.devicePixelRatio||1)/(this.ctx.backingStorePixelRatio||1));
            this.width=canvas.width; this.height=canvas.height;
            this.naturalWidth=this.width*this.dpr; this.naturalHeight=this.height*this.dpr;
            if(this.width!==this.naturalWidth){
              this.canvas.width=this.naturalWidth; this.canvas.height=this.naturalHeight;
              this.canvas.style.width=this.width+'px'; this.canvas.style.height=this.height+'px';
            }
            Stage4.stages.push(this);
            this._listeners={resize:[],pointerstart:[],pointermove:[],pointerend:[],lastPointerPos:{x:0,y:0}};
          }
          Stage4.stages=[];
          Stage4.disableHighDPI=false;
          Stage4.prototype.addEventListener=function(event,handler){
            try{if(event==='ticker')Ticker.addListener(handler);else this._listeners[event].push(handler);}
            catch(e){throw('Invalid Event');}
          };
          Stage4.prototype.dispatchEvent=function(event,val){
            const ls=this._listeners[event];
            if(ls)ls.forEach(l=>l.call(this,val)); else throw('Invalid Event');
          };
          Stage4.prototype.resize=function(w,h){
            this.width=w; this.height=h;
            this.naturalWidth=w*this.dpr; this.naturalHeight=h*this.dpr;
            this.canvas.width=this.naturalWidth; this.canvas.height=this.naturalHeight;
            this.canvas.style.width=w+'px'; this.canvas.style.height=h+'px';
            this.dispatchEvent('resize');
          };
          Stage4.windowToCanvas=function(canvas,x,y){
            const bb=canvas.getBoundingClientRect();
            return{x:(x-bb.left)*(canvas.width/bb.width),y:(y-bb.top)*(canvas.height/bb.height)};
          };
          Stage4.mouseHandler=function(evt){
            if(Date.now()-lastTouchTs<500)return;
            let type='start';
            if(evt.type==='mousemove')type='move';
            else if(evt.type==='mouseup')type='end';
            Stage4.stages.forEach(stg=>{
              const pos=Stage4.windowToCanvas(stg.canvas,evt.clientX,evt.clientY);
              stg.pointerEvent(type,pos.x/stg.dpr,pos.y/stg.dpr);
            });
          };
          Stage4.touchHandler=function(evt){
            lastTouchTs=Date.now();
            let type='start';
            if(evt.type==='touchmove')type='move';
            else if(evt.type==='touchend')type='end';
            Stage4.stages.forEach(stg=>{
              for(let touch of Array.from(evt.changedTouches)){
                let pos;
                if(type!=='end'){
                  pos=Stage4.windowToCanvas(stg.canvas,touch.clientX,touch.clientY);
                  stg._listeners.lastPointerPos=pos;
                  if(type==='start')stg.pointerEvent('move',pos.x/stg.dpr,pos.y/stg.dpr);
                }else{pos=stg._listeners.lastPointerPos;}
                stg.pointerEvent(type,pos.x/stg.dpr,pos.y/stg.dpr);
              }
            });
          };
          Stage4.prototype.pointerEvent=function(type,x,y){
            const evt={type,x,y};
            evt.onCanvas=(x>=0&&x<=this.width&&y>=0&&y<=this.height);
            this.dispatchEvent('pointer'+type,evt);
          };
          document.addEventListener('mousedown',Stage4.mouseHandler);
          document.addEventListener('mousemove',Stage4.mouseHandler);
          document.addEventListener('mouseup',Stage4.mouseHandler);
          document.addEventListener('touchstart',Stage4.touchHandler);
          document.addEventListener('touchmove',Stage4.touchHandler);
          document.addEventListener('touchend',Stage4.touchHandler);
          return Stage4;
        })(window,document,Ticker4);

        const MyMath4=(function(Math){
          const M={};
          M.toDeg=180/Math.PI; M.toRad=Math.PI/180; M.halfPI=Math.PI/2; M.twoPI=Math.PI*2;
          M.dist=(w,h)=>Math.sqrt(w*w+h*h);
          M.pointDist=(x1,y1,x2,y2)=>{const dx=x2-x1,dy=y2-y1;return Math.sqrt(dx*dx+dy*dy);};
          M.angle=(w,h)=>M.halfPI+Math.atan2(h,w);
          M.pointAngle=(x1,y1,x2,y2)=>M.halfPI+Math.atan2(y2-y1,x2-x1);
          M.splitVector=(speed,angle)=>({x:Math.sin(angle)*speed,y:-Math.cos(angle)*speed});
          M.random=(min,max)=>Math.random()*(max-min)+min;
          M.randomInt=(min,max)=>((Math.random()*(max-min+1))|0)+min;
          M.randomChoice=function(choices){
            if(arguments.length===1&&Array.isArray(choices))return choices[(Math.random()*choices.length)|0];
            return arguments[(Math.random()*arguments.length)|0];
          };
          M.clamp=(num,min,max)=>Math.min(Math.max(num,min),max);
          return M;
        })(Math);

        const IS_MOBILE4 = mountEl.clientWidth <= 640;
        const IS_DESKTOP4 = mountEl.clientWidth > 800;
        const IS_HEADER4 = IS_DESKTOP4 && mountEl.clientHeight < 300;
        const IS_HIGH_END4 = (()=>{const hw=navigator.hardwareConcurrency;if(!hw)return false;return hw>=(mountEl.clientWidth<=1024?4:8);})();
        const MAX_WIDTH4=7680,MAX_HEIGHT4=4320,GRAVITY4=0.9,DILATION_R4=300;
        let simSpeed4=1;

        function getDefaultScaleFactor4(){if(IS_MOBILE4)return 0.9;if(IS_HEADER4)return 0.75;return 1;}
        let stageW4,stageH4;
        let quality4=IS_HIGH_END4?3:2;
        const isLowQuality4=quality4===1,isNormalQuality4=quality4===2,isHighQuality4=quality4===3;
        const QUALITY_LOW4=1,QUALITY_NORMAL4=2,QUALITY_HIGH4=3;
        const SKY_LIGHT_NONE4=0,SKY_LIGHT_DIM4=1,SKY_LIGHT_NORMAL4=2;

        const COLOR4={Red:'#ff0043',Green:'#14fc56',Blue:'#1e7fff',Purple:'#e60aff',Gold:'#ffbf36',White:'#ffffff'};
        const INVISIBLE4='_INVISIBLE_';
        const PI_24=Math.PI*2,PI_HALF4=Math.PI*0.5;

        const trailsStage4=new Stage4(mountEl.querySelector('#fw4-trails'));
        const mainStage4=new Stage4(mountEl.querySelector('#fw4-main'));
        const stages4=[trailsStage4,mainStage4];

        const config4={shell:'Random',size:IS_DESKTOP4?3:IS_HEADER4?1.2:2,autoLaunch:true,finale:false,skyLighting:SKY_LIGHT_NORMAL4,longExposure:false,scaleFactor:getDefaultScaleFactor4()};
        const shellNameSelector4=()=>config4.shell;
        const shellSizeSelector4=()=>config4.size;
        const finaleSelector4=()=>config4.finale;
        const skyLightingSelector4=()=>config4.skyLighting;
        const scaleFactorSelector4=()=>config4.scaleFactor;

        const COLOR_NAMES4=Object.keys(COLOR4);
        const COLOR_CODES4=COLOR_NAMES4.map(n=>COLOR4[n]);
        const COLOR_CODES_W_INVIS4=[...COLOR_CODES4,INVISIBLE4];
        const COLOR_CODE_INDEXES4=COLOR_CODES_W_INVIS4.reduce((obj,code,i)=>{obj[code]=i;return obj;},{});
        const COLOR_TUPLES4={};
        COLOR_CODES4.forEach(hex=>{COLOR_TUPLES4[hex]={r:parseInt(hex.substr(1,2),16),g:parseInt(hex.substr(3,2),16),b:parseInt(hex.substr(5,2),16)};});

        function randomColorSimple4(){return COLOR_CODES4[Math.random()*COLOR_CODES4.length|0];}
        let lastColor4;
        function randomColor4(options){
          const notSame=options&&options.notSame,notColor=options&&options.notColor,limitWhite=options&&options.limitWhite;
          let color=randomColorSimple4();
          if(limitWhite&&color===COLOR4.White&&Math.random()<0.6)color=randomColorSimple4();
          if(notSame){while(color===lastColor4)color=randomColorSimple4();}
          else if(notColor){while(color===notColor)color=randomColorSimple4();}
          lastColor4=color; return color;
        }
        function whiteOrGold4(){return Math.random()<0.5?COLOR4.Gold:COLOR4.White;}
        function makePistilColor4(shellColor){return(shellColor===COLOR4.White||shellColor===COLOR4.Gold)?randomColor4({notColor:shellColor}):whiteOrGold4();}

        const crysanthemumShell4=(size=1)=>{
          const glitter=Math.random()<0.25,singleColor=Math.random()<0.72;
          const color=singleColor?randomColor4({limitWhite:true}):[randomColor4(),randomColor4({notSame:true})];
          const pistil=singleColor&&Math.random()<0.42,pistilColor=pistil&&makePistilColor4(color);
          const secondColor=singleColor&&(Math.random()<0.2||color===COLOR4.White)?pistilColor||randomColor4({notColor:color,limitWhite:true}):null;
          const streamers=!pistil&&color!==COLOR4.White&&Math.random()<0.42;
          let starDensity=glitter?1.1:1.25;
          if(isLowQuality4)starDensity*=0.8; if(isHighQuality4)starDensity=1.2;
          return{shellSize:size,spreadSize:300+size*100,starLife:900+size*200,starDensity,color,secondColor,glitter:glitter?'light':'',glitterColor:whiteOrGold4(),pistil,pistilColor,streamers};
        };
        const ghostShell4=(size=1)=>{const shell=crysanthemumShell4(size);shell.starLife*=1.5;let gc=randomColor4({notColor:COLOR4.White});shell.streamers=true;shell.color=INVISIBLE4;shell.secondColor=gc;shell.glitter='';return shell;};
        const strobeShell4=(size=1)=>{const color=randomColor4({limitWhite:true});return{shellSize:size,spreadSize:280+size*92,starLife:1100+size*200,starLifeVariation:0.40,starDensity:1.1,color,glitter:'light',glitterColor:COLOR4.White,strobe:true,strobeColor:Math.random()<0.5?COLOR4.White:null,pistil:Math.random()<0.5,pistilColor:makePistilColor4(color)};};
        const palmShell4=(size=1)=>{const color=randomColor4(),thick=Math.random()<0.5;return{shellSize:size,color,spreadSize:250+size*75,starDensity:thick?0.15:0.4,starLife:1800+size*200,glitter:thick?'thick':'heavy'};};
        const ringShell4=(size=1)=>{const color=randomColor4(),pistil=Math.random()<0.75;return{shellSize:size,ring:true,color,spreadSize:300+size*100,starLife:900+size*200,starCount:2.2*PI_24*(size+1),pistil,pistilColor:makePistilColor4(color),glitter:!pistil?'light':'',glitterColor:color===COLOR4.Gold?COLOR4.Gold:COLOR4.White,streamers:Math.random()<0.3};};
        const crossetteShell4=(size=1)=>{const color=randomColor4({limitWhite:true});return{shellSize:size,spreadSize:300+size*100,starLife:750+size*160,starLifeVariation:0.4,starDensity:0.85,color,crossette:true,pistil:Math.random()<0.5,pistilColor:makePistilColor4(color)};};
        const floralShell4=(size=1)=>({shellSize:size,spreadSize:300+size*120,starDensity:0.12,starLife:500+size*50,starLifeVariation:0.5,color:Math.random()<0.65?'random':(Math.random()<0.15?randomColor4():[randomColor4(),randomColor4({notSame:true})]),floral:true});
        const fallingLeavesShell4=(size=1)=>({shellSize:size,color:INVISIBLE4,spreadSize:300+size*120,starDensity:0.12,starLife:500+size*50,starLifeVariation:0.5,glitter:'medium',glitterColor:COLOR4.Gold,fallingLeaves:true});
        const willowShell4=(size=1)=>({shellSize:size,spreadSize:300+size*100,starDensity:0.6,starLife:3000+size*300,glitter:'willow',glitterColor:COLOR4.Gold,color:INVISIBLE4});
        const crackleShell4=(size=1)=>{const color=Math.random()<0.75?COLOR4.Gold:randomColor4();return{shellSize:size,spreadSize:380+size*75,starDensity:isLowQuality4?0.65:1,starLife:600+size*100,starLifeVariation:0.32,glitter:'light',glitterColor:COLOR4.Gold,color,crackle:true,pistil:Math.random()<0.65,pistilColor:makePistilColor4(color)};};
        const horsetailShell4=(size=1)=>{const color=randomColor4();return{shellSize:size,horsetail:true,color,spreadSize:250+size*38,starDensity:0.9,starLife:2500+size*300,glitter:'medium',glitterColor:Math.random()<0.5?whiteOrGold4():color,strobe:color===COLOR4.White};};

        function randomShellName4(){return Math.random()<0.5?'Crysanthemum':shellNames4[(Math.random()*(shellNames4.length-1)+1)|0];}
        const randomShell4=(size)=>shellTypes4[randomShellName4()](size);
        const randomFastShell4=()=>{const fs=['Crysanthemum','Crossette','Ring'];return shellTypes4[fs[(Math.random()*fs.length)|0]];};
        function shellFromConfig4(size){const name=shellNameSelector4();if(name==='Random')return randomShell4(size);return shellTypes4[name](size);}

        const shellTypes4={'Crackle':crackleShell4,'Crossette':crossetteShell4,'Crysanthemum':crysanthemumShell4,'Falling Leaves':fallingLeavesShell4,'Floral':floralShell4,'Ghost':ghostShell4,'Horse Tail':horsetailShell4,'Palm':palmShell4,'Ring':ringShell4,'Strobe':strobeShell4,'Willow':willowShell4};
        const shellNames4=Object.keys(shellTypes4);

        function fitShellPositionInBoundsH4(p){return(1-0.36)*p+0.18;}
        function fitShellPositionInBoundsV4(p){return p*0.75;}
        function getRandomShellPositionH4(){return fitShellPositionInBoundsH4(Math.random());}
        function getRandomShellPositionV4(){return fitShellPositionInBoundsV4(Math.random());}
        function getRandomShellSize4(){
          const baseSize=shellSizeSelector4(),maxVariance=Math.min(2.5,baseSize),variance=Math.random()*maxVariance,size=baseSize-variance;
          const height=maxVariance===0?Math.random():1-(variance/maxVariance);
          const centerOffset=Math.random()*(1-height*0.65)*0.5;
          const x=Math.random()<0.5?0.5-centerOffset:0.5+centerOffset;
          return{size,x:fitShellPositionInBoundsH4(x),height:fitShellPositionInBoundsV4(height)};
        }

        function launchShellFromConfig4(event){
          const shell=new Shell4(shellFromConfig4(shellSizeSelector4()));
          const w=mainStage4.width,h=mainStage4.height;
          shell.launch(event?event.x/w:getRandomShellPositionH4(),event?1-event.y/h:getRandomShellPositionV4());
        }
        function seqRandomShell4(){const size=getRandomShellSize4(),shell=new Shell4(shellFromConfig4(size.size));shell.launch(size.x,size.height);let extraDelay=shell.starLife;if(shell.fallingLeaves)extraDelay=4600;return 900+Math.random()*600+extraDelay;}
        function seqRandomFastShell4(){const shellType=randomFastShell4(),size=getRandomShellSize4(),shell=new Shell4(shellType(size.size));shell.launch(size.x,size.height);return 900+Math.random()*600+shell.starLife;}
        function seqTwoRandom4(){
          const size1=getRandomShellSize4(),size2=getRandomShellSize4();
          const shell1=new Shell4(shellFromConfig4(size1.size)),shell2=new Shell4(shellFromConfig4(size2.size));
          const lo=Math.random()*0.2-0.1,ro=Math.random()*0.2-0.1;
          shell1.launch(0.3+lo,size1.height);
          setTimeout(()=>{shell2.launch(0.7+ro,size2.height);},100);
          let extraDelay=Math.max(shell1.starLife,shell2.starLife);
          if(shell1.fallingLeaves||shell2.fallingLeaves)extraDelay=4600;
          return 900+Math.random()*600+extraDelay;
        }
        function seqTriple4(){
          const shellType=randomFastShell4(),baseSize=shellSizeSelector4(),smallSize=Math.max(0,baseSize-1.25);
          const offset=Math.random()*0.08-0.04,shell1=new Shell4(shellType(baseSize));
          shell1.launch(0.5+offset,0.7);
          const ld=1000+Math.random()*400,rd=1000+Math.random()*400;
          setTimeout(()=>{const o=Math.random()*0.08-0.04;new Shell4(shellType(smallSize)).launch(0.2+o,0.1);},ld);
          setTimeout(()=>{const o=Math.random()*0.08-0.04;new Shell4(shellType(smallSize)).launch(0.8+o,0.1);},rd);
          return 4000;
        }
        function seqPyramid4(){
          const bch=IS_DESKTOP4?7:4,largeSize=shellSizeSelector4(),smallSize=Math.max(0,largeSize-3);
          const rms=Math.random()<0.78?crysanthemumShell4:ringShell4;
          function launchShell4(x,useSpecial){
            const isRandom=shellNameSelector4()==='Random';
            let shellType=isRandom?(useSpecial?randomShell4:rms):shellTypes4[shellNameSelector4()];
            const shell=new Shell4(shellType(useSpecial?largeSize:smallSize));
            const height=x<=0.5?x/0.5:(1-x)/0.5;
            shell.launch(x,useSpecial?0.75:height*0.42);
          }
          let count=0,delay=0;
          while(count<=bch){
            if(count===bch){setTimeout(()=>{launchShell4(0.5,true);},delay);}
            else{const offset=count/bch*0.5,delayOffset=Math.random()*30+30;setTimeout(()=>{launchShell4(offset,false);},delay);setTimeout(()=>{launchShell4(1-offset,false);},delay+delayOffset);}
            count++;delay+=200;
          }
          return 3400+bch*250;
        }
        function seqSmallBarrage4(){
          seqSmallBarrage4.lastCalled=Date.now();
          const bc=IS_DESKTOP4?11:5,specialIndex=IS_DESKTOP4?3:1,shellSize=Math.max(0,shellSizeSelector4()-2);
          const rms=Math.random()<0.78?crysanthemumShell4:ringShell4,rfs=randomFastShell4();
          function launchShell4(x,useSpecial){
            const isRandom=shellNameSelector4()==='Random';
            let shellType=isRandom?(useSpecial?rfs:rms):shellTypes4[shellNameSelector4()];
            const shell=new Shell4(shellType(shellSize));
            const height=(Math.cos(x*5*Math.PI+PI_HALF4)+1)/2;
            shell.launch(x,height*0.75);
          }
          let count=0,delay=0;
          while(count<bc){
            if(count===0){launchShell4(0.5,false);count+=1;}
            else{const offset=(count+1)/bc/2,delayOffset=Math.random()*30+30,useSpecial=count===specialIndex;setTimeout(()=>{launchShell4(0.5+offset,useSpecial);},delay);setTimeout(()=>{launchShell4(0.5-offset,useSpecial);},delay+delayOffset);count+=2;}
            delay+=200;
          }
          return 3400+bc*120;
        }
        seqSmallBarrage4.cooldown=15000; seqSmallBarrage4.lastCalled=Date.now();

        let isFirstSeq4=true,finaleCount4=32,currentFinaleCount4=0;
        function startSequence4(){
          if(isFirstSeq4){isFirstSeq4=false;if(IS_HEADER4)return seqTwoRandom4();const shell=new Shell4(crysanthemumShell4(shellSizeSelector4()));shell.launch(0.5,0.5);return 2400;}
          if(finaleSelector4()){seqRandomFastShell4();if(currentFinaleCount4<finaleCount4){currentFinaleCount4++;return 170;}else{currentFinaleCount4=0;return 6000;}}
          const rand=Math.random();
          if(rand<0.08&&Date.now()-seqSmallBarrage4.lastCalled>seqSmallBarrage4.cooldown)return seqSmallBarrage4();
          if(rand<0.1)return seqPyramid4();
          if(rand<0.6&&!IS_HEADER4)return seqRandomShell4();
          else if(rand<0.8)return seqTwoRandom4();
          else return seqTriple4();
        }

        let activePointerCount4=0,isUpdatingSpeed4=false,cursorX4=0,cursorY4=0;
        let leftClickTimer4=null,leftHoldActive4=false,leftHoldInterval4=null;
        let mM4=false,mR4=false,rightHoldInterval4=null;

        function launchAtCursor4(){launchShellFromConfig4({x:cursorX4,y:cursorY4});}
        function startLeftHold4(){leftHoldActive4=true;launchAtCursor4();leftHoldInterval4=setInterval(launchAtCursor4,350);}
        function stopLeftHold4(){leftHoldActive4=false;clearInterval(leftHoldInterval4);leftHoldInterval4=null;}
        function fireRightBarrage4(){const count=4+Math.floor(Math.random()*3),spreadPx=mainStage4.width*0.15;for(let i=0;i<count;i++){const ox=(Math.random()-0.5)*spreadPx;launchShellFromConfig4({x:cursorX4+ox,y:cursorY4});}}
        function startRightBarrage4(){fireRightBarrage4();rightHoldInterval4=setInterval(fireRightBarrage4,600);}
        function stopRightBarrage4(){clearInterval(rightHoldInterval4);rightHoldInterval4=null;}

        function handlePointerStart4(event){
          activePointerCount4++;cursorX4=event.x;cursorY4=event.y;
          if(updateSpeedFromEvent4(event)){isUpdatingSpeed4=true;return;}
          if(event.onCanvas){leftClickTimer4=setTimeout(()=>{leftClickTimer4=null;startLeftHold4();},200);}
        }
        function handlePointerEnd4(event){
          activePointerCount4--;isUpdatingSpeed4=false;
          if(leftClickTimer4!==null){clearTimeout(leftClickTimer4);leftClickTimer4=null;launchAtCursor4();}
          if(leftHoldActive4)stopLeftHold4();
        }
        function handlePointerMove4(event){cursorX4=event.x;cursorY4=event.y;if(isUpdatingSpeed4)updateSpeedFromEvent4(event);}

        mainStage4.addEventListener('pointerstart',handlePointerStart4);
        mainStage4.addEventListener('pointerend',handlePointerEnd4);
        mainStage4.addEventListener('pointermove',handlePointerMove4);

        const mainCanvas4=mountEl.querySelector('#fw4-main');
        mainCanvas4.addEventListener('contextmenu',e=>e.preventDefault());
        mainCanvas4.addEventListener('mousedown',e=>{
          if(e.button===1){e.preventDefault();if(!mM4)mM4=true;}
          else if(e.button===2){e.preventDefault();if(!mR4){mR4=true;const rect=mainCanvas4.getBoundingClientRect();cursorX4=e.clientX-rect.left;cursorY4=e.clientY-rect.top;startRightBarrage4();}}
        });
        mainCanvas4.addEventListener('mousemove',e=>{const rect=mainCanvas4.getBoundingClientRect();cursorX4=e.clientX-rect.left;cursorY4=e.clientY-rect.top;});
        mainCanvas4.addEventListener('mouseup',e=>{if(e.button===1)mM4=false;else if(e.button===2&&mR4){mR4=false;stopRightBarrage4();}});
        window.addEventListener('mouseup',e=>{if(e.button===1)mM4=false;if(e.button===2&&mR4){mR4=false;stopRightBarrage4();}});

        const canvasContainer4=mountEl.querySelector('.fw4-canvas');
        const stageContainer4=mountEl.querySelector('.fw4-stage');

        function handleResize4(){
          const w=mountEl.clientWidth,h=mountEl.clientHeight;
          const containerW=Math.min(w,MAX_WIDTH4),containerH=w<=420?h:Math.min(h,MAX_HEIGHT4);
          stageContainer4.style.width=containerW+'px'; stageContainer4.style.height=containerH+'px';
          stages4.forEach(stg=>stg.resize(containerW,containerH));
          stageW4=containerW/scaleFactorSelector4(); stageH4=containerH/scaleFactorSelector4();
        }
        handleResize4();
        window.addEventListener('resize',handleResize4);

        let currentFrame4=0,speedBarOpacity4=0,autoLaunchTime4=0;

        function updateSpeedFromEvent4(event){
          if(isUpdatingSpeed4||event.y>=mainStage4.height-44){
            const edge=16;const newSpeed=(event.x-edge)/(mainStage4.width-edge*2);
            simSpeed4=Math.min(Math.max(newSpeed,0),1);speedBarOpacity4=1;return true;}
          return false;
        }
        function updateGlobals4(timeStep,lag){
          currentFrame4++;
          if(!isUpdatingSpeed4){speedBarOpacity4-=lag/30;if(speedBarOpacity4<0)speedBarOpacity4=0;}
          if(config4.autoLaunch){autoLaunchTime4-=timeStep;if(autoLaunchTime4<=0)autoLaunchTime4=startSequence4()*1.25;}
        }

        function update4(frameTime,lag){
          const width=stageW4,height=stageH4,timeStep=frameTime*simSpeed4,speed=simSpeed4*lag;
          updateGlobals4(timeStep,lag);
          const starDrag=1-(1-Star4.airDrag)*speed,starDragHeavy=1-(1-Star4.airDragHeavy)*speed;
          const sparkDrag=1-(1-Spark4.airDrag)*speed,gAcc=timeStep/1000*GRAVITY4;

          COLOR_CODES_W_INVIS4.forEach(color=>{
            const stars=Star4.active[color];
            for(let i=stars.length-1;i>=0;i--){
              const star=stars[i];
              if(star.updateFrame===currentFrame4)continue;
              star.updateFrame=currentFrame4;
              star.life-=timeStep;
              if(star.life<=0){stars[i]=stars[stars.length-1];stars.pop();Star4.returnInstance(star);}
              else{
                const burnRate=Math.pow(star.life/star.fullLife,0.5),burnRateInverse=1-burnRate;
                let localSpeed=speed,localGAcc=gAcc;
                if(mM4){const dx=star.x-cursorX4,dy=star.y-cursorY4,dist=Math.sqrt(dx*dx+dy*dy);if(dist<DILATION_R4){const f=dist/DILATION_R4;localSpeed=speed*f;localGAcc=gAcc*f;}}
                star.prevX=star.x;star.prevY=star.y;star.x+=star.speedX*localSpeed;star.y+=star.speedY*localSpeed;
                if(!star.heavy){star.speedX*=starDrag;star.speedY*=starDrag;}else{star.speedX*=starDragHeavy;star.speedY*=starDragHeavy;}
                star.speedY+=localGAcc;
                if(star.spinRadius){star.spinAngle+=star.spinSpeed*localSpeed;star.x+=Math.sin(star.spinAngle)*star.spinRadius*localSpeed;star.y+=Math.cos(star.spinAngle)*star.spinRadius*localSpeed;}
                if(star.sparkFreq){star.sparkTimer-=timeStep;while(star.sparkTimer<0){star.sparkTimer+=star.sparkFreq*0.75+star.sparkFreq*burnRateInverse*4;Spark4.add(star.x,star.y,star.sparkColor,Math.random()*PI_24,Math.random()*star.sparkSpeed*burnRate,star.sparkLife*0.8+Math.random()*star.sparkLifeVariation*star.sparkLife);}}
                if(star.life<star.transitionTime){if(star.secondColor&&!star.colorChanged){star.colorChanged=true;star.color=star.secondColor;stars[i]=stars[stars.length-1];stars.pop();Star4.active[star.secondColor].push(star);if(star.secondColor===INVISIBLE4)star.sparkFreq=0;}if(star.strobe){star.visible=Math.floor(star.life/star.strobeFreq)%3===0;}}
              }
            }
            const sparks=Spark4.active[color];
            for(let i=sparks.length-1;i>=0;i--){const spark=sparks[i];spark.life-=timeStep;if(spark.life<=0){sparks[i]=sparks[sparks.length-1];sparks.pop();Spark4.returnInstance(spark);}else{spark.prevX=spark.x;spark.prevY=spark.y;spark.x+=spark.speedX*speed;spark.y+=spark.speedY*speed;spark.speedX*=sparkDrag;spark.speedY*=sparkDrag;spark.speedY+=gAcc;}}
          });
          render4(speed);
        }

        function render4(speed){
          const{dpr}=mainStage4,width=stageW4,height=stageH4;
          const trailsCtx=trailsStage4.ctx,mainCtx=mainStage4.ctx;
          if(skyLightingSelector4()!==SKY_LIGHT_NONE4)colorSky4(speed);
          const scaleFactor=scaleFactorSelector4();
          trailsCtx.scale(dpr*scaleFactor,dpr*scaleFactor);
          mainCtx.scale(dpr*scaleFactor,dpr*scaleFactor);
          var _prevComp=trailsCtx.globalCompositeOperation;
          trailsCtx.globalCompositeOperation='destination-out';
          trailsCtx.fillStyle=`rgba(0,0,0,${config4.longExposure?0.0025:0.175*speed})`;
          trailsCtx.fillRect(0,0,width,height);
          trailsCtx.globalCompositeOperation=_prevComp;
          mainCtx.clearRect(0,0,width,height);
          while(BurstFlash4.active.length){const bf=BurstFlash4.active.pop();const bg=trailsCtx.createRadialGradient(bf.x,bf.y,0,bf.x,bf.y,bf.radius);bg.addColorStop(0.024,'rgba(255,255,255,1)');bg.addColorStop(0.125,'rgba(255,160,20,0.2)');bg.addColorStop(0.32,'rgba(255,140,20,0.11)');bg.addColorStop(1,'rgba(255,120,20,0)');trailsCtx.fillStyle=bg;trailsCtx.fillRect(bf.x-bf.radius,bf.y-bf.radius,bf.radius*2,bf.radius*2);BurstFlash4.returnInstance(bf);}
          trailsCtx.globalCompositeOperation='lighten';
          trailsCtx.lineWidth=Star4.drawWidth;trailsCtx.lineCap=isLowQuality4?'square':'round';
          mainCtx.strokeStyle='#fff';mainCtx.lineWidth=1;mainCtx.beginPath();
          COLOR_CODES4.forEach(color=>{const stars=Star4.active[color];trailsCtx.strokeStyle=color;trailsCtx.beginPath();stars.forEach(star=>{if(star.visible){trailsCtx.moveTo(star.x,star.y);trailsCtx.lineTo(star.prevX,star.prevY);mainCtx.moveTo(star.x,star.y);mainCtx.lineTo(star.x-star.speedX*1.6,star.y-star.speedY*1.6);}});trailsCtx.stroke();});
          mainCtx.stroke();
          trailsCtx.lineWidth=Spark4.drawWidth;trailsCtx.lineCap='butt';
          COLOR_CODES4.forEach(color=>{const sparks=Spark4.active[color];trailsCtx.strokeStyle=color;trailsCtx.beginPath();sparks.forEach(spark=>{trailsCtx.moveTo(spark.x,spark.y);trailsCtx.lineTo(spark.prevX,spark.prevY);});trailsCtx.stroke();});
          if(speedBarOpacity4){const sbh=6;mainCtx.globalAlpha=speedBarOpacity4;mainCtx.fillStyle=COLOR4.Blue;mainCtx.fillRect(0,height-sbh,width*simSpeed4,sbh);mainCtx.globalAlpha=1;}
          trailsCtx.setTransform(1,0,0,1,0,0);mainCtx.setTransform(1,0,0,1,0,0);
        }

        const currentSkyColor4={r:0,g:0,b:0},targetSkyColor4={r:0,g:0,b:0};
        function colorSky4(speed){
          const maxSkySat=skyLightingSelector4()*15,maxStarCount=500;let totalStarCount=0;
          targetSkyColor4.r=0;targetSkyColor4.g=0;targetSkyColor4.b=0;
          COLOR_CODES4.forEach(color=>{const tuple=COLOR_TUPLES4[color],count=Star4.active[color].length;totalStarCount+=count;targetSkyColor4.r+=tuple.r*count;targetSkyColor4.g+=tuple.g*count;targetSkyColor4.b+=tuple.b*count;});
          const intensity=Math.pow(Math.min(1,totalStarCount/maxStarCount),0.3);
          const maxCC=Math.max(1,targetSkyColor4.r,targetSkyColor4.g,targetSkyColor4.b);
          targetSkyColor4.r=targetSkyColor4.r/maxCC*maxSkySat*intensity;targetSkyColor4.g=targetSkyColor4.g/maxCC*maxSkySat*intensity;targetSkyColor4.b=targetSkyColor4.b/maxCC*maxSkySat*intensity;
          const cc=10;currentSkyColor4.r+=(targetSkyColor4.r-currentSkyColor4.r)/cc*speed;currentSkyColor4.g+=(targetSkyColor4.g-currentSkyColor4.g)/cc*speed;currentSkyColor4.b+=(targetSkyColor4.b-currentSkyColor4.b)/cc*speed;
          canvasContainer4.style.backgroundColor='transparent';
        }

        mainStage4.addEventListener('ticker',update4);

        function createParticleArc4(start,arcLength,count,randomness,factory){const angleDelta=arcLength/count,end=start+arcLength-(angleDelta*0.5);if(end>start){for(let a=start;a<end;a+=angleDelta)factory(a+Math.random()*angleDelta*randomness);}else{for(let a=start;a>end;a+=angleDelta)factory(a+Math.random()*angleDelta*randomness);}}
        function createBurst4(count,factory,startAngle=0,arcLength=PI_24){const R=0.5*Math.sqrt(count/Math.PI),C=2*R*Math.PI,C_HALF=C/2;for(let i=0;i<=C_HALF;i++){const ra=i/C_HALF*PI_HALF4,rs=Math.cos(ra),ppr=C*rs,ppa=ppr*(arcLength/PI_24),ainc=PI_24/ppr,ao=Math.random()*ainc+startAngle,mrao=ainc*0.33;for(let j=0;j<ppa;j++){const rao=Math.random()*mrao;factory(ainc*j+ao+rao,rs);}}}
        function crossetteEffect4(star){const sa=Math.random()*PI_HALF4;createParticleArc4(sa,PI_24,4,0.5,angle=>{Star4.add(star.x,star.y,star.color,angle,Math.random()*0.6+0.75,600);});}
        function floralEffect4(star){const count=12+6*quality4;createBurst4(count,(angle,sm)=>{Star4.add(star.x,star.y,star.color,angle,sm*2.4,1000+Math.random()*300,star.speedX,star.speedY);});BurstFlash4.add(star.x,star.y,46);soundManager4.playSound('burstSmall');}
        function fallingLeavesEffect4(star){createBurst4(7,(angle,sm)=>{const ns=Star4.add(star.x,star.y,INVISIBLE4,angle,sm*2.4,2400+Math.random()*600,star.speedX,star.speedY);ns.sparkColor=COLOR4.Gold;ns.sparkFreq=144/quality4;ns.sparkSpeed=0.28;ns.sparkLife=750;ns.sparkLifeVariation=3.2;});BurstFlash4.add(star.x,star.y,46);soundManager4.playSound('burstSmall');}
        function crackleEffect4(star){const count=isHighQuality4?32:16;createParticleArc4(0,PI_24,count,1.8,angle=>{Spark4.add(star.x,star.y,COLOR4.Gold,angle,Math.pow(Math.random(),0.45)*2.4,300+Math.random()*200);});}

        class Shell4{
          constructor(options){Object.assign(this,options);this.starLifeVariation=options.starLifeVariation||0.125;this.color=options.color||randomColor4();this.glitterColor=options.glitterColor||this.color;if(!this.starCount){const density=options.starDensity||1,scaledSize=this.spreadSize/54;this.starCount=Math.max(6,scaledSize*scaledSize*density);}}
          launch(position,launchHeight){
            const width=stageW4,height=stageH4,hpad=60,vpad=50,minHP=0.45,minHeight=height-height*minHP;
            const launchX=position*(width-hpad*2)+hpad,launchY=height,burstY=minHeight-(launchHeight*(minHeight-vpad));
            const launchDistance=launchY-burstY,launchVelocity=Math.pow(launchDistance*0.04,0.64);
            const comet=this.comet=Star4.add(launchX,launchY,typeof this.color==='string'&&this.color!=='random'?this.color:COLOR4.White,Math.PI,launchVelocity*(this.horsetail?1.2:1),launchVelocity*(this.horsetail?100:400));
            comet.heavy=true;comet.spinRadius=MyMath4.random(0.32,0.85);comet.sparkFreq=32/quality4;
            if(isHighQuality4)comet.sparkFreq=8;comet.sparkLife=320;comet.sparkLifeVariation=3;
            if(this.glitter==='willow'||this.fallingLeaves){comet.sparkFreq=20/quality4;comet.sparkSpeed=0.5;comet.sparkLife=500;}
            if(this.color===INVISIBLE4)comet.sparkColor=COLOR4.Gold;
            if(Math.random()>0.4&&!this.horsetail){comet.secondColor=INVISIBLE4;comet.transitionTime=Math.pow(Math.random(),1.5)*700+500;}
            comet.onDeath=comet=>this.burst(comet.x,comet.y);
            soundManager4.playSound('lift');
          }
          burst(x,y){
            const speed=this.spreadSize/96;let color,onDeath,sparkFreq,sparkSpeed,sparkLife,sparkLifeVariation=0.25,playedDeathSound=false;
            if(this.crossette)onDeath=(star)=>{if(!playedDeathSound){soundManager4.playSound('crackleSmall');playedDeathSound=true;}crossetteEffect4(star);};
            if(this.crackle)onDeath=(star)=>{if(!playedDeathSound){soundManager4.playSound('crackle');playedDeathSound=true;}crackleEffect4(star);};
            if(this.floral)onDeath=floralEffect4;if(this.fallingLeaves)onDeath=fallingLeavesEffect4;
            if(this.glitter==='light'){sparkFreq=400;sparkSpeed=0.3;sparkLife=300;sparkLifeVariation=2;}
            else if(this.glitter==='medium'){sparkFreq=200;sparkSpeed=0.44;sparkLife=700;sparkLifeVariation=2;}
            else if(this.glitter==='heavy'){sparkFreq=80;sparkSpeed=0.8;sparkLife=1400;sparkLifeVariation=2;}
            else if(this.glitter==='thick'){sparkFreq=16;sparkSpeed=isHighQuality4?1.65:1.5;sparkLife=1400;sparkLifeVariation=3;}
            else if(this.glitter==='streamer'){sparkFreq=32;sparkSpeed=1.05;sparkLife=620;sparkLifeVariation=2;}
            else if(this.glitter==='willow'){sparkFreq=120;sparkSpeed=0.34;sparkLife=1400;sparkLifeVariation=3.8;}
            if(sparkFreq)sparkFreq=sparkFreq/quality4;
            const starFactory=(angle,speedMult)=>{const sis=this.spreadSize/1800,star=Star4.add(x,y,color||randomColor4(),angle,speedMult*speed,this.starLife+Math.random()*this.starLife*this.starLifeVariation,this.horsetail?this.comet&&this.comet.speedX:0,this.horsetail?this.comet&&this.comet.speedY:-sis);if(this.secondColor){star.transitionTime=this.starLife*(Math.random()*0.05+0.32);star.secondColor=this.secondColor;}if(this.strobe){star.transitionTime=this.starLife*(Math.random()*0.08+0.46);star.strobe=true;star.strobeFreq=Math.random()*20+40;if(this.strobeColor)star.secondColor=this.strobeColor;}star.onDeath=onDeath;if(this.glitter){star.sparkFreq=sparkFreq;star.sparkSpeed=sparkSpeed;star.sparkLife=sparkLife;star.sparkLifeVariation=sparkLifeVariation;star.sparkColor=this.glitterColor;star.sparkTimer=Math.random()*star.sparkFreq;}};
            if(typeof this.color==='string'){if(this.color==='random'){color=null;}else{color=this.color;}if(this.ring){const rsa=Math.random()*Math.PI,rsq=Math.pow(Math.random(),2)*0.85+0.15;createParticleArc4(0,PI_24,this.starCount,0,angle=>{const isx=Math.sin(angle)*speed*rsq,isy=Math.cos(angle)*speed,ns=MyMath4.pointDist(0,0,isx,isy),na=MyMath4.pointAngle(0,0,isx,isy)+rsa;const star=Star4.add(x,y,color,na,ns,this.starLife+Math.random()*this.starLife*this.starLifeVariation);if(this.glitter){star.sparkFreq=sparkFreq;star.sparkSpeed=sparkSpeed;star.sparkLife=sparkLife;star.sparkLifeVariation=sparkLifeVariation;star.sparkColor=this.glitterColor;star.sparkTimer=Math.random()*star.sparkFreq;}});}else{createBurst4(this.starCount,starFactory);}}
            else if(Array.isArray(this.color)){if(Math.random()<0.5){const start=Math.random()*Math.PI,start2=start+Math.PI,arc=Math.PI;color=this.color[0];createBurst4(this.starCount,starFactory,start,arc);color=this.color[1];createBurst4(this.starCount,starFactory,start2,arc);}else{color=this.color[0];createBurst4(this.starCount/2,starFactory);color=this.color[1];createBurst4(this.starCount/2,starFactory);}}
            else{throw new Error('Invalid shell color: '+this.color);}
            if(this.pistil){const is=new Shell4({spreadSize:this.spreadSize*0.5,starLife:this.starLife*0.6,starLifeVariation:this.starLifeVariation,starDensity:1.4,color:this.pistilColor,glitter:'light',glitterColor:this.pistilColor===COLOR4.Gold?COLOR4.Gold:COLOR4.White});is.burst(x,y);}
            if(this.streamers){const is=new Shell4({spreadSize:this.spreadSize*0.9,starLife:this.starLife*0.8,starLifeVariation:this.starLifeVariation,starCount:Math.floor(Math.max(6,this.spreadSize/45)),color:COLOR4.White,glitter:'streamer'});is.burst(x,y);}
            BurstFlash4.add(x,y,this.spreadSize/4);
            if(this.comet){const maxDiff=2,sdfms=Math.min(maxDiff,shellSizeSelector4()-this.shellSize),soundScale=(1-sdfms/maxDiff)*0.3+0.7;soundManager4.playSound('burst',soundScale);}
          }
        }

        const BurstFlash4={active:[],_pool:[],_new(){return{};},add(x,y,radius){const i=this._pool.pop()||this._new();i.x=x;i.y=y;i.radius=radius;this.active.push(i);return i;},returnInstance(i){this._pool.push(i);}};

        function createParticleCollection4(){const c={};COLOR_CODES_W_INVIS4.forEach(color=>{c[color]=[];});return c;}

        const Star4={drawWidth:3,airDrag:0.98,airDragHeavy:0.992,active:createParticleCollection4(),_pool:[],_new(){return{};},
          add(x,y,color,angle,speed,life,speedOffX,speedOffY){const i=this._pool.pop()||this._new();i.visible=true;i.heavy=false;i.x=x;i.y=y;i.prevX=x;i.prevY=y;i.color=color;i.speedX=Math.sin(angle)*speed+(speedOffX||0);i.speedY=Math.cos(angle)*speed+(speedOffY||0);i.life=life;i.fullLife=life;i.spinAngle=Math.random()*PI_24;i.spinSpeed=0.8;i.spinRadius=0;i.sparkFreq=0;i.sparkSpeed=1;i.sparkTimer=0;i.sparkColor=color;i.sparkLife=750;i.sparkLifeVariation=0.25;i.strobe=false;this.active[color].push(i);return i;},
          returnInstance(i){i.onDeath&&i.onDeath(i);i.onDeath=null;i.secondColor=null;i.transitionTime=0;i.colorChanged=false;this._pool.push(i);}
        };

        const Spark4={drawWidth:0,airDrag:0.9,active:createParticleCollection4(),_pool:[],_new(){return{};},
          add(x,y,color,angle,speed,life){const i=this._pool.pop()||this._new();i.x=x;i.y=y;i.prevX=x;i.prevY=y;i.color=color;i.speedX=Math.sin(angle)*speed;i.speedY=Math.cos(angle)*speed;i.life=life;this.active[color].push(i);return i;},
          returnInstance(i){this._pool.push(i);}
        };
        Spark4.drawWidth=isHighQuality4?0.75:1;

        const soundManager4={
          baseURL:'https://s3-us-west-2.amazonaws.com/s.cdpn.io/329180/',
          ctx:new(window.AudioContext||window.webkitAudioContext),
          sources:{
            lift:{volume:1,playbackRateMin:0.85,playbackRateMax:0.95,fileNames:['lift1.mp3','lift2.mp3','lift3.mp3']},
            burst:{volume:1,playbackRateMin:0.8,playbackRateMax:0.9,fileNames:['burst1.mp3','burst2.mp3']},
            burstSmall:{volume:0.25,playbackRateMin:0.8,playbackRateMax:1,fileNames:['burst-sm-1.mp3','burst-sm-2.mp3']},
            crackle:{volume:0.2,playbackRateMin:1,playbackRateMax:1,fileNames:['crackle1.mp3']},
            crackleSmall:{volume:0.3,playbackRateMin:1,playbackRateMax:1,fileNames:['crackle-sm-1.mp3']}
          },
          preload(){
            const allFP=[];
            function checkStatus(r){if(r.status>=200&&r.status<300)return r;const e=new Error(r.statusText);e.response=r;throw e;}
            const types=Object.keys(this.sources);
            types.forEach(type=>{const source=this.sources[type],{fileNames}=source,fp=[];fileNames.forEach(fn=>{const url=this.baseURL+fn;const p=fetch(url).then(checkStatus).then(r=>r.arrayBuffer()).then(data=>new Promise(resolve=>{this.ctx.decodeAudioData(data,resolve);}));fp.push(p);allFP.push(p);});Promise.all(fp).then(buffers=>{source.buffers=buffers;});});
            return Promise.all(allFP);
          },
          pauseAll(){this.ctx.suspend();},
          resumeAll(){this.playSound('lift',0);setTimeout(()=>{this.ctx.resume();},250);},
          _lastSmallBurstTime:0,
          playSound(type,scale=1){
            scale=MyMath4.clamp(scale,0,1);if(simSpeed4<0.95)return;
            if(type==='burstSmall'){const now=Date.now();if(now-this._lastSmallBurstTime<20)return;this._lastSmallBurstTime=now;}
            const source=this.sources[type];if(!source||!source.buffers)return;
            const iv=source.volume,ipr=MyMath4.random(source.playbackRateMin,source.playbackRateMax);
            const sv=iv*scale,spr=ipr*(2-scale);
            const gainNode=this.ctx.createGain();gainNode.gain.value=sv;
            const buffer=MyMath4.randomChoice(source.buffers),bufferSource=this.ctx.createBufferSource();
            bufferSource.playbackRate.value=spr;bufferSource.buffer=buffer;
            bufferSource.connect(gainNode);gainNode.connect(this.ctx.destination);bufferSource.start(0);
          }
        };

        soundManager4.preload().then(()=>{
          stageContainer4.style.opacity='1';
          soundManager4.resumeAll();
        },()=>{
          stageContainer4.style.opacity='1';
        });
      }
    },

    // Pen 5 – WebGL Ribbon Swarm
    {
      name: "simplifiedConfetti",
      welcomeName: "Welcome 5",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas style="position:absolute;top:0;left:0;display:block;background:transparent;opacity:0;animation:p5FadeIn 600ms ease forwards;-moz-user-select:none;-webkit-user-select:none;user-select:none;"></canvas>';
        if (!document.getElementById('p5-fade-style')) {
          var p5st = document.createElement('style'); p5st.id = 'p5-fade-style';
          p5st.textContent = '@keyframes p5FadeIn{to{opacity:1}}';
          document.head.appendChild(p5st);
        }

        (function () {
          "use strict";

          var WR = 5;
          var HW = 0.0175, HH = 0.035;
          var N = stage.clientWidth < 768 ? 400 : 3000;
          var RRX = Math.PI / 30;
          var RRZ = Math.PI / 50;
          var SY = 0.01, SX = 0.003, SZ = 0.005;
          var FOV = (35 * Math.PI) / 180;
          var NEAR = 1, FAR = WR * 3;
          var TGT_Y = 0.5;
          var MIN_D = 1, MAX_D = WR * 1.41421356;
          var MIN_P = 0.01, MAX_P5 = Math.PI / 2;
          var AUTO = Math.PI / 15;
          var DAMP = 0.1;
          var CLICK_THRESHOLD = 200;
          var BURST_F = 0.005;
          var VEL_DECAY = 0.92;

          var CLR = [
            [1,0,0],[1,0.5,0],[1,1,0],[0.5,1,0],[0,1,0],[0,1,0.5],
            [0,1,1],[0,0.5,1],[0,0,1],[0.5,0,1],[1,0,1],[1,0,0.5]
          ];

          var canvas5, gl5, prog5, uVP5;
          var pB5, rB5, cB5;
          var pA5, rA5, cA5, vA5;
          var theta5 = 0, phi5 = MAX_P5, dist5 = MAX_D;
          var tT5 = 0, tP5 = MAX_P5, tD5 = MAX_D;
          var drag5 = false, lx5 = 0, ly5 = 0, tid5 = -1;
          var lt5 = 0;
          var mR5 = false;
          var clickTimer5 = null;
          var clickMoved5 = false;

          function rf5(a, b) { return Math.random() * (b - a) + a; }

          function persp5(fov, asp, n, f) {
            var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f);
            return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)*nf,-1, 0,0,2*f*n*nf,0]);
          }

          function lookAt5(ex,ey,ez,tx,ty,tz) {
            var fx=ex-tx,fy=ey-ty,fz=ez-tz;
            var fl=1/Math.sqrt(fx*fx+fy*fy+fz*fz); fx*=fl; fy*=fl; fz*=fl;
            var rx=fz,ry=0,rz=-fx;
            var rl=Math.sqrt(rx*rx+rz*rz);
            if(rl>1e-6){rl=1/rl;rx*=rl;rz*=rl;}
            var ux=fy*rz,uy=fz*rx-fx*rz,uz=-fy*rx;
            return new Float32Array([rx,ux,fx,0, ry,uy,fy,0, rz,uz,fz,0,
              -(rx*ex+ry*ey+rz*ez),-(ux*ex+uy*ey+uz*ez),-(fx*ex+fy*ey+fz*ez),1]);
          }

          function mul5(a,b) {
            var o=new Float32Array(16);
            for(var c=0;c<4;c++) for(var r=0;r<4;r++)
              o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
            return o;
          }

          function viewProj5() {
            var sp=Math.sin(phi5),cp=Math.cos(phi5),st=Math.sin(theta5),ct=Math.cos(theta5);
            return mul5(persp5(FOV,canvas5.width/canvas5.height,NEAR,FAR),
              lookAt5(dist5*sp*st,TGT_Y+dist5*cp,dist5*sp*ct,0,TGT_Y,0));
          }

          function seedAll5() {
            for(var i=0;i<N;i++){
              var o=i*3,c=CLR[(Math.random()*12)|0];
              pA5[o]=rf5(-WR,WR); pA5[o+1]=rf5(-WR,WR); pA5[o+2]=rf5(-WR,WR);
              rA5[o]=Math.random()*Math.PI; rA5[o+1]=Math.random()*Math.PI; rA5[o+2]=Math.random()*Math.PI;
              cA5[o]=c[0]; cA5[o+1]=c[1]; cA5[o+2]=c[2];
              vA5[o]=0; vA5[o+1]=0; vA5[o+2]=0;
            }
            gl5.bindBuffer(gl5.ARRAY_BUFFER,cB5); gl5.bufferSubData(gl5.ARRAY_BUFFER,0,cA5);
          }

          function spawnBurst5() {
            var count=Math.round(N*0.15);
            for(var i=0;i<count;i++){
              var idx=Math.floor(Math.random()*N),o=idx*3,c=CLR[(Math.random()*12)|0];
              pA5[o]=rf5(-1,1); pA5[o+1]=rf5(-1,1)+TGT_Y; pA5[o+2]=rf5(-1,1);
              cA5[o]=c[0]; cA5[o+1]=c[1]; cA5[o+2]=c[2];
              var speed=rf5(0.08,0.25),bx=pA5[o],by=pA5[o+1]-TGT_Y,bz=pA5[o+2];
              var d=Math.sqrt(bx*bx+by*by+bz*bz)||1;
              vA5[o]=(bx/d)*speed; vA5[o+1]=(by/d)*speed; vA5[o+2]=(bz/d)*speed;
            }
            gl5.bindBuffer(gl5.ARRAY_BUFFER,cB5); gl5.bufferSubData(gl5.ARRAY_BUFFER,0,cA5);
          }

          function upd5() {
            for(var i=0;i<N;i++){
              var o=i*3,m=i%4;
              pA5[o+1]-=SY*(m+1);
              if(pA5[o+1]<-WR){
                pA5[o+1]=WR; pA5[o]=rf5(-WR,WR); pA5[o+2]=rf5(-WR,WR);
                vA5[o]=0; vA5[o+1]=0; vA5[o+2]=0;
              } else {
                pA5[o]+=m===1||m===2?SX:-SX;
                pA5[o+2]+=m===1||m===3?SZ:-SZ;
              }
              rA5[o]+=Math.random()*RRX;
              rA5[o+2]+=Math.random()*RRZ;
              if(mR5){
                var px=pA5[o],py=pA5[o+1]-TGT_Y,pz=pA5[o+2];
                var d=Math.sqrt(px*px+py*py+pz*pz);
                if(d>0.001){vA5[o]+=(px/d)*BURST_F;vA5[o+1]+=(py/d)*BURST_F;vA5[o+2]+=(pz/d)*BURST_F;}
              }
              pA5[o]+=vA5[o]; pA5[o+1]+=vA5[o+1]; pA5[o+2]+=vA5[o+2];
              vA5[o]*=VEL_DECAY; vA5[o+1]*=VEL_DECAY; vA5[o+2]*=VEL_DECAY;
            }
          }

          function resize5() {
            var d=window.devicePixelRatio||1;
            canvas5.width=stage.clientWidth*d; canvas5.height=stage.clientHeight*d;
            canvas5.style.width=stage.clientWidth+'px'; canvas5.style.height=stage.clientHeight+'px';
            if(gl5) gl5.viewport(0,0,canvas5.width,canvas5.height);
          }

          function setupEvents5() {
            window.addEventListener("resize",resize5);
            canvas5.addEventListener("mousedown",function(e){
              if(e.button===0){e.preventDefault();drag5=true;lx5=e.clientX;ly5=e.clientY;clickMoved5=false;
                clickTimer5=setTimeout(function(){clickTimer5=null;},CLICK_THRESHOLD);}
              if(e.button===1){e.preventDefault();seedAll5();}
              if(e.button===2) mR5=true;
            });
            window.addEventListener("mousemove",function(e){
              if(!drag5)return;
              var dx=e.clientX-lx5,dy=e.clientY-ly5;
              if(Math.sqrt(dx*dx+dy*dy)>4) clickMoved5=true;
              tT5-=dx*0.005; tP5-=dy*0.005;
              tP5=Math.max(MIN_P,Math.min(MAX_P5,tP5));
              lx5=e.clientX; ly5=e.clientY;
            });
            window.addEventListener("mouseup",function(e){
              if(e.button===0){drag5=false;
                if(clickTimer5!==null&&!clickMoved5){clearTimeout(clickTimer5);clickTimer5=null;spawnBurst5();}
                clickTimer5=null;}
              if(e.button===2) mR5=false;
            });
            canvas5.addEventListener("contextmenu",function(e){e.preventDefault();});
            canvas5.addEventListener("wheel",function(e){
              e.preventDefault();tD5=Math.max(MIN_D,Math.min(MAX_D,tD5+e.deltaY*0.01));
            },{passive:false});
            canvas5.addEventListener("touchstart",function(e){
              if(e.touches.length===1){drag5=true;var t=e.touches[0];tid5=t.identifier;lx5=t.clientX;ly5=t.clientY;}
            },{passive:true});
            canvas5.addEventListener("touchmove",function(e){
              if(!drag5)return;
              for(var i=0;i<e.changedTouches.length;i++){
                var t=e.changedTouches[i];
                if(t.identifier===tid5){tT5-=(t.clientX-lx5)*0.005;tP5-=(t.clientY-ly5)*0.005;
                  tP5=Math.max(MIN_P,Math.min(MAX_P5,tP5));lx5=t.clientX;ly5=t.clientY;}
              }
            },{passive:true});
            canvas5.addEventListener("touchend",function(){drag5=false;});
            document.addEventListener("visibilitychange",function(){if(!document.hidden)lt5=performance.now();});
          }

          function init5() {
            canvas5 = stage.querySelector('canvas');
            gl5 = canvas5.getContext("webgl2",{antialias:true,alpha:true,premultipliedAlpha:false});
            if(!gl5) return;
            resize5();

            var VS=[
              "#version 300 es","in vec2 a_v;","in vec3 a_p, a_r, a_c;","uniform mat4 u;","out vec3 vc;","void main(){",
              "  float cx=cos(a_r.x),sx=sin(a_r.x),cy=cos(a_r.y),sy=sin(a_r.y),cz=cos(a_r.z),sz=sin(a_r.z);",
              "  mat3 m=mat3(cy*cz, sx*sy*cz-cx*sz, cx*sy*cz+sx*sz, cy*sz, sx*sy*sz+cx*cz, cx*sy*sz-sx*cz, -sy, sx*cy, cx*cy);",
              "  gl_Position=u*vec4(m*vec3(a_v,0.)+a_p,1.);","  vc=a_c;","}"
            ].join("\n");
            var FS=["#version 300 es","precision mediump float;","in vec3 vc;","out vec4 o;","void main(){o=vec4(vc,1.);}"].join("\n");

            function sh5(t,s){var o=gl5.createShader(t);gl5.shaderSource(o,s);gl5.compileShader(o);return o;}
            prog5=gl5.createProgram();
            gl5.attachShader(prog5,sh5(gl5.VERTEX_SHADER,VS));
            gl5.attachShader(prog5,sh5(gl5.FRAGMENT_SHADER,FS));
            gl5.linkProgram(prog5); gl5.useProgram(prog5);
            uVP5=gl5.getUniformLocation(prog5,"u");

            var vao=gl5.createVertexArray(); gl5.bindVertexArray(vao);
            var q=new Float32Array([-HW,-HH, HW,-HH, HW,HH, -HW,-HH, HW,HH, -HW,HH]);
            var qb=gl5.createBuffer(); gl5.bindBuffer(gl5.ARRAY_BUFFER,qb);
            gl5.bufferData(gl5.ARRAY_BUFFER,q,gl5.STATIC_DRAW);
            var aV=gl5.getAttribLocation(prog5,"a_v");
            gl5.enableVertexAttribArray(aV); gl5.vertexAttribPointer(aV,2,gl5.FLOAT,false,0,0);

            function ib5(name){
              var b=gl5.createBuffer(); gl5.bindBuffer(gl5.ARRAY_BUFFER,b);
              gl5.bufferData(gl5.ARRAY_BUFFER,N*12,gl5.DYNAMIC_DRAW);
              var a=gl5.getAttribLocation(prog5,name);
              gl5.enableVertexAttribArray(a); gl5.vertexAttribPointer(a,3,gl5.FLOAT,false,0,0);
              gl5.vertexAttribDivisor(a,1); return b;
            }
            pB5=ib5("a_p"); rB5=ib5("a_r"); cB5=ib5("a_c");

            pA5=new Float32Array(N*3); rA5=new Float32Array(N*3);
            cA5=new Float32Array(N*3); vA5=new Float32Array(N*3);
            seedAll5();
            gl5.enable(gl5.DEPTH_TEST); gl5.disable(gl5.CULL_FACE);
            setupEvents5();
            lt5=performance.now();
            requestAnimationFrame(loop5);
          }

          function loop5(now) {
            requestAnimationFrame(loop5);
            var dt=(now-lt5)/1000; lt5=now;
            if(dt>0.1) dt=0.1;
            if(!drag5) tT5+=AUTO*dt;
            var df=1-Math.pow(1-DAMP,dt*60);
            theta5+=(tT5-theta5)*df; phi5+=(tP5-phi5)*df; dist5+=(tD5-dist5)*df;
            upd5();
            gl5.bindBuffer(gl5.ARRAY_BUFFER,pB5); gl5.bufferSubData(gl5.ARRAY_BUFFER,0,pA5);
            gl5.bindBuffer(gl5.ARRAY_BUFFER,rB5); gl5.bufferSubData(gl5.ARRAY_BUFFER,0,rA5);
            gl5.viewport(0,0,canvas5.width,canvas5.height);
            gl5.clearColor(0,0,0,0); gl5.clear(gl5.COLOR_BUFFER_BIT|gl5.DEPTH_BUFFER_BIT);
            gl5.uniformMatrix4fv(uVP5,false,viewProj5());
            gl5.drawArraysInstanced(gl5.TRIANGLES,0,6,N);
          }

          init5();
        })();
      }
    },

    // Pen 6 – Pointer Particles
    {
      name: "pointerParticles",
      welcomeName: "Welcome 6",
      deps: [],
      mount(stage) {
        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
        stage.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;

        var EXPLODE_R=200, MAX_CAP=16384, CLICK_THRESHOLD=200, TAU=Math.PI*2;
        var FPS=60, MS_PER_FRAME=1000/FPS, timePrev=0;
        function calcMax6(){return Math.min(Math.round(stage.clientWidth*stage.clientHeight/253),MAX_CAP);}

        var STRIDE6=9, PX6=0,PY6=1,SX6=2,SY6=3,SZ6=4,DC6=5,HU6=6;
        var maxP6=calcMax6(), buf6=new Float32Array(MAX_CAP*STRIDE6), count6=0;
        var cmx6=0, cmy6=0, mL6=false, mR6=false, mM6=false, clickTimer6=null;
        var hue6=0, lastTX6=0, lastTY6=0;

        function getPos6(e){var r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}

        function addParticle6(px,py,pmx,pmy,speed,spread){
          if(count6>=maxP6)return;
          var o=count6*STRIDE6, spd=speed*0.08, spr=spread*spd;
          buf6[o+PX6]=px; buf6[o+PY6]=py;
          buf6[o+SZ6]=Math.random()+2; buf6[o+DC6]=0.01;
          buf6[o+SX6]=(Math.random()-0.5)*spr-pmx*0.1;
          buf6[o+SY6]=(Math.random()-0.5)*spr-pmy*0.1;
          buf6[o+HU6]=hue6; count6++;
        }
        function createParticles6(px,py,pmx,pmy,n,speed,spread){for(var i=0;i<n;i++)addParticle6(px,py,pmx,pmy,speed,spread);}

        canvas.addEventListener('mousedown',function(e){if(e.button===0){mL6=true;clickTimer6=setTimeout(function(){clickTimer6=null;},CLICK_THRESHOLD);}if(e.button===1)mM6=true;if(e.button===2)mR6=true;});
        canvas.addEventListener('mouseup',function(e){
          if(e.button===0){mL6=false;if(clickTimer6!==null){clearTimeout(clickTimer6);clickTimer6=null;var p=getPos6(e);createParticles6(p.x,p.y,e.movementX||0,e.movementY||0,300,Math.random()+1,Math.random()+50);}}
          if(e.button===1)mM6=false;if(e.button===2)mR6=false;
        });
        canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
        window.addEventListener('mouseup',function(e){if(e.button===2)mR6=false;});
        canvas.addEventListener('touchstart',function(e){if(e.touches.length){var t=e.touches[0],r=canvas.getBoundingClientRect();createParticles6(t.clientX-r.left,t.clientY-r.top,0,0,300,Math.random()+1,Math.random()+50);}});
        canvas.addEventListener('pointermove',function(e){var a=e.movementX,b=e.movementY,vel=Math.floor(Math.sqrt(a*a+b*b)),p=getPos6(e);cmx6=p.x;cmy6=p.y;createParticles6(p.x,p.y,a,b,20,vel,1);});
        canvas.addEventListener('touchmove',function(e){
          if(e.touches.length){var t=e.touches[0],r=canvas.getBoundingClientRect();
          var tmx=t.clientX-(lastTX6||t.clientX),tmy=t.clientY-(lastTY6||t.clientY);
          lastTX6=t.clientX;lastTY6=t.clientY;cmx6=t.clientX-r.left;cmy6=t.clientY-r.top;
          var vel=Math.floor(Math.sqrt(tmx*tmx+tmy*tmy));createParticles6(cmx6,cmy6,tmx,tmy,20,vel,1);}
        });
        window.addEventListener('resize',function(){canvas.width=stage.clientWidth;canvas.height=stage.clientHeight;maxP6=calcMax6();if(count6>maxP6)count6=maxP6;});

        requestAnimationFrame(animate6);
        function animate6(timeNow){
          requestAnimationFrame(animate6);
          var timePassed=timeNow-timePrev; if(timePassed<MS_PER_FRAME)return;
          timePrev=timeNow-(timePassed%MS_PER_FRAME);
          ctx.clearRect(0,0,canvas.width,canvas.height);
          hue6=(hue6+3)%360;
          var isHold=mL6&&clickTimer6===null, n=count6, i=0;
          while(i<n){
            var o=i*STRIDE6, sz=buf6[o+SZ6];
            if(mR6||mM6){var ddx=buf6[o+PX6]-cmx6,ddy=buf6[o+PY6]-cmy6,dist=Math.sqrt(ddx*ddx+ddy*ddy);if(mR6&&dist<EXPLODE_R&&dist>0){buf6[o+SX6]+=(ddx/dist)*0.3;buf6[o+SY6]+=(ddy/dist)*0.3;}if(mM6&&dist<EXPLODE_R){var f=dist/EXPLODE_R;buf6[o+SX6]*=f;buf6[o+SY6]*=f;}}
            if(isHold){buf6[o+SX6]+=(cmx6-buf6[o+PX6])*0.00015;buf6[o+SY6]+=(cmy6-buf6[o+PY6])*0.00015;}
            buf6[o+PX6]+=buf6[o+SX6]*sz; buf6[o+PY6]+=buf6[o+SY6]*sz;
            sz-=buf6[o+DC6]; buf6[o+SZ6]=sz;
            if(sz<=0.1){n--;if(i<n){var lo=n*STRIDE6,co=i*STRIDE6;for(var j=0;j<STRIDE6;j++)buf6[co+j]=buf6[lo+j];}continue;}
            ctx.fillStyle='hsl('+(buf6[o+HU6]|0)+'deg 90% 60%)';
            ctx.beginPath();ctx.arc(buf6[o+PX6],buf6[o+PY6],sz,0,TAU);ctx.fill();
            i++;
          }
          count6=n;
        }
      }
    },

    // Pen 7 – Bubbles
    {
      name: "bubbles",
      welcomeName: "Welcome 7",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="canvas" style="display:block; width:100%; height:100%;"></canvas>';
        var canvas = stage.querySelector('#canvas');
        var ctx = canvas.getContext('2d');

        var bSize       = 12;
        var bSpeed      = 3;
        var bDep        = 0.03;
        var bDist       = 30;
        var bDist2      = bDist * bDist;
        var MAX_CAP7    = 16384;
        var EXPLODE_R7  = 200;
        var halfSpd7    = bSpeed / 2;
        var CLICK_THR7  = 200;

        function calcMax7()   { return Math.min(Math.round(stage.clientWidth * stage.clientHeight / 253), MAX_CAP7); }
        function calcBurst7() { return Math.max(2, Math.round(stage.clientWidth * stage.clientHeight / 207360)); }
        function calcBNum7()  { return Math.max(1, Math.round(stage.clientWidth * stage.clientHeight / 691200)); }

        var MAX_P7       = calcMax7();
        var CLICK_BURST7 = calcBurst7();
        var bNum7        = calcBNum7();

        var STRIDE7 = 6;
        var PX7=0, PY7=1, VX7=2, VY7=3, SZ7=4, HU7=5;
        var buf7 = new Float32Array(MAX_CAP7 * STRIDE7);
        var count7 = 0;

        var hue7 = 0;
        var mL7 = false, mR7 = false, mM7 = false;
        var mx7 = 0, my7 = 0;
        var clickTimer7 = null;

        canvas.width  = stage.clientWidth;
        canvas.height = stage.clientHeight;

        var CELL7  = bDist;
        var gridW7 = 0, gridH7 = 0, gridCells7 = 0;
        var grid7  = [];

        function initGrid7() {
          gridW7     = Math.ceil(canvas.width  / CELL7) + 1;
          gridH7     = Math.ceil(canvas.height / CELL7) + 1;
          gridCells7 = gridW7 * gridH7;
          grid7      = new Array(gridCells7);
          for (var c = 0; c < gridCells7; c++) grid7[c] = [];
        }

        function buildGrid7(n) {
          for (var c = 0; c < gridCells7; c++) grid7[c].length = 0;
          for (var i = 0; i < n; i++) {
            var o  = i * STRIDE7;
            var cx = (buf7[o + PX7] / CELL7) | 0;
            var cy = (buf7[o + PY7] / CELL7) | 0;
            if (cx >= 0 && cx < gridW7 && cy >= 0 && cy < gridH7) {
              grid7[cy * gridW7 + cx].push(i);
            }
          }
        }

        initGrid7();

        function addParticle7() {
          if (count7 >= MAX_P7) return;
          var o = count7 * STRIDE7;
          buf7[o + PX7] = mx7;
          buf7[o + PY7] = my7;
          buf7[o + SZ7] = Math.random() * bSize + 0.1;
          buf7[o + VX7] = Math.random() * bSpeed - halfSpd7;
          buf7[o + VY7] = Math.random() * bSpeed - halfSpd7;
          buf7[o + HU7] = hue7;
          count7++;
        }

        function spawnBurst7() {
          for (var i = 0; i < bNum7; i++) addParticle7();
        }

        canvas.addEventListener('mousemove', function (e) {
          var rect = canvas.getBoundingClientRect();
          mx7 = e.clientX - rect.left; my7 = e.clientY - rect.top;
          spawnBurst7();
        });

        canvas.addEventListener('touchmove', function (e) {
          e.preventDefault();
          var rect = canvas.getBoundingClientRect();
          mx7 = e.touches[0].clientX - rect.left;
          my7 = e.touches[0].clientY - rect.top;
          spawnBurst7();
        });

        canvas.addEventListener('mousedown', function (e) {
          if (e.button === 0) {
            mL7 = true;
            clickTimer7 = setTimeout(function () { clickTimer7 = null; }, CLICK_THR7);
          }
          if (e.button === 1) mM7 = true;
          if (e.button === 2) mR7 = true;
        });

        canvas.addEventListener('mouseup', function (e) {
          if (e.button === 0) {
            mL7 = false;
            if (clickTimer7 !== null) {
              clearTimeout(clickTimer7);
              clickTimer7 = null;
              for (var i = 0; i < CLICK_BURST7; i++) addParticle7();
            }
          }
          if (e.button === 1) mM7 = false;
          if (e.button === 2) mR7 = false;
        });

        canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        window.addEventListener('mouseup', function (e) { if (e.button === 2) mR7 = false; });

        canvas.addEventListener('touchstart', function (e) {
          e.preventDefault();
          if (e.touches.length) {
            var rect = canvas.getBoundingClientRect();
            mx7 = e.touches[0].clientX - rect.left;
            my7 = e.touches[0].clientY - rect.top;
          }
          for (var i = 0; i < CLICK_BURST7; i++) addParticle7();
        });

        window.addEventListener('resize', function () {
          canvas.width  = stage.clientWidth;
          canvas.height = stage.clientHeight;
          MAX_P7        = calcMax7();
          CLICK_BURST7  = calcBurst7();
          bNum7         = calcBNum7();
          if (count7 > MAX_P7) count7 = MAX_P7;
          initGrid7();
        });

        function animate7() {
          requestAnimationFrame(animate7);
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          var n = count7;
          var i, j, o, o2;
          var px, py, sz, dx, dy, d2;

          i = 0;
          while (i < n) {
            o = i * STRIDE7;

            if (mL7 && clickTimer7 === null) {
              buf7[o + VX7] += (mx7 - buf7[o + PX7]) * 0.0003;
              buf7[o + VY7] += (my7 - buf7[o + PY7]) * 0.0003;
            }

            if (mR7 || mM7) {
              var ddx  = buf7[o + PX7] - mx7;
              var ddy  = buf7[o + PY7] - my7;
              var dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (mR7 && dist < EXPLODE_R7 && dist > 0) {
                buf7[o + VX7] += (ddx / dist) * 2;
                buf7[o + VY7] += (ddy / dist) * 2;
              }
              if (mM7 && dist < EXPLODE_R7) {
                var f = dist / EXPLODE_R7;
                buf7[o + VX7] *= f;
                buf7[o + VY7] *= f;
              }
            }

            buf7[o + PX7] += buf7[o + VX7];
            buf7[o + PY7] += buf7[o + VY7];
            sz = buf7[o + SZ7];
            if (sz > bDep) {
              sz -= bDep;
              buf7[o + SZ7] = sz;
            }

            if (sz <= bDep) {
              n--;
              if (i < n) {
                var lo = n * STRIDE7, co = i * STRIDE7;
                buf7[co]   = buf7[lo];   buf7[co+1] = buf7[lo+1];
                buf7[co+2] = buf7[lo+2]; buf7[co+3] = buf7[lo+3];
                buf7[co+4] = buf7[lo+4]; buf7[co+5] = buf7[lo+5];
              }
              continue;
            }

            px = buf7[o + PX7];
            py = buf7[o + PY7];
            ctx.strokeStyle = 'hsl(' + (buf7[o + HU7] | 0) + ',100%,50%)';
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.roundRect(px, py, sz, sz, 2);
            ctx.stroke();

            i++;
          }
          count7 = n;

          buildGrid7(n);

          for (i = 0; i < n; i++) {
            o  = i * STRIDE7;
            px = buf7[o + PX7];
            py = buf7[o + PY7];
            sz = buf7[o + SZ7];

            var gcx = (px / CELL7) | 0;
            var gcy = (py / CELL7) | 0;

            ctx.strokeStyle = 'hsl(' + (buf7[o + HU7] | 0) + ',100%,50%)';
            ctx.lineWidth   = sz / 3;
            ctx.beginPath();
            var hasLine = false;

            for (var gy = gcy - 1; gy <= gcy + 1; gy++) {
              if (gy < 0 || gy >= gridH7) continue;
              for (var gx = gcx - 1; gx <= gcx + 1; gx++) {
                if (gx < 0 || gx >= gridW7) continue;
                var cell = grid7[gy * gridW7 + gx];
                for (var k = 0; k < cell.length; k++) {
                  j = cell[k];
                  if (j <= i) continue;
                  o2 = j * STRIDE7;
                  dx = px - buf7[o2 + PX7];
                  dy = py - buf7[o2 + PY7];
                  d2 = dx * dx + dy * dy;
                  if (d2 < bDist2) {
                    ctx.moveTo(px, py);
                    ctx.bezierCurveTo(buf7[o2+PX7], buf7[o2+PY7], buf7[o2+PX7], py, buf7[o2+PX7], buf7[o2+PY7]);
                    hasLine = true;
                  }
                }
              }
            }

            if (hasLine) ctx.stroke();
          }

          hue7++;
        }

        animate7();
      }
    },

    // Pen 8 – Connected Particles
    {
      name: "connectedParticles",
      welcomeName: "Welcome 8",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="canvas" style="display:block; width:100%; height:100%;"></canvas>';
        var canvas = stage.querySelector('#canvas');
        var ctx = canvas.getContext('2d');

        var bSize8      = 8;
        var bSpeed8     = 3;
        var bDep8       = 0.01;
        var bDist8      = 30;
        var bDist2_8    = bDist8 * bDist8;
        var TAU8        = Math.PI * 2;
        var MAX_CAP8    = 16384;
        var EXPLODE_R8  = 200;
        var halfSpd8    = bSpeed8 / 2;
        var CLICK_THR8  = 200;

        function calcMax8()   { return Math.min(Math.round(stage.clientWidth * stage.clientHeight / 253), MAX_CAP8); }
        function calcBurst8() { return Math.max(2, Math.round(stage.clientWidth * stage.clientHeight / 207360)); }
        function calcBNum8()  { return Math.max(1, Math.round(stage.clientWidth * stage.clientHeight / 1036800)); }

        var MAX_P8       = calcMax8();
        var CLICK_BURST8 = calcBurst8();
        var bNum8        = calcBNum8();

        var STRIDE8 = 6;
        var PX8=0, PY8=1, VX8=2, VY8=3, SZ8=4, HU8=5;
        var buf8 = new Float32Array(MAX_CAP8 * STRIDE8);
        var count8 = 0;

        var hue8 = 0;
        var mL8 = false, mR8 = false, mM8 = false;
        var mx8 = 0, my8 = 0;
        var clickTimer8 = null;

        canvas.width  = stage.clientWidth;
        canvas.height = stage.clientHeight;

        var CELL8  = bDist8;
        var gridW8 = 0, gridH8 = 0, gridCells8 = 0;
        var grid8  = [];

        function initGrid8() {
          gridW8     = Math.ceil(canvas.width  / CELL8) + 1;
          gridH8     = Math.ceil(canvas.height / CELL8) + 1;
          gridCells8 = gridW8 * gridH8;
          grid8      = new Array(gridCells8);
          for (var c = 0; c < gridCells8; c++) grid8[c] = [];
        }

        function buildGrid8(n) {
          for (var c = 0; c < gridCells8; c++) grid8[c].length = 0;
          for (var i = 0; i < n; i++) {
            var o  = i * STRIDE8;
            var cx = (buf8[o + PX8] / CELL8) | 0;
            var cy = (buf8[o + PY8] / CELL8) | 0;
            if (cx >= 0 && cx < gridW8 && cy >= 0 && cy < gridH8) {
              grid8[cy * gridW8 + cx].push(i);
            }
          }
        }

        initGrid8();

        function addParticle8() {
          if (count8 >= MAX_P8) return;
          var o = count8 * STRIDE8;
          buf8[o + PX8] = mx8;
          buf8[o + PY8] = my8;
          buf8[o + SZ8] = Math.random() * bSize8 + 0.1;
          buf8[o + VX8] = Math.random() * bSpeed8 - halfSpd8;
          buf8[o + VY8] = Math.random() * bSpeed8 - halfSpd8;
          buf8[o + HU8] = hue8;
          count8++;
        }

        function spawnBurst8() {
          for (var i = 0; i < bNum8; i++) addParticle8();
        }

        canvas.addEventListener('mousemove', function (e) {
          var rect = canvas.getBoundingClientRect();
          mx8 = e.clientX - rect.left; my8 = e.clientY - rect.top;
          spawnBurst8();
        });

        canvas.addEventListener('touchmove', function (e) {
          e.preventDefault();
          var rect = canvas.getBoundingClientRect();
          mx8 = e.touches[0].clientX - rect.left;
          my8 = e.touches[0].clientY - rect.top;
          spawnBurst8();
        });

        canvas.addEventListener('mousedown', function (e) {
          if (e.button === 0) {
            mL8 = true;
            clickTimer8 = setTimeout(function () { clickTimer8 = null; }, CLICK_THR8);
          }
          if (e.button === 1) mM8 = true;
          if (e.button === 2) mR8 = true;
        });

        canvas.addEventListener('mouseup', function (e) {
          if (e.button === 0) {
            mL8 = false;
            if (clickTimer8 !== null) {
              clearTimeout(clickTimer8);
              clickTimer8 = null;
              for (var i = 0; i < CLICK_BURST8; i++) addParticle8();
            }
          }
          if (e.button === 1) mM8 = false;
          if (e.button === 2) mR8 = false;
        });

        canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        window.addEventListener('mouseup', function (e) { if (e.button === 2) mR8 = false; });

        canvas.addEventListener('touchstart', function (e) {
          e.preventDefault();
          if (e.touches.length) {
            var rect = canvas.getBoundingClientRect();
            mx8 = e.touches[0].clientX - rect.left;
            my8 = e.touches[0].clientY - rect.top;
          }
          for (var i = 0; i < CLICK_BURST8; i++) addParticle8();
        });

        window.addEventListener('resize', function () {
          canvas.width  = stage.clientWidth;
          canvas.height = stage.clientHeight;
          MAX_P8        = calcMax8();
          CLICK_BURST8  = calcBurst8();
          bNum8         = calcBNum8();
          if (count8 > MAX_P8) count8 = MAX_P8;
          initGrid8();
        });

        function animate8() {
          requestAnimationFrame(animate8);
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          var n = count8;
          var i, j, o, o2;
          var px, py, sz, dx, dy, d2;

          i = 0;
          while (i < n) {
            o = i * STRIDE8;

            if (mL8 && clickTimer8 === null) {
              buf8[o + VX8] += (mx8 - buf8[o + PX8]) * 0.0003;
              buf8[o + VY8] += (my8 - buf8[o + PY8]) * 0.0003;
            }

            if (mR8 || mM8) {
              var ddx  = buf8[o + PX8] - mx8;
              var ddy  = buf8[o + PY8] - my8;
              var dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (mR8 && dist < EXPLODE_R8 && dist > 0) {
                buf8[o + VX8] += (ddx / dist) * 2;
                buf8[o + VY8] += (ddy / dist) * 2;
              }
              if (mM8 && dist < EXPLODE_R8) {
                var f = dist / EXPLODE_R8;
                buf8[o + VX8] *= f;
                buf8[o + VY8] *= f;
              }
            }

            buf8[o + PX8] += buf8[o + VX8];
            buf8[o + PY8] += buf8[o + VY8];
            sz = buf8[o + SZ8];
            if (sz > bDep8) {
              sz -= bDep8;
              buf8[o + SZ8] = sz;
            }

            if (sz <= bDep8) {
              n--;
              if (i < n) {
                var lo = n * STRIDE8, co = i * STRIDE8;
                buf8[co]   = buf8[lo];   buf8[co+1] = buf8[lo+1];
                buf8[co+2] = buf8[lo+2]; buf8[co+3] = buf8[lo+3];
                buf8[co+4] = buf8[lo+4]; buf8[co+5] = buf8[lo+5];
              }
              continue;
            }

            px = buf8[o + PX8];
            py = buf8[o + PY8];
            ctx.fillStyle = 'hsl(' + (buf8[o + HU8] | 0) + ',100%,50%)';
            ctx.beginPath();
            ctx.arc(px, py, sz, 0, TAU8);
            ctx.fill();

            i++;
          }
          count8 = n;

          buildGrid8(n);

          for (i = 0; i < n; i++) {
            o  = i * STRIDE8;
            px = buf8[o + PX8];
            py = buf8[o + PY8];
            sz = buf8[o + SZ8];

            var gcx = (px / CELL8) | 0;
            var gcy = (py / CELL8) | 0;

            ctx.strokeStyle = 'hsl(' + (buf8[o + HU8] | 0) + ',100%,50%)';
            ctx.lineWidth   = sz / 3;
            ctx.beginPath();
            var hasLine = false;

            for (var gy = gcy - 1; gy <= gcy + 1; gy++) {
              if (gy < 0 || gy >= gridH8) continue;
              for (var gx = gcx - 1; gx <= gcx + 1; gx++) {
                if (gx < 0 || gx >= gridW8) continue;
                var cell = grid8[gy * gridW8 + gx];
                for (var k = 0; k < cell.length; k++) {
                  j = cell[k];
                  if (j <= i) continue;
                  o2 = j * STRIDE8;
                  dx = px - buf8[o2 + PX8];
                  dy = py - buf8[o2 + PY8];
                  d2 = dx * dx + dy * dy;
                  if (d2 < bDist2_8) {
                    ctx.moveTo(px, py);
                    ctx.lineTo(buf8[o2 + PX8], buf8[o2 + PY8]);
                    hasLine = true;
                  }
                }
              }
            }

            if (hasLine) ctx.stroke();
          }

          hue8++;
        }

        animate8();
      }
    },

    // Pen 9 – Hold Particles
    {
      name: "holdParticles",
      welcomeName: "Welcome 9",
      deps: [],
      mount(stage) {
        stage.innerHTML = '<canvas id="canvas" style="display:block; width:100%; height:100%;"></canvas>';
        var canvas = stage.querySelector('#canvas');
        var ctx = canvas.getContext('2d');

        var P_SIZE9     = 2;
        var P_SPEED9    = 2;
        var P_DEP9      = 0.01;
        var P_DEATH9    = 0.3;
        var LINK_D9     = 30;
        var LINK_D2_9   = LINK_D9 * LINK_D9;
        var TAU9        = Math.PI * 2;
        var MAX_CAP9    = 16384;
        var EXPLODE_R9  = 200;
        var halfSpd9    = P_SPEED9 / 2;
        var CLICK_THR9  = 200;

        function calcMax9()   { return Math.min(Math.round(stage.clientWidth * stage.clientHeight / 253), MAX_CAP9); }
        function calcBurst9() { return Math.max(2, Math.round(stage.clientWidth * stage.clientHeight / 207360)); }
        function calcSpawn9() { return Math.max(1, Math.round(stage.clientWidth * stage.clientHeight / 691200)); }

        var MAX_P9       = calcMax9();
        var CLICK_BURST9 = calcBurst9();
        var SPAWN9       = calcSpawn9();

        var STRIDE9 = 6;
        var PX9=0, PY9=1, VX9=2, VY9=3, SZ9=4, HU9=5;
        var buf9 = new Float32Array(MAX_CAP9 * STRIDE9);
        var count9 = 0;

        var hue9 = 0;
        var mL9 = false, mR9 = false, mM9 = false;
        var mx9, my9;
        var clickTimer9 = null;

        canvas.width  = stage.clientWidth;
        canvas.height = stage.clientHeight;

        var CELL9  = LINK_D9;
        var gridW9 = 0, gridH9 = 0, gridCells9 = 0;
        var grid9  = [];

        function initGrid9() {
          gridW9     = Math.ceil(canvas.width  / CELL9) + 1;
          gridH9     = Math.ceil(canvas.height / CELL9) + 1;
          gridCells9 = gridW9 * gridH9;
          grid9      = new Array(gridCells9);
          for (var c = 0; c < gridCells9; c++) grid9[c] = [];
        }

        function buildGrid9(n) {
          for (var c = 0; c < gridCells9; c++) grid9[c].length = 0;
          for (var i = 0; i < n; i++) {
            var o  = i * STRIDE9;
            var cx = (buf9[o + PX9] / CELL9) | 0;
            var cy = (buf9[o + PY9] / CELL9) | 0;
            if (cx >= 0 && cx < gridW9 && cy >= 0 && cy < gridH9) {
              grid9[cy * gridW9 + cx].push(i);
            }
          }
        }

        initGrid9();

        function addParticle9() {
          if (count9 >= MAX_P9 || mx9 === undefined) return;
          var o = count9 * STRIDE9;
          buf9[o + PX9] = mx9;
          buf9[o + PY9] = my9;
          buf9[o + SZ9] = Math.random() * P_SIZE9 + 0.1;
          buf9[o + VX9] = Math.random() * P_SPEED9 - halfSpd9;
          buf9[o + VY9] = Math.random() * P_SPEED9 - halfSpd9;
          buf9[o + HU9] = hue9;
          count9++;
        }

        function spawnBurst9() {
          for (var i = 0; i < SPAWN9; i++) addParticle9();
        }

        canvas.addEventListener('mousemove', function (e) {
          var rect = canvas.getBoundingClientRect();
          mx9 = e.clientX - rect.left; my9 = e.clientY - rect.top;
          spawnBurst9();
        });

        canvas.addEventListener('touchmove', function (e) {
          e.preventDefault();
          var rect = canvas.getBoundingClientRect();
          mx9 = e.touches[0].clientX - rect.left;
          my9 = e.touches[0].clientY - rect.top;
          spawnBurst9();
        });

        canvas.addEventListener('touchstart', function (e) {
          e.preventDefault();
          var rect = canvas.getBoundingClientRect();
          mx9 = e.touches[0].clientX - rect.left;
          my9 = e.touches[0].clientY - rect.top;
          for (var i = 0; i < CLICK_BURST9; i++) addParticle9();
        });

        canvas.addEventListener('mousedown', function (e) {
          if (e.button === 0) {
            mL9 = true;
            clickTimer9 = setTimeout(function () { clickTimer9 = null; }, CLICK_THR9);
          }
          if (e.button === 1) mM9 = true;
          if (e.button === 2) mR9 = true;
        });

        canvas.addEventListener('mouseup', function (e) {
          if (e.button === 0) {
            mL9 = false;
            if (clickTimer9 !== null) {
              clearTimeout(clickTimer9);
              clickTimer9 = null;
              for (var i = 0; i < CLICK_BURST9; i++) addParticle9();
            }
          }
          if (e.button === 1) mM9 = false;
          if (e.button === 2) mR9 = false;
        });

        canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        window.addEventListener('mouseup', function (e) { if (e.button === 2) mR9 = false; });

        window.addEventListener('mouseout', function () {
          mx9 = undefined; my9 = undefined;
          mL9 = false; mR9 = false; mM9 = false;
          if (clickTimer9) { clearTimeout(clickTimer9); clickTimer9 = null; }
        });

        window.addEventListener('resize', function () {
          canvas.width  = stage.clientWidth;
          canvas.height = stage.clientHeight;
          MAX_P9        = calcMax9();
          CLICK_BURST9  = calcBurst9();
          SPAWN9        = calcSpawn9();
          if (count9 > MAX_P9) count9 = MAX_P9;
          initGrid9();
        });

        function animate9() {
          requestAnimationFrame(animate9);
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          var n = count9;
          var i, j, o, o2;
          var px, py, sz, dx, dy, d2;

          i = 0;
          while (i < n) {
            o = i * STRIDE9;

            if (mL9 && clickTimer9 === null && mx9 !== undefined) {
              buf9[o + VX9] += (mx9 - buf9[o + PX9]) * 0.0003;
              buf9[o + VY9] += (my9 - buf9[o + PY9]) * 0.0003;
            }

            if ((mR9 || mM9) && mx9 !== undefined) {
              var ddx  = buf9[o + PX9] - mx9;
              var ddy  = buf9[o + PY9] - my9;
              var dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (mR9 && dist < EXPLODE_R9 && dist > 0) {
                buf9[o + VX9] += (ddx / dist) * 2;
                buf9[o + VY9] += (ddy / dist) * 2;
              }
              if (mM9 && dist < EXPLODE_R9) {
                var f = dist / EXPLODE_R9;
                buf9[o + VX9] *= f;
                buf9[o + VY9] *= f;
              }
            }

            buf9[o + PX9] += buf9[o + VX9];
            buf9[o + PY9] += buf9[o + VY9];
            sz = buf9[o + SZ9];
            if (sz > 0.2) {
              sz -= P_DEP9;
              buf9[o + SZ9] = sz;
            }

            if (sz <= P_DEATH9) {
              n--;
              if (i < n) {
                var lo = n * STRIDE9, co = i * STRIDE9;
                buf9[co]   = buf9[lo];   buf9[co+1] = buf9[lo+1];
                buf9[co+2] = buf9[lo+2]; buf9[co+3] = buf9[lo+3];
                buf9[co+4] = buf9[lo+4]; buf9[co+5] = buf9[lo+5];
              }
              continue;
            }

            px = buf9[o + PX9];
            py = buf9[o + PY9];
            ctx.fillStyle = 'hsl(' + (buf9[o + HU9] | 0) + ',100%,50%)';
            ctx.beginPath();
            ctx.arc(px, py, sz, 0, TAU9);
            ctx.fill();

            i++;
          }
          count9 = n;

          buildGrid9(n);

          for (i = 0; i < n; i++) {
            o  = i * STRIDE9;
            px = buf9[o + PX9];
            py = buf9[o + PY9];
            sz = buf9[o + SZ9];

            var gcx = (px / CELL9) | 0;
            var gcy = (py / CELL9) | 0;

            ctx.strokeStyle = 'hsl(' + (buf9[o + HU9] | 0) + ',100%,50%)';
            ctx.lineWidth   = sz / 10;
            ctx.beginPath();
            var hasLine = false;

            for (var gy = gcy - 1; gy <= gcy + 1; gy++) {
              if (gy < 0 || gy >= gridH9) continue;
              for (var gx = gcx - 1; gx <= gcx + 1; gx++) {
                if (gx < 0 || gx >= gridW9) continue;
                var cell = grid9[gy * gridW9 + gx];
                for (var k = 0; k < cell.length; k++) {
                  j = cell[k];
                  if (j <= i) continue;
                  o2 = j * STRIDE9;
                  dx = px - buf9[o2 + PX9];
                  dy = py - buf9[o2 + PY9];
                  d2 = dx * dx + dy * dy;
                  if (d2 < LINK_D2_9) {
                    ctx.moveTo(px, py);
                    ctx.lineTo(buf9[o2 + PX9], buf9[o2 + PY9]);
                    hasLine = true;
                  }
                }
              }
            }

            if (hasLine) ctx.stroke();
          }

          hue9++;
        }

        animate9();
      }
    },

    // Pen 10 – Hold Particles (variant)
    {
      name: "holdParticles2",
      welcomeName: "Welcome 10",
      deps: [],
      mount(stage) {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;background:transparent;opacity:0;animation:holdP2FadeIn 600ms ease forwards;z-index:0';
        const styleEl = document.createElement('style');
        styleEl.textContent = '@keyframes holdP2FadeIn{to{opacity:1}}';
        stage.appendChild(styleEl);
        stage.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;

        const mouse = { x: undefined, y: undefined };
        const holdParticles = [];
        let hue = 0;

        var MAX_CAP         = 16384;
        var EXPLODE_R       = 200;
        var CLICK_THRESHOLD = 200;
        var mL = false, mR = false, mM = false;
        var clickTimer = null;

        function calcMax() {
          return Math.min(Math.round(canvas.width * canvas.height / 253), MAX_CAP);
        }
        function calcBurst() {
          return Math.max(10, Math.round(canvas.width * canvas.height / 41472));
        }

        var MAX_P       = calcMax();
        var CLICK_BURST = calcBurst();

        window.addEventListener('resize', function () {
          canvas.width  = stage.clientWidth;
          canvas.height = stage.clientHeight;
          MAX_P         = calcMax();
          CLICK_BURST   = calcBurst();
        });

        canvas.addEventListener('mousemove', function (event) {
          mouse.x = event.clientX - canvas.getBoundingClientRect().left;
          mouse.y = event.clientY - canvas.getBoundingClientRect().top;
          const particleCount = canvas.width < 768 ? 1 : 2;
          for (let i = 0; i < particleCount; i++) {
            if (holdParticles.length < MAX_P) holdParticles.push(new Particle());
          }
        });

        canvas.addEventListener('touchstart', function (event) {
          const touch = event.touches[0];
          const rect = canvas.getBoundingClientRect();
          mouse.x = touch.clientX - rect.left;
          mouse.y = touch.clientY - rect.top;
          for (let i = 0; i < CLICK_BURST; i++) {
            if (holdParticles.length < MAX_P) holdParticles.push(new Particle());
          }
        });

        canvas.addEventListener('touchmove', function (event) {
          event.preventDefault();
          const touch = event.touches[0];
          const rect = canvas.getBoundingClientRect();
          mouse.x = touch.clientX - rect.left;
          mouse.y = touch.clientY - rect.top;
          const particleCount = canvas.width < 768 ? 1 : 2;
          for (let i = 0; i < particleCount; i++) {
            if (holdParticles.length < MAX_P) holdParticles.push(new Particle());
          }
        });

        canvas.addEventListener('mousedown', function (e) {
          if (e.button === 0) {
            mL = true;
            clickTimer = setTimeout(function () { clickTimer = null; }, CLICK_THRESHOLD);
          }
          if (e.button === 1) mM = true;
          if (e.button === 2) mR = true;
        });

        canvas.addEventListener('mouseup', function (e) {
          if (e.button === 0) {
            mL = false;
            if (clickTimer !== null) {
              clearTimeout(clickTimer);
              clickTimer = null;
              const rect = canvas.getBoundingClientRect();
              mouse.x = e.clientX - rect.left;
              mouse.y = e.clientY - rect.top;
              for (let i = 0; i < CLICK_BURST; i++) {
                if (holdParticles.length < MAX_P) holdParticles.push(new Particle());
              }
            }
          }
          if (e.button === 1) mM = false;
          if (e.button === 2) mR = false;
        });

        canvas.addEventListener('contextmenu', function (e) {
          e.preventDefault();
        });

        window.addEventListener('mouseup', function (e) {
          if (e.button === 2) mR = false;
        });

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
            if (mL && clickTimer === null && mouse.x !== undefined) {
              this.speedX += (mouse.x - this.x) * 0.0003;
              this.speedY += (mouse.y - this.y) * 0.0003;
            }

            if ((mR || mM) && mouse.x !== undefined) {
              const ddx = this.x - mouse.x;
              const ddy = this.y - mouse.y;
              const dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (mR && dist < EXPLODE_R && dist > 0) {
                this.speedX += (ddx / dist) * 2;
                this.speedY += (ddy / dist) * 2;
              }
              if (mM && dist < EXPLODE_R) {
                const f = dist / EXPLODE_R;
                this.speedX *= f;
                this.speedY *= f;
              }
            }

            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size >= 1) this.size -= 0.2;
          }

          draw() {
            if (this.size <= 0) return;
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
          var _prevComp = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0,0,0,0.01)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = _prevComp;
          handleParticles();
          hue++;
          requestAnimationFrame(animate);
        }

        animate();
      }
    }
  ];

  // ── TESTING MODE ──────────────────────────────────────────────────────────
  // To re-enable the randomiser: delete everything between the dashed comments
  // and replace with:
  //
  //   function pickRandomPen() {
  //     return pens[Math.floor(Math.random() * pens.length)];
  //   }
  //
  //   async function run() {
  //     const stage = document.querySelector("#intro-stage, .intro-stage");
  //     if (stage) {
  //       const pen = pickRandomPen();
  //       if (pen) {
  //         console.log("%c Running Pen: " + pen.welcomeName + " – " + pen.name, "background: #222; color: #bada55; font-size: 20px; padding: 10px; border-radius: 5px;");
  //         (async () => {
  //           for (const dep of pen.deps) {
  //             try { await loadScript(dep); } catch (e) { console.error("Failed to load", dep, e); }
  //           }
  //           try { pen.mount(stage); } catch (e) { console.error("Pen error:", e); }
  //         })();
  //       }
  //     }
  //   }
  //
  //   if (document.readyState === "loading") {
  //     document.addEventListener("DOMContentLoaded", run);
  //   } else {
  //     run();
  //   }
  // ──────────────────────────────────────────────────────────────────────────

  var currentPenIndex = 0;

  function mountPen(index) {
    const stage = document.querySelector("#intro-stage, .intro-stage");
    if (!stage) return;
    // Remove all children except the test UI overlay
    Array.from(stage.children).forEach(function (child) {
      if (child.id !== "iprocess-test-ui") stage.removeChild(child);
    });
    const pen = pens[index];
    console.log("%c Running Pen: " + pen.welcomeName + " – " + pen.name, "background: #222; color: #bada55; font-size: 20px; padding: 10px; border-radius: 5px;");
    document.getElementById("iprocess-pen-label").textContent = pen.welcomeName + " \u2013 " + pen.name;
    (async () => {
      for (const dep of pen.deps) {
        try { await loadScript(dep); } catch (e) { console.error("Failed to load", dep, e); }
      }
      try { pen.mount(stage); } catch (e) { console.error("Pen error:", e); }
    })();
  }

  function createTestUI(stage) {
    const ui = document.createElement("div");
    ui.id = "iprocess-test-ui";
    // position:absolute inside the stage so it shares the same stacking context as the canvases
    ui.style.cssText = "position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;align-items:center;gap:12px;background:rgba(0,0,0,0.75);border:2px solid #ffffff;padding:10px 18px;border-radius:999px;font-family:sans-serif;font-size:14px;color:#ffffff;user-select:none;box-shadow:0 4px 16px rgba(0,0,0,0.6);pointer-events:auto;";

    const label = document.createElement("span");
    label.id = "iprocess-pen-label";
    label.style.cssText = "min-width:220px;text-align:center;color:#ffffff;font-weight:700;letter-spacing:0.02em;";

    const btnStyle = "background:rgba(255,255,255,0.2);border:2px solid #ffffff;color:#ffffff;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;font-weight:bold;";

    const btnPrev = document.createElement("button");
    btnPrev.textContent = "\u276E";
    btnPrev.style.cssText = btnStyle;

    const btnNext = document.createElement("button");
    btnNext.textContent = "\u276F";
    btnNext.style.cssText = btnStyle;

    btnPrev.addEventListener("click", function () {
      currentPenIndex = (currentPenIndex - 1 + pens.length) % pens.length;
      mountPen(currentPenIndex);
    });

    btnNext.addEventListener("click", function () {
      currentPenIndex = (currentPenIndex + 1) % pens.length;
      mountPen(currentPenIndex);
    });

    ui.appendChild(btnPrev);
    ui.appendChild(label);
    ui.appendChild(btnNext);
    stage.appendChild(ui);
  }

  function run() {
    const stage = document.querySelector("#intro-stage, .intro-stage");
    if (!stage) return;
    // Ensure stage has a positioning context so absolute children work correctly
    if (getComputedStyle(stage).position === "static") stage.style.position = "relative";
    createTestUI(stage);
    mountPen(currentPenIndex);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();

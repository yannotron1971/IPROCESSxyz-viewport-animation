/**
 * IProcess Intro Animation
 * 3-second intro with scrambled text reveal and slide up
 */
(function () {
    'use strict';

    // Helper to load GSAP if missing
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (window.gsap) return resolve(); // Already loaded
            const s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    // ============ CONFIGURATION ============
    // Single parameter to control total intro duration
    const INTRO_DURATION = 20; // Total seconds for intro (adjust this one value)

    const CONFIG = {
        logoText: 'IPROCESSxyz',
        goldStartIndex: 8,
        scrambleChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ"@$%^&*',
        scrambleCharsLower: 'abcdefghijklmnopqrstvwxyz',
        charRevealStagger: 0.025,
        scrambleSpeed: 50,
        resolveDelay: 160,
        // Derived from INTRO_DURATION proportionally
        particlesOnlyDuration: INTRO_DURATION * 0.6 * 1000,  // 60% of total time
        loaderDuration: INTRO_DURATION * 0.95,               // 95% of total time
        holdDuration: INTRO_DURATION * 0.1,                  // 10% of total time
        safetyTimeout: INTRO_DURATION * 1.3 * 1000,          // 130% of total time
        oncePerSession: false
    };

    // ============ SESSION CHECK ============
    const SESSION_KEY = 'iprocess_intro_shown';

    if (CONFIG.oncePerSession && sessionStorage.getItem(SESSION_KEY)) {
        document.documentElement.classList.remove('is-intro-loading');
        const overlay = document.querySelector('.intro-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.style.visibility = 'hidden';
        }
        return;
    }

    if (CONFIG.oncePerSession) {
        sessionStorage.setItem(SESSION_KEY, 'true');
    }

    // ============ DOM ELEMENTS ============
    const overlay = document.querySelector('.intro-overlay');
    const logo = document.querySelector('.intro-logo');
    const loader = document.querySelector('.intro-loader');
    const loaderBar = document.querySelector('.intro-loader-bar');

    if (!overlay || !logo) {
        console.warn('[Intro] Required elements not found');
        return;
    }

    // ============ SKIP BUTTON ============
    let skipped = false;

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip';
    skipBtn.style.cssText = [
        'position:absolute',
        'bottom:24px',
        'right:24px',
        'z-index:10000',
        'background:none',
        'border:1px solid rgba(255,255,255,0.3)',
        'border-radius:999px',
        'color:rgba(255,255,255,0.6)',
        'font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif',
        'font-size:13px',
        'font-weight:500',
        'letter-spacing:0.05em',
        'padding:6px 18px',
        'cursor:pointer',
        'transition:border-color 0.2s,color 0.2s',
        'pointer-events:auto'
    ].join(';');
    skipBtn.addEventListener('mouseenter', () => {
        skipBtn.style.borderColor = 'rgba(208,168,92,0.8)';
        skipBtn.style.color = '#d0a85c';
    });
    skipBtn.addEventListener('mouseleave', () => {
        skipBtn.style.borderColor = 'rgba(255,255,255,0.3)';
        skipBtn.style.color = 'rgba(255,255,255,0.6)';
    });
    skipBtn.addEventListener('click', () => {
        if (skipped) return;
        skipped = true;
        skipBtn.remove();
        slideOutOverlay();
    });
    overlay.appendChild(skipBtn);

    // ============ INITIALIZE ============
    document.documentElement.classList.add('is-intro-loading');

    logo.innerHTML = CONFIG.logoText.split('').map((char, index) => {
        const isGold = index >= CONFIG.goldStartIndex;
        const scrambleSet = isGold ? CONFIG.scrambleCharsLower : CONFIG.scrambleChars;
        const randomChar = scrambleSet[Math.floor(Math.random() * scrambleSet.length)];
        const goldClass = isGold ? ' is-gold' : '';
        return `<span class="char${goldClass}" data-target="${char}">${randomChar}</span>`;
    }).join('');

    logo.classList.add('is-ready');
    const chars = logo.querySelectorAll('.char');

    // ============ ANIMATION FUNCTIONS ============
    function scrambleText(charElements) {
        return new Promise(resolve => {
            let currentIndex = 0;

            const scrambleIntervals = Array.from(charElements).map((el, index) => {
                const isGold = el.classList.contains('is-gold');
                const scrambleSet = isGold ? CONFIG.scrambleCharsLower : CONFIG.scrambleChars;

                return setInterval(() => {
                    el.textContent = scrambleSet[Math.floor(Math.random() * scrambleSet.length)];
                }, CONFIG.scrambleSpeed);
            });

            const resolveNext = () => {
                if (currentIndex >= charElements.length) {
                    resolve();
                    return;
                }

                const el = charElements[currentIndex];
                clearInterval(scrambleIntervals[currentIndex]);
                el.textContent = el.dataset.target;
                currentIndex++;

                setTimeout(resolveNext, CONFIG.resolveDelay);
            };

            setTimeout(resolveNext, 400);
        });
    }

    function slideOutOverlay() {
        gsap.to(overlay, {
            yPercent: -100,
            duration: 0.7,
            ease: 'power3.inOut',
            onComplete: () => {
                overlay.style.display = 'none';
                overlay.style.visibility = 'hidden';
                document.documentElement.classList.remove('is-intro-loading');
                window.dispatchEvent(new CustomEvent('introComplete'));
            }
        });
    }

    // ============ MAIN ANIMATION TIMELINE ============
    async function runAnimation() {
        gsap.set(chars, { opacity: 0, y: 12 });
        gsap.set(loader, { opacity: 0 });
        gsap.set(loaderBar, { width: '0%' });

        const tl = gsap.timeline();

        tl.to(loader, {
            opacity: 1,
            duration: 0.25,
            ease: 'power2.out'
        });

        tl.to(loaderBar, {
            width: '100%',
            duration: CONFIG.loaderDuration,
            ease: 'power1.inOut'
        }, 0.2);

        await new Promise(resolve => setTimeout(resolve, CONFIG.particlesOnlyDuration));

        const stageEl = document.querySelector('#intro-stage, .intro-stage');
        if (stageEl) {
            const maskObj = { inner: 0, outer: 0 };
            gsap.to(maskObj, {
                inner: 10,
                outer: 25,
                duration: 0.5,
                ease: "power2.out",
                onUpdate: () => {
                    const gradient = `radial-gradient(circle at center, transparent 0%, transparent ${maskObj.inner}%, rgba(0,0,0,1) ${maskObj.outer}%)`;
                    stageEl.style.setProperty('-webkit-mask-image', gradient);
                    stageEl.style.setProperty('mask-image', gradient);
                }
            });
        }

        gsap.to(chars, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: CONFIG.charRevealStagger,
            ease: 'power3.out'
        });

        await new Promise(resolve => setTimeout(resolve, 350));
        await scrambleText(chars);

        await new Promise(resolve => setTimeout(resolve, CONFIG.holdDuration * 1000));

        slideOutOverlay();
    }

    // ============ EXECUTE ============
    async function init() {
        try {
            await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js");
            runAnimation();
        } catch (e) {
            console.error("[Intro] Failed to load GSAP", e);
            slideOutOverlay();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init());
    } else {
        init();
    }

    setTimeout(() => {
        if (overlay && getComputedStyle(overlay).display !== 'none') {
            console.warn('[Intro] Safety timeout triggered');
            slideOutOverlay();
        }
    }, CONFIG.safetyTimeout);

})();

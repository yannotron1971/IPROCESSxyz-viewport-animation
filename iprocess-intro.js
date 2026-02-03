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
    const CONFIG = {
        logoText: 'IPROCESSxyz',
        goldStartIndex: 8,            // Index where 'xyz' starts (0-based)
        scrambleChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        scrambleCharsLower: 'abcdefghijklmnopqrstuvwxyz0123456789',
        charRevealStagger: 0.025,     // Delay between each char appearing
        scrambleSpeed: 50,            // Ms between scramble iterations
        resolveDelay: 100,            // Ms between each letter resolving (left to right)
        holdDuration: 0.8,            // Seconds to hold after scramble
        safetyTimeout: 4000,          // Max time before forced removal (ms)
        oncePerSession: true          // Only show intro once per browser session
    };

    // ============ SESSION CHECK ============
    const SESSION_KEY = 'iprocess_intro_shown';

    // Check if intro was already shown this session
    if (CONFIG.oncePerSession && sessionStorage.getItem(SESSION_KEY)) {
        // Skip intro - just remove loading state
        document.documentElement.classList.remove('is-intro-loading');
        const overlay = document.querySelector('.intro-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.style.visibility = 'hidden';
        }
        return;
    }

    // Mark intro as shown for this session
    if (CONFIG.oncePerSession) {
        sessionStorage.setItem(SESSION_KEY, 'true');
    }

    // ============ DOM ELEMENTS ============
    const overlay = document.querySelector('.intro-overlay');
    const logo = document.querySelector('.intro-logo');
    const loader = document.querySelector('.intro-loader');
    const loaderBar = document.querySelector('.intro-loader-bar');

    // Exit if elements don't exist
    if (!overlay || !logo) {
        console.warn('[Intro] Required elements not found');
        return;
    }

    // ============ INITIALIZE ============

    // Lock page scroll
    document.documentElement.classList.add('is-intro-loading');

    // Split logo text into character spans - START WITH SCRAMBLED CHARACTERS
    logo.innerHTML = CONFIG.logoText.split('').map((char, index) => {
        const isGold = index >= CONFIG.goldStartIndex;
        const scrambleSet = isGold ? CONFIG.scrambleCharsLower : CONFIG.scrambleChars;
        const randomChar = scrambleSet[Math.floor(Math.random() * scrambleSet.length)];
        const goldClass = isGold ? ' is-gold' : '';
        return `<span class="char${goldClass}" data-target="${char}">${randomChar}</span>`;
    }).join('');

    // Mark logo as ready (makes it visible)
    logo.classList.add('is-ready');

    const chars = logo.querySelectorAll('.char');

    // Initial GSAP states are now set inside runAnimation() to ensure library is loaded

    // ============ ANIMATION FUNCTIONS ============

    /**
     * Scramble text effect - resolves characters one by one from left to right
     */
    function scrambleText(charElements) {
        return new Promise(resolve => {
            let currentIndex = 0;

            // Keep all characters scrambling
            const scrambleIntervals = Array.from(charElements).map((el, index) => {
                const isGold = el.classList.contains('is-gold');
                const scrambleSet = isGold ? CONFIG.scrambleCharsLower : CONFIG.scrambleChars;

                return setInterval(() => {
                    el.textContent = scrambleSet[Math.floor(Math.random() * scrambleSet.length)];
                }, CONFIG.scrambleSpeed);
            });

            // Resolve one character at a time, left to right
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

            // Start resolving after a brief scramble period
            setTimeout(resolveNext, 400);
        });
    }

    /**
     * Slide up and remove overlay
     */
    function slideOutOverlay() {
        gsap.to(overlay, {
            yPercent: -100,
            duration: 0.7,
            ease: 'power3.inOut',
            onComplete: () => {
                overlay.style.display = 'none';
                overlay.style.visibility = 'hidden';
                document.documentElement.classList.remove('is-intro-loading');

                // Dispatch custom event for any listeners
                window.dispatchEvent(new CustomEvent('introComplete'));
            }
        });
    }

    // ============ MAIN ANIMATION TIMELINE ============

    async function runAnimation() {
        // Set initial states (moved here to ensure GSAP is loaded)
        gsap.set(chars, { opacity: 0, y: 12 });
        gsap.set(loader, { opacity: 0 });
        gsap.set(loaderBar, { width: '0%' });

        const tl = gsap.timeline();

        // 1. Fade in loader track
        tl.to(loader, {
            opacity: 1,
            duration: 0.25,
            ease: 'power2.out'
        });

        // 2. Reveal characters with stagger
        tl.to(chars, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: CONFIG.charRevealStagger,
            ease: 'power3.out'
        }, 0.1);

        // 3. Start loader bar animation (runs alongside scramble)
        tl.to(loaderBar, {
            width: '100%',
            duration: 2.0,
            ease: 'power1.inOut'
        }, 0.2);

        // 4. Wait for initial reveal, then scramble
        await new Promise(resolve => setTimeout(resolve, 350));
        await scrambleText(chars);

        // 5. Hold for a moment
        await new Promise(resolve =>
            setTimeout(resolve, CONFIG.holdDuration * 1000)
        );

        // 6. Slide up overlay
        slideOutOverlay();
    }

    // ============ EXECUTE ============

    // Run animation when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init());
    } else {
        init();
    }

    async function init() {
        // Ensure GSAP is loaded
        try {
            await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js");
            runAnimation();
        } catch (e) {
            console.error("[Intro] Failed to load GSAP", e);
            // Fallback: remove overlay if GSAP fails
            slideOutOverlay();
        }
    }

    // Safety fallback - ensure overlay is removed even if something fails
    setTimeout(() => {
        if (overlay && getComputedStyle(overlay).display !== 'none') {
            console.warn('[Intro] Safety timeout triggered');
            slideOutOverlay();
        }
    }, CONFIG.safetyTimeout);

})();

// ===== SHARED CONSTANTS =====
const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ===== PERFORMANCE MANAGER =====
(function() {
  'use strict';

  const LOW_END_DEVICE_REGEX = /Android [1-4]\.[0-4]|iPhone OS [1-8]_|Windows Phone [1-7]|BlackBerry [1-7]/i;

  const PerformanceManager = {
    isLowEndDevice: false,
    requestCount: 0,
    lastRequestTime: 0,

    detectDevice() {
      const memory = navigator.deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 2;
      const connection = navigator.connection;

      this.isLowEndDevice = (
        memory < 2 ||
        cores < 2 ||
        LOW_END_DEVICE_REGEX.test(navigator.userAgent) ||
        (connection?.effectiveType?.includes('2g'))
      );

      if (this.isLowEndDevice) {
        this.enableLowEndMode();
      }
    },

    rateLimit() {
      const now = Date.now();
      if (now - this.lastRequestTime < 100) {
        this.requestCount++;
        if (this.requestCount > 50) {
          console.warn('Rate limit exceeded');
          return false;
        }
      } else {
        this.requestCount = 0;
      }
      this.lastRequestTime = now;
      return true;
    },

    enableLowEndMode() {
      document.documentElement.classList.add('low-end-device');

      const style = document.createElement('style');
      document.head.appendChild(style);

      const rules = [
        '.low-end-device * { animation: none !important; transition: none !important; transform: none !important; filter: none !important; backdrop-filter: none !important; box-shadow: none !important; text-shadow: none !important; }',
        '.low-end-device .loading-screen { display: none !important; }',
        '.low-end-device .interface-overlay { display: none !important; }',
        '.low-end-device .corner-brackets { display: none !important; }'
      ];

      for (const rule of rules) {
        try {
          style.sheet.insertRule(rule, style.sheet.cssRules.length);
        } catch (e) {
          console.warn('Failed to insert CSS rule:', e);
        }
      }

      setTimeout(() => {
        const loadingScreen = document.querySelector('.loading-screen');
        const mainContent = document.querySelector('.content');
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (mainContent) {
          mainContent.classList.remove('hidden');
          mainContent.style.opacity = '1';
        }
      }, 100);
    },

    handleError(error) {
      console.error('Performance error:', error?.name || 'Unknown', error?.message || 'No message');
      if (error?.name === 'QuotaExceededError') {
        localStorage.clear();
      }
    },

    throttle(func, limit) {
      let inThrottle;
      return (...args) => {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PerformanceManager.detectDevice());
  } else {
    PerformanceManager.detectDevice();
  }

  window.addEventListener('error', (e) => PerformanceManager.handleError(e.error));
  window.addEventListener('unhandledrejection', (e) => PerformanceManager.handleError(e.reason));

  window.PerformanceManager = PerformanceManager;
})();

// ===== BOT DETECTOR =====
(function() {
  'use strict';

  // CONFIGURATION: Set to true to enable bot detection and access denied screen
  const ENABLE_BOT_DETECTION = false;

  const BotDetector = {
    score: 0,
    interactions: 0,
    startTime: Date.now(),
    mouseMovements: 0,
    keystrokes: 0,
    scrolls: 0,
    isBot: false,

    init() {
      this.addEventListeners();
      this.createHiddenElements();
      this.startBehaviorAnalysis();
    },

    addEventListeners() {
      const throttle = window.PerformanceManager.throttle;

      document.addEventListener('mousemove', throttle(() => {
        this.mouseMovements++;
        this.score += 1;
      }, 100));

      document.addEventListener('touchstart', throttle(() => {
        this.mouseMovements++;
        this.score += 1;
      }, 100));

      document.addEventListener('touchmove', throttle(() => {
        this.mouseMovements++;
        this.score += 1;
      }, 100));

      document.addEventListener('keydown', () => {
        this.keystrokes++;
        this.score += 2;
      });

      document.addEventListener('scroll', throttle(() => {
        this.scrolls++;
        this.score += 1;
      }, 200));

      document.addEventListener('click', () => {
        this.interactions++;
        this.score += 3;
        if (this.interactions > 10 && (Date.now() - this.startTime) < 2000) {
          this.score -= 10;
        }
      });

      window.addEventListener('focus', () => { this.score += 2; });
      window.addEventListener('blur', () => { this.score += 1; });
    },

    createHiddenElements() {
      if (IS_MOBILE) return;

      const honeypot = document.createElement('input');
      honeypot.type = 'text';
      honeypot.name = 'website';
      honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;pointer-events:none;';
      honeypot.tabIndex = -1;
      honeypot.addEventListener('input', () => {
        this.isBot = true;
        this.blockAccess();
      });
      document.body.appendChild(honeypot);

      const trapLink = document.createElement('a');
      trapLink.href = '#';
      trapLink.style.cssText = 'position:absolute;left:-9999px;opacity:0;';
      trapLink.textContent = 'Hidden Link';
      trapLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.isBot = true;
        this.blockAccess();
      });
      document.body.appendChild(trapLink);
    },

    startBehaviorAnalysis() {
      setTimeout(() => {
        if (!IS_MOBILE && this.score < 5 && this.mouseMovements === 0) {
          this.isBot = true;
        }
      }, 3000);

      setInterval(() => this.analyzeBehavior(), 5000);

      setTimeout(() => this.finalVerification(), 10000);
    },

    analyzeBehavior() {
      const timeSpent = Date.now() - this.startTime;
      const behaviorScore = this.calculateBehaviorScore(timeSpent);

      if (!IS_MOBILE && behaviorScore < 10 && timeSpent > 5000) {
        this.isBot = true;
      }

      if (!IS_MOBILE && this.mouseMovements > 0 && this.mouseMovements % 10 === 0 && timeSpent < 3000) {
        this.isBot = true;
      }

      if (!IS_MOBILE && this.interactions > 5 && this.mouseMovements === 0) {
        this.isBot = true;
      }

      if (this.isBot) {
        this.blockAccess();
      }
    },

    calculateBehaviorScore(timeSpent) {
      let score = this.score;

      if (timeSpent > 10000) score += 5;
      if (timeSpent > 30000) score += 10;

      if (IS_MOBILE) {
        if (this.mouseMovements > 0 || this.scrolls > 0) score += 15;
        if (this.interactions > 0) score += 10;
      } else {
        if (this.mouseMovements > 0 && this.keystrokes > 0 && this.scrolls > 0) score += 15;
        if (this.mouseMovements > 10 && this.interactions > 2) score += 10;
      }

      return score;
    },

    finalVerification() {
      const timeSpent = Date.now() - this.startTime;
      const finalScore = this.calculateBehaviorScore(timeSpent);
      const threshold = IS_MOBILE ? 10 : 20;

      if (finalScore < threshold || this.isBot) {
        this.showCaptchaChallenge();
      } else {
        this.markAsHuman();
      }
    },

    showCaptchaChallenge() {
      if (IS_MOBILE) {
        this.markAsHuman();
        return;
      }

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Share Tech Mono,monospace;color:#29b6f6';

      const challenge = document.createElement('div');
      challenge.style.cssText = 'background:#1a1a1a;padding:2rem;border-radius:8px;border:1px solid #29b6f6;text-align:center;max-width:400px';

      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const correctAnswer = a + b;

      challenge.innerHTML = `
        <h3>Security Verification</h3>
        <p>Please solve: ${a} + ${b} = ?</p>
        <input type="number" id="captcha-answer" style="background:#333;border:1px solid #29b6f6;color:#fff;padding:0.5rem;margin:1rem;border-radius:4px">
        <br>
        <button id="captcha-submit" style="background:#29b6f6;color:#fff;border:none;padding:0.5rem 1rem;border-radius:4px;cursor:pointer">Verify</button>
      `;

      overlay.appendChild(challenge);
      document.body.appendChild(overlay);

      document.getElementById('captcha-submit').addEventListener('click', () => {
        const userAnswer = parseInt(document.getElementById('captcha-answer').value, 10);
        if (userAnswer === correctAnswer) {
          this.markAsHuman();
          overlay.remove();
        } else {
          this.blockAccess();
        }
      });
    },

    blockAccess() {
      if (IS_MOBILE) {
        this.markAsHuman();
        return;
      }
      document.body.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0a0e14;color:#ff4757;font-family:Share Tech Mono,monospace;text-align:center;padding:2rem';
      document.body.textContent = '';
      const h1 = document.createElement('h1');
      h1.textContent = '[ACCESS DENIED]';
      const p1 = document.createElement('p');
      p1.textContent = 'Unauthorized entity detected.';
      const p2 = document.createElement('p');
      p2.textContent = 'Classification: Legion.';
      document.body.append(h1, p1, p2);
    },

    markAsHuman() {
      try {
        sessionStorage.setItem('humanVerified', 'true');
      } catch (e) {
        // sessionStorage unavailable
      }
    }
  };

  if (!ENABLE_BOT_DETECTION) {
    sessionStorage.setItem('humanVerified', 'true');
    window.BotDetector = BotDetector;
    return;
  }

  if (IS_MOBILE) {
    sessionStorage.setItem('humanVerified', 'true');
  } else if (sessionStorage.getItem('humanVerified') !== 'true') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => BotDetector.init());
    } else {
      BotDetector.init();
    }
  }

  window.BotDetector = BotDetector;
})();

// ===== USER COUNTER (localStorage only) =====
(function() {
  'use strict';

  const UserCounter = {
    myId: Math.random().toString(36).substr(2, 9),
    intervalId: null,

    init() {
      this.createCounterDisplay();
      this.startTracking();
    },

    createCounterDisplay() {
      const counter = document.createElement('div');
      counter.id = 'user-counter';
      counter.style.cssText = 'position:fixed;top:80px;right:20px;background:rgba(10,14,20,0.9);border:1px solid var(--primary-color);padding:0.5rem 1rem;border-radius:4px;font-family:Share Tech Mono,monospace;font-size:0.8rem;color:var(--primary-color);z-index:1000;backdrop-filter:blur(10px);display:none';
      counter.innerHTML = '<span class="counter-label">USERS ONLINE:</span> <span class="counter-value">1</span>';
      document.body.appendChild(counter);
    },

    startTracking() {
      this.updatePresence();
      this.intervalId = setInterval(() => this.updatePresence(), 5000);
    },

    updatePresence() {
      try {
        const users = JSON.parse(localStorage.getItem('p86-users') || '{}');
        const now = Date.now();

        // Clean up stale entries
        for (const id of Object.keys(users)) {
          if (now - users[id] > 30000) delete users[id];
        }

        users[this.myId] = now;
        localStorage.setItem('p86-users', JSON.stringify(users));

        const counterValue = document.querySelector('.counter-value');
        if (counterValue) {
          counterValue.textContent = Object.keys(users).length;
        }
      } catch (e) {
        // localStorage unavailable
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UserCounter.init());
  } else {
    UserCounter.init();
  }
})();

// ===== MAIN APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
  if (IS_MOBILE) {
    document.body.style.background = '#0a0e14';
    document.body.style.color = '#e0e0e0';
  }

  const preventScroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  window.addEventListener('wheel', preventScroll, { passive: false });
  window.addEventListener('touchmove', preventScroll, { passive: false });
  window.addEventListener('scroll', preventScroll, { passive: false });

  if (!window.PerformanceManager?.rateLimit()) return;

  if (window.PerformanceManager?.isLowEndDevice && !IS_MOBILE) {
    window.removeEventListener('wheel', preventScroll);
    window.removeEventListener('touchmove', preventScroll);
    window.removeEventListener('scroll', preventScroll);

    window.scrollTo(0, 0);
    document.documentElement.classList.remove('loading');
    document.body.classList.remove('loading');
    const mainContent = document.querySelector('.content');
    if (mainContent) {
      mainContent.classList.remove('hidden');
      mainContent.style.opacity = '1';
    }
    return;
  }

  const loadingScreen = document.querySelector('.loading-screen');
  const progressFill = document.querySelector('.progress-fill');
  const progressPercentage = document.querySelector('.progress-percentage');
  const mainContent = document.querySelector('.content');
  const loadingMessage = document.querySelector('.loading-message');

  if (!loadingScreen || !progressFill || !progressPercentage || !mainContent || !loadingMessage) {
    console.warn('Required loading elements not found');
    return;
  }

  const messages = [
    "Activating neural interface...",
    "Synchronizing para-RAID system...",
    "Establishing tactical data link...",
    "Loading battlefield analysis...",
    "Calibrating resonance frequency...",
    "Initializing Juggernaut protocols...",
    "Scanning for Legion activity...",
    "Connecting to handler network...",
    "Computing tactical projections...",
    "All systems online. Welcome, Processor."
  ];

  let progress = 0;
  const totalSteps = messages.length;
  const animationDuration = 4000;
  const stepTime = animationDuration / totalSteps;

  const updateProgress = () => {
    progress += 100 / totalSteps;
    progressFill.style.width = `${progress}%`;
    progressPercentage.textContent = `${Math.round(progress)}%`;
  };

  const showMessage = (index) => {
    if (index >= messages.length) return;

    loadingMessage.textContent = messages[index];
    loadingMessage.classList.add('visible');
    updateProgress();

    if (index < messages.length - 1) {
      setTimeout(() => {
        loadingMessage.classList.remove('visible');
        setTimeout(() => showMessage(index + 1), 100);
      }, Math.max(0, stepTime - 200));
    } else {
      setTimeout(completeLoading, stepTime);
    }
  };

  const completeLoading = () => {
    window.removeEventListener('wheel', preventScroll);
    window.removeEventListener('touchmove', preventScroll);
    window.removeEventListener('scroll', preventScroll);

    window.scrollTo(0, 0);
    document.documentElement.classList.remove('loading');
    document.body.classList.remove('loading');

    loadingScreen.style.opacity = '0';
    loadingScreen.addEventListener('transitionend', () => {
      loadingScreen.style.display = 'none';
    }, { once: true });

    mainContent.classList.remove('hidden');
    mainContent.style.opacity = '1';

    // Intersection Observer for card reveal animations
    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px', threshold: 0.2 }
    );

    document.querySelectorAll('.info-card').forEach(card => observer.observe(card));
  };

  setTimeout(() => showMessage(0), 500);

  // === Navigation ===
  const hamburger = document.querySelector('.hamburger');
  const navList = document.querySelector('.nav-list');
  const navLinks = document.querySelectorAll('.nav-link');
  const navBar = document.querySelector('.nav-bar');

  if (!hamburger || !navList) return;

  const toggleMenu = window.PerformanceManager?.throttle(() => {
    if (!window.PerformanceManager?.rateLimit()) return;
    hamburger.classList.toggle('active');
    navList.classList.toggle('active');
  }, 300) || (() => {
    hamburger.classList.toggle('active');
    navList.classList.toggle('active');
  });

  hamburger.addEventListener('click', toggleMenu);

  for (const link of navLinks) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      hamburger.classList.remove('active');
      navList.classList.remove('active');

      const targetId = link.getAttribute('href').slice(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection && navBar) {
        const navHeight = navBar.offsetHeight;
        window.scrollTo({
          top: targetSection.offsetTop - navHeight - 20,
          behavior: 'smooth'
        });
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navList.contains(e.target)) {
      hamburger.classList.remove('active');
      navList.classList.remove('active');
    }
  });

  // === Active nav link tracking ===
  const sections = document.querySelectorAll('section[id]');

  const updateActiveNavLink = () => {
    const scrollPosition = window.scrollY + 100;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const isAtBottom = scrollPosition + windowHeight >= documentHeight - 10;

    for (const link of document.querySelectorAll('.nav-link.active')) {
      link.classList.remove('active');
    }

    let activeSection = null;

    if (isAtBottom) {
      activeSection = sections[sections.length - 1];
    } else {
      for (const section of sections) {
        const sectionTop = section.offsetTop;
        if (scrollPosition >= sectionTop - 50 && scrollPosition < sectionTop + section.offsetHeight) {
          activeSection = section;
        }
      }
    }

    if (activeSection) {
      const sectionId = activeSection.getAttribute('id');
      if (sectionId) {
        const activeLink = document.querySelector(`.nav-link[href="#${CSS.escape(sectionId)}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    }
  };

  let ticking = false;
  const scrollHandler = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveNavLink();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll',
    window.PerformanceManager?.throttle(scrollHandler, 16) || scrollHandler,
    { passive: true }
  );
});

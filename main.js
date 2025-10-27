// ===== PERFORMANCE MANAGER =====
(function() {
  'use strict';
  
  const PerformanceManager = {
    isLowEndDevice: false,
    requestCount: 0,
    lastRequestTime: 0,
    
    detectDevice() {
      const ua = navigator.userAgent;
      const memory = navigator.deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 2;
      const connection = navigator.connection;
      
      this.isLowEndDevice = (
        memory < 2 ||
        cores < 2 ||
        /Android [1-4]|iPhone OS [1-9]|Windows Phone|BlackBerry/i.test(ua) ||
        (connection && connection.effectiveType && connection.effectiveType.includes('2g'))
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
      const rules = [
        '.low-end-device * { animation: none !important; transition: none !important; transform: none !important; filter: none !important; backdrop-filter: none !important; box-shadow: none !important; text-shadow: none !important; }',
        '.low-end-device .loading-screen { display: none !important; }',
        '.low-end-device .interface-overlay { display: none !important; }',
        '.low-end-device .corner-brackets { display: none !important; }'
      ];
      document.head.appendChild(style);
      rules.forEach(rule => style.sheet.insertRule(rule, style.sheet.cssRules.length));
      
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
    
    cleanup() {
      if (window.gc) window.gc();
      
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        if (el._listeners) {
          el._listeners = null;
        }
      });
    },
    
    handleError(error) {
      console.error('Performance error:', error?.name || 'Unknown', error?.message || 'No message');
      if (error.name === 'QuotaExceededError') {
        localStorage.clear();
      }
    },
    
    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      }
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
    document.addEventListener('DOMContentLoaded', () => {
      PerformanceManager.detectDevice();
    });
  } else {
    PerformanceManager.detectDevice();
  }
  
  window.addEventListener('error', (e) => {
    PerformanceManager.handleError(e.error);
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    PerformanceManager.handleError(e.reason);
  });
  
  window.addEventListener('beforeunload', () => {
    PerformanceManager.cleanup();
  });
  
  window.PerformanceManager = PerformanceManager;
})();

// ===== BOT DETECTOR =====
(function() {
  'use strict';
  
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
      try {
        document.addEventListener('mousemove', this.throttle(() => {
          this.mouseMovements++;
          this.score += 1;
        }, 100));
        
        document.addEventListener('keydown', () => {
          this.keystrokes++;
          this.score += 2;
        });
        
        document.addEventListener('scroll', this.throttle(() => {
          this.scrolls++;
          this.score += 1;
        }, 200));
        
        document.addEventListener('click', (e) => {
          this.interactions++;
          this.score += 3;
          
          if (this.interactions > 10 && (Date.now() - this.startTime) < 2000) {
            this.score -= 10;
          }
        });
        
        window.addEventListener('focus', () => this.score += 2);
        window.addEventListener('blur', () => this.score += 1);
      } catch (error) {
        console.warn('Error adding event listeners:', error);
      }
    },
    
    createHiddenElements() {
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
        if (this.score < 5 && this.mouseMovements === 0) {
          this.isBot = true;
        }
      }, 3000);
      
      setInterval(() => {
        this.analyzeBehavior();
      }, 5000);
      
      setTimeout(() => {
        this.finalVerification();
      }, 10000);
    },
    
    analyzeBehavior() {
      const timeSpent = Date.now() - this.startTime;
      const behaviorScore = this.calculateBehaviorScore(timeSpent);
      
      if (behaviorScore < 10 && timeSpent > 5000) {
        this.isBot = true;
      }
      
      if (this.mouseMovements > 0 && this.mouseMovements % 10 === 0 && timeSpent < 3000) {
        this.isBot = true;
      }
      
      if (this.interactions > 5 && this.mouseMovements === 0) {
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
      
      if (this.mouseMovements > 0 && this.keystrokes > 0 && this.scrolls > 0) {
        score += 15;
      }
      
      if (this.mouseMovements > 10 && this.interactions > 2) {
        score += 10;
      }
      
      return score;
    },
    
    finalVerification() {
      const timeSpent = Date.now() - this.startTime;
      const finalScore = this.calculateBehaviorScore(timeSpent);
      
      if (finalScore < 20 || this.isBot) {
        this.showCaptchaChallenge();
      } else {
        this.markAsHuman();
      }
    },
    
    showCaptchaChallenge() {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Share Tech Mono,monospace;color:#29b6f6';
      
      const challenge = document.createElement('div');
      challenge.style.cssText = 'background:#1a1a1a;padding:2rem;border-radius:8px;border:1px solid #29b6f6;text-align:center;max-width:400px';
      
      const question = Math.floor(Math.random() * 10) + 1;
      const answer = Math.floor(Math.random() * 10) + 1;
      const correctAnswer = question + answer;
      
      challenge.innerHTML = `
        <h3>Security Verification</h3>
        <p>Please solve: ${question} + ${answer} = ?</p>
        <input type="number" id="captcha-answer" style="background:#333;border:1px solid #29b6f6;color:#fff;padding:0.5rem;margin:1rem;border-radius:4px">
        <br>
        <button id="captcha-submit" style="background:#29b6f6;color:#fff;border:none;padding:0.5rem 1rem;border-radius:4px;cursor:pointer">Verify</button>
      `;
      
      overlay.appendChild(challenge);
      document.body.appendChild(overlay);
      
      document.getElementById('captcha-submit').addEventListener('click', () => {
        const userAnswer = parseInt(document.getElementById('captcha-answer').value);
        if (userAnswer === correctAnswer) {
          this.markAsHuman();
          document.body.removeChild(overlay);
        } else {
          this.blockAccess();
        }
      });
    },
    
    blockAccess() {
      document.body.innerHTML = '';
      document.body.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0a0e14;color:#ff4757;font-family:Share Tech Mono,monospace;text-align:center;padding:2rem';
      document.body.innerHTML = '<h1>[ACCESS DENIED]</h1><p>Unauthorized entity detected.</p><p>Classification: Legion.</p>';
    },
    
    markAsHuman() {
      sessionStorage.setItem('humanVerified', 'true');
      console.log('Human verification successful');
    },
    
    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      }
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (sessionStorage.getItem('humanVerified') !== 'true') {
        BotDetector.init();
      }
    });
  } else {
    if (sessionStorage.getItem('humanVerified') !== 'true') {
      BotDetector.init();
    }
  }
  
  window.BotDetector = BotDetector;
})();

// ===== P2P COUNTER =====
(function() {
  'use strict';
  
  const P2PCounter = {
    peers: new Map(),
    myId: Math.random().toString(36).substr(2, 9),
    ws: null,
    
    init() {
      this.createCounterDisplay();
      this.connectToSignaling();
    },
    
    createCounterDisplay() {
      const counter = document.createElement('div');
      counter.id = 'user-counter';
      counter.style.cssText = 'position:fixed;top:80px;right:20px;background:rgba(10,14,20,0.9);border:1px solid var(--primary-color);padding:0.5rem 1rem;border-radius:4px;font-family:Share Tech Mono,monospace;font-size:0.8rem;color:var(--primary-color);z-index:1000;backdrop-filter:blur(10px);display:none';
      counter.innerHTML = '<span class="counter-label">USERS ONLINE:</span> <span class="counter-value">1</span>';
      document.body.appendChild(counter);
    },
    
    connectToSignaling() {
      try {
        this.ws = new WebSocket('wss://echo.websocket.org');
        this.ws.onopen = () => this.announcePresence();
        this.ws.onmessage = (event) => this.handleSignal(event.data);
        this.ws.onerror = () => this.fallbackToLocalStorage();
      } catch (e) {
        this.fallbackToLocalStorage();
      }
    },
    
    fallbackToLocalStorage() {
      const users = JSON.parse(localStorage.getItem('p86-users') || '{}');
      const now = Date.now();
      
      Object.keys(users).forEach(id => {
        if (now - users[id] > 30000) delete users[id];
      });
      
      users[this.myId] = now;
      localStorage.setItem('p86-users', JSON.stringify(users));
      
      this.updateCounter(Object.keys(users).length);
      
      setInterval(() => {
        const currentUsers = JSON.parse(localStorage.getItem('p86-users') || '{}');
        const currentTime = Date.now();
        
        Object.keys(currentUsers).forEach(id => {
          if (currentTime - currentUsers[id] > 30000) delete currentUsers[id];
        });
        
        currentUsers[this.myId] = currentTime;
        localStorage.setItem('p86-users', JSON.stringify(currentUsers));
        this.updateCounter(Object.keys(currentUsers).length);
      }, 5000);
    },
    
    announcePresence() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'join', id: this.myId }));
      }
    },
    
    handleSignal(data) {
      try {
        const message = JSON.parse(data);
        if (message.type === 'join' && message.id !== this.myId) {
          this.peers.set(message.id, Date.now());
          this.updateCounter(this.peers.size + 1);
        }
      } catch (e) {
        // Ignore invalid messages
      }
    },
    
    updateCounter(count = null) {
      const counterValue = document.querySelector('.counter-value');
      if (counterValue) {
        const totalUsers = count || (this.peers.size + 1);
        counterValue.textContent = totalUsers;
        
        counterValue.style.animation = 'none';
        setTimeout(() => {
          counterValue.style.animation = 'pulse 0.5s ease-in-out';
        }, 10);
      }
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      P2PCounter.init();
    });
  } else {
    P2PCounter.init();
  }
  
  window.P2PCounter = P2PCounter;
})();

// ===== MAIN APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
  const preventScroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  
  window.addEventListener('wheel', preventScroll, { passive: false });
  window.addEventListener('touchmove', preventScroll, { passive: false });
  window.addEventListener('scroll', preventScroll, { passive: false });
  
  document.addEventListener('copy', (e) => {
    e.clipboardData.setData('text/plain', '[NOPE]');
    e.preventDefault();
  });
  
  if (!window.PerformanceManager?.rateLimit()) return;
  
  if (window.PerformanceManager?.isLowEndDevice) {
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
    if (index < messages.length) {
      loadingMessage.textContent = messages[index];
      loadingMessage.classList.add('visible');
      
      updateProgress();
      
      if (index < messages.length - 1) {
        setTimeout(() => {
          loadingMessage.classList.remove('visible');
          setTimeout(() => {
            const nextIndex = parseInt(index, 10) + 1;
            if (Number.isInteger(nextIndex) && nextIndex >= 0 && nextIndex < messages.length) {
              showMessage(nextIndex);
            }
          }, 100);
        }, Math.max(0, stepTime - 200));
      } else {
        setTimeout(() => {
          completeLoading();
        }, stepTime);
      }
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
    });

    mainContent.classList.remove('hidden');
    mainContent.style.opacity = '1';

    const cards = document.querySelectorAll('.info-card');
    
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    cards.forEach(card => {
      observer.observe(card);
    });
  };

  setTimeout(() => {
    showMessage(0);
  }, 500);

  const hamburger = document.querySelector('.hamburger');
  const navList = document.querySelector('.nav-list');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (!hamburger || !navList) return;

  hamburger.addEventListener('click', window.PerformanceManager?.throttle(() => {
    if (!window.PerformanceManager?.rateLimit()) return;
    hamburger.classList.toggle('active');
    navList.classList.toggle('active');
  }, 300) || (() => {
    hamburger.classList.toggle('active');
    navList.classList.toggle('active');
  }));

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      hamburger.classList.remove('active');
      navList.classList.remove('active');
      
      const targetId = link.getAttribute('href').slice(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        const navHeight = document.querySelector('.nav-bar').offsetHeight;
        const targetPosition = targetSection.offsetTop - navHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navList.contains(e.target)) {
      hamburger.classList.remove('active');
      navList.classList.remove('active');
    }
  });

  const sections = document.querySelectorAll('section[id]');
  
  const updateActiveNavLink = () => {
    try {
      const scrollPosition = window.scrollY + 100;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const isAtBottom = scrollPosition + windowHeight >= documentHeight - 10;
      
      document.querySelectorAll('.nav-link.active').forEach(link => {
        link.classList.remove('active');
      });
      
      let activeSection = null;
      
      if (isAtBottom) {
        activeSection = sections[sections.length - 1];
      } else {
        sections.forEach(section => {
          if (!section) return;
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          
          if (scrollPosition >= sectionTop - 50 && scrollPosition < sectionTop + sectionHeight) {
            activeSection = section;
          }
        });
      }
      
      if (activeSection) {
        const sectionId = activeSection.getAttribute('id');
        if (sectionId) {
          const sanitizedId = CSS.escape(sectionId);
          const activeLink = document.querySelector(`.nav-link[href="#${sanitizedId}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      }
    } catch (error) {
      console.warn('Scroll update error:', error);
    }
  };

  let ticking = false;
  const throttledScroll = window.PerformanceManager?.throttle(() => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveNavLink();
        ticking = false;
      });
      ticking = true;
    }
  }, 16) || (() => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveNavLink();
        ticking = false;
      });
      ticking = true;
    }
  });
  
  window.addEventListener('scroll', throttledScroll, { passive: true });
});

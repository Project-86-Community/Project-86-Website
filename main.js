document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.querySelector('.loading-screen');
  const progressFill = document.querySelector('.progress-fill');
  const mainContent = document.querySelector('.content');
  const loadingMessage = document.querySelector('.loading-message');
  
  const messages = [
    "Connecting to the world of 86...",
    "Initializing combat systems...",
    "Preparing artillery units...",
    "Establishing neural links...",
    "Loading tactical data...",
    "Synchronizing Processors...",
    "Calibrating targeting systems...",
    "Activating defense protocols...",
    "Analyzing battlefield conditions...",
    "System check complete..."
  ];

  let currentMessageIndex = 0;

  const showMessage = () => {
    if (currentMessageIndex < messages.length) {
      loadingMessage.textContent = messages[currentMessageIndex];
      loadingMessage.classList.add('visible');
      
      setTimeout(() => {
        loadingMessage.classList.remove('visible');
        currentMessageIndex++;
        
        // Schedule next message after fade-out
        setTimeout(() => {
          if (currentMessageIndex < messages.length) {
            showMessage();
          }
        }, 100);
      }, 300);
    }
  };

  // Generate random loading time between 3 and 6 seconds
  const randomLoadingTime = Math.random() * (6000 - 3000) + 3000;

  // Start progress bar animation and messages
  setTimeout(() => {
    progressFill.style.width = '100%';
    // Adjust transition duration in CSS to match random time
    progressFill.style.transitionDuration = `${randomLoadingTime/1000}s`;
    showMessage();
  }, 100);

  // After random loading time, fade out loading screen and show content
  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    loadingScreen.addEventListener('transitionend', () => {
      loadingScreen.style.display = 'none';
    });

    // Show main content
    mainContent.classList.remove('hidden');
    mainContent.style.opacity = '1';

    // Initialize Intersection Observer for info cards
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
  }, randomLoadingTime);

  // Add hamburger menu functionality
  const hamburger = document.querySelector('.hamburger');
  const navList = document.querySelector('.nav-list');
  const navLinks = document.querySelectorAll('.nav-link');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navList.classList.toggle('active');
  });

  // Close menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      hamburger.classList.remove('active');
      navList.classList.remove('active');
      
      const targetId = link.getAttribute('href').slice(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ 
          behavior: 'smooth'
        });
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navList.contains(e.target)) {
      hamburger.classList.remove('active');
      navList.classList.remove('active');
    }
  });

  // Update active nav link based on scroll position
  const sections = document.querySelectorAll('section[id]');
  
  const updateActiveNavLink = () => {
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        document.querySelector(`.nav-link[href="#${sectionId}"]`)?.classList.add('active');
      } else {
        document.querySelector(`.nav-link[href="#${sectionId}"]`)?.classList.remove('active');
      }
    });
  };

  // Throttle scroll event
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveNavLink();
        ticking = false;
      });
      ticking = true;
    }
  });
});

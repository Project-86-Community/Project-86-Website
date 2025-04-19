document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.querySelector('.loading-screen');
  const progressFill = document.querySelector('.progress-fill');
  const progressPercentage = document.querySelector('.progress-percentage');
  const mainContent = document.querySelector('.content');
  const loadingMessage = document.querySelector('.loading-message');
  
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

  let currentMessageIndex = 0;
  let progress = 0;
  const totalSteps = messages.length;
  const animationDuration = 5000; // 5 seconds total for loading
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
            showMessage(index + 1);
          }, 100);
        }, stepTime - 200);
      } else {
        // Final message - keep it visible and proceed to main content
        setTimeout(() => {
          completeLoading();
        }, stepTime);
      }
    }
  };

  const completeLoading = () => {
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
  };

  // Start the loading sequence
  setTimeout(() => {
    showMessage(0);
  }, 500);

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

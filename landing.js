// Mobile Menu Toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('active');
}

// Smooth Scroll
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Tutorial Management
let currentStep = 1;

function startTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    overlay.classList.add('active');
    showStep(1);
}

function skipTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    overlay.classList.remove('active');
    launchApp();
}

function nextStep(step) {
    hideStep(currentStep);
    currentStep = step;
    setTimeout(() => showStep(step), 300);
}

function prevStep(step) {
    hideStep(currentStep);
    currentStep = step;
    setTimeout(() => showStep(step), 300);
}

function showStep(step) {
    const stepElement = document.getElementById(`step-${step}`);
    if (stepElement) {
        stepElement.classList.remove('hidden');
        stepElement.style.animation = 'scaleIn 0.4s ease-out';
    }
}

function hideStep(step) {
    const stepElement = document.getElementById(`step-${step}`);
    if (stepElement) {
        stepElement.classList.add('hidden');
    }
}

function launchApp() {
    // Create a beautiful transition effect
    const overlay = document.getElementById('tutorial-overlay');
    overlay.style.transition = 'opacity 0.5s ease-out';
    overlay.style.opacity = '0';
    
    setTimeout(() => {
        // Redirect to the main app
        window.location.href = 'index.html';
    }, 500);
}

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease-out';
            entry.target.style.opacity = '1';
        }
    });
}, observerOptions);

// Observe elements on page load
document.addEventListener('DOMContentLoaded', () => {
    // Animate sections on scroll
    const sections = document.querySelectorAll('.features-grid, .steps, .languages-grid, .cta-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        observer.observe(section);
    });

    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Close mobile menu when clicking a link
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            toggleMobileMenu();
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(15, 15, 30, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(15, 15, 30, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Add click handlers for CTA buttons
    document.querySelectorAll('.cta-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            // Add click animation
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        });
    });

    // Parallax effect for gradient orbs
    window.addEventListener('mousemove', (e) => {
        const orbs = document.querySelectorAll('.gradient-orb');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 10;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            orb.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Easter egg: Confetti on hero section click (triple click)
    let clickCount = 0;
    const heroTitle = document.querySelector('.hero-title');
    
    heroTitle.addEventListener('click', () => {
        clickCount++;
        if (clickCount === 3) {
            createConfetti();
            clickCount = 0;
        }
        setTimeout(() => {
            clickCount = 0;
        }, 1000);
    });
});

// Confetti effect
function createConfetti() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-20px';
        confetti.style.opacity = '1';
        confetti.style.transform = 'rotate(0deg)';
        confetti.style.transition = 'all 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        confetti.style.zIndex = '20000';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.pointerEvents = 'none';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.style.top = window.innerHeight + 100 + 'px';
            confetti.style.left = (parseInt(confetti.style.left) + (Math.random() - 0.5) * 300) + 'px';
            confetti.style.opacity = '0';
            confetti.style.transform = 'rotate(' + (Math.random() * 720 - 360) + 'deg)';
        }, 50);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press 'S' to start tutorial
    if (e.key === 's' || e.key === 'S') {
        const overlay = document.getElementById('tutorial-overlay');
        if (!overlay.classList.contains('active')) {
            startTutorial();
        }
    }
    
    // Press 'Escape' to close tutorial
    if (e.key === 'Escape') {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay.classList.contains('active')) {
            skipTutorial();
        }
    }
    
    // Arrow keys for tutorial navigation
    if (e.key === 'ArrowRight' && currentStep < 5) {
        nextStep(currentStep + 1);
    }
    if (e.key === 'ArrowLeft' && currentStep > 1) {
        prevStep(currentStep - 1);
    }
});

// Add loading animation to app launch
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-out';
        document.body.style.opacity = '1';
    }, 100);
});

// Prevent default on all hash links for smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Analytics tracking (placeholder for future use)
function trackEvent(category, action, label) {
    console.log(`Event: ${category} - ${action} - ${label}`);
    // Add your analytics tracking code here (e.g., Google Analytics, Mixpanel, etc.)
}

// Track CTA clicks
document.querySelectorAll('.cta-primary, .cta-secondary').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('CTA', 'Click', btn.textContent.trim());
    });
});

// Setup swipe for mobile menu
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const mobileMenu = document.getElementById('mobile-menu');
    const swipeThreshold = 50;
    const swipeDistance = touchStartX - touchEndX;
    
    // Swipe left to open menu (from right edge)
    if (swipeDistance > swipeThreshold && touchStartX > window.innerWidth - 50) {
        mobileMenu.classList.add('active');
    }
    
    // Swipe right to close menu
    if (swipeDistance < -swipeThreshold && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const mobileMenu = document.getElementById('mobile-menu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (!mobileMenu.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        mobileMenu.classList.remove('active');
    }
});


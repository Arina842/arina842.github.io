// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.innerHTML = navMenu.classList.contains('active') ? 
        '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
});

// Close menu when clicking a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    header.classList.toggle('scrolled', window.scrollY > 50);
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 70,
                behavior: 'smooth'
            });
        }
    });
});

// Skills animation with reset on scroll
const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const skillProgress = entry.target.querySelector('.skill-progress');
        const width = skillProgress.dataset.width;
        
        if (entry.isIntersecting) {
            // Reset before animating
            skillProgress.style.width = '0';
            skillProgress.style.opacity = '0';
            
            // Animate after delay
            setTimeout(() => {
                skillProgress.style.width = width + '%';
                skillProgress.style.opacity = '1';
            }, 300);
        } else {
            // Reset when out of view
            skillProgress.style.width = '0';
            skillProgress.style.opacity = '0';
        }
    });
}, { threshold: 0.01 });

// Initialize skills animation
document.querySelectorAll('.skill-item').forEach(item => {
    const progress = item.querySelector('.skill-progress');
    progress.dataset.width = parseInt(progress.style.width);
    progress.style.width = '0';
    progress.style.opacity = '0';
    skillsObserver.observe(item);
});

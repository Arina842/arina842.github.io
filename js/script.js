function pluralizeRu(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
}

function formatWorkExperience(startDate) {
    const now = new Date();
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();

    if (now.getDate() < startDate.getDate()) {
        months--;
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const totalMonths = years * 12 + months;
    const roundedYears = Math.round((totalMonths / 12) * 2) / 2;

    const intPart = Math.floor(roundedYears);
    const isHalf = roundedYears % 1 !== 0;
    const value = isHalf
        ? `${intPart},5`
        : String(intPart);

    let label;
    if (isHalf) {
        label = intPart >= 5 || intPart === 0 ? 'лет' : 'года';
    } else {
        label = pluralizeRu(intPart, 'год', 'года', 'лет');
    }

    return `${value} ${label}`;
}

const workExperienceEl = document.getElementById('work-experience');
if (workExperienceEl) {
    workExperienceEl.textContent = formatWorkExperience(new Date(2021, 1, 1));
}

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
// Анимация контактов при скролле
const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('animate-in');
            }, index * 150);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.contact-item').forEach(item => {
    contactObserver.observe(item);
});

// Эффект копирования email
const emailElement = document.querySelector('a[href^="mailto:"]');
if (emailElement) {
    emailElement.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailElement.getAttribute('href').replace('mailto:', '');
        
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = 'Email скопирован!';
        document.body.appendChild(notification);
        
        // Показываем уведомление
        notification.style.display = 'block';
        
        // Копируем email и открываем почту
        navigator.clipboard.writeText(email).then(() => {
            setTimeout(() => {
                notification.remove();
                window.location.href = `mailto:${email}`;
            }, 2000);
        }).catch(() => {
            notification.textContent = 'Не удалось скопировать email';
            setTimeout(() => {
                notification.remove();
                window.location.href = `mailto:${email}`;
            }, 2000);
        });
    });
}

// Эффект нажатия на все контакты
document.querySelectorAll('.contact-item').forEach(item => {
    item.addEventListener('click', function() {
        const icon = this.querySelector('.contact-icon');
        icon.style.transform = 'scale(0.9)';
        setTimeout(() => {
            icon.style.transform = 'scale(1.1)';
        }, 100);
        setTimeout(() => {
            icon.style.transform = 'scale(1)';
        }, 200);
    });
});

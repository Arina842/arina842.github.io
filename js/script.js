const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let currentLang = document.documentElement.getAttribute('data-lang') || 'ru';
if (!['ru', 'en', 'zh'].includes(currentLang)) currentLang = 'ru';

function t(key) {
    const dict = I18N[currentLang] || I18N.ru;
    const value = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict);
    return value == null ? key : value;
}

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

    if (currentLang === 'zh') {
        return isHalf ? `${intPart}.5年` : `${intPart}年`;
    }

    if (currentLang === 'en') {
        const value = isHalf ? `${intPart}.5` : String(intPart);
        const label = !isHalf && intPart === 1 ? t('ui.yearsOne') : t('ui.yearsMany');
        return `${value} ${label}`;
    }

    const value = isHalf ? `${intPart},5` : String(intPart);
    let label;
    if (isHalf) {
        label = intPart >= 5 || intPart === 0 ? t('ui.yearsMany') : t('ui.yearsFew');
    } else {
        label = pluralizeRu(intPart, t('ui.yearsOne'), t('ui.yearsFew'), t('ui.yearsMany'));
    }
    return `${value} ${label}`;
}

function updateWorkExperience() {
    const workExperienceEl = document.getElementById('work-experience');
    if (workExperienceEl) {
        workExperienceEl.textContent = formatWorkExperience(new Date(2021, 1, 1));
    }
}

const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
}

/* Theme */
const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');

function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme, persist = true) {
    root.setAttribute('data-theme', theme);
    if (persist) {
        localStorage.setItem('theme', theme);
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        const dark = theme === 'dark';
        const palette = {
            ru: { light: '#2c3e50', dark: '#1a1424' },
            en: { light: '#1a1a1a', dark: '#0e0e10' },
            zh: { light: '#8b1a1a', dark: '#140e0c' }
        };
        const pair = palette[currentLang] || palette.ru;
        meta.setAttribute('content', dark ? pair.dark : pair.light);
    }
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', theme === 'dark' ? t('theme.toLight') : t('theme.toDark'));
        themeToggle.setAttribute('title', t('theme.title'));
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
}

applyTheme(currentTheme(), false);

/* Mobile menu */
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

function setMenuOpen(open) {
    navMenu.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? t('menu.close') : t('menu.open'));
    hamburger.innerHTML = open
        ? '<i class="fas fa-times" aria-hidden="true"></i>'
        : '<i class="fas fa-bars" aria-hidden="true"></i>';
}

function closeMenu() {
    setMenuOpen(false);
}

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        setMenuOpen(!navMenu.classList.contains('active'));
    });

    document.querySelectorAll('.nav-menu a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });
}

window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    header.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        window.scrollTo({
            top: target.offsetTop - 70,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    });
});

/* Active nav */
const sections = [...document.querySelectorAll('section[id]')];
const navLinks = [...document.querySelectorAll('.nav-menu a')];

function updateActiveNav() {
    const pos = window.scrollY + 120;
    let current = sections[0]?.id;
    sections.forEach((section) => {
        if (pos >= section.offsetTop) current = section.id;
    });
    navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* Scroll progress + back to top */
const progressBar = document.querySelector('.scroll-progress');
const backToTop = document.querySelector('.back-to-top');

function updateProgress() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const value = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    if (progressBar) progressBar.style.width = `${value}%`;
    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
}

window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

if (backToTop) {
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
}

/* Skills animation */
const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        const skillProgress = entry.target.querySelector('.skill-progress');
        const width = skillProgress.dataset.width;

        if (entry.isIntersecting) {
            skillProgress.style.width = '0';
            skillProgress.style.opacity = '0';
            requestAnimationFrame(() => {
                skillProgress.style.width = `${width}%`;
                skillProgress.style.opacity = '1';
            });
        } else if (!prefersReducedMotion) {
            skillProgress.style.width = '0';
            skillProgress.style.opacity = '0';
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.skill-item').forEach((item) => {
    const progress = item.querySelector('.skill-progress');
    progress.dataset.width = parseInt(progress.style.width, 10);
    if (!prefersReducedMotion) {
        progress.style.width = '0';
        progress.style.opacity = '0';
    }
    skillsObserver.observe(item);
});

/* Contacts */
const contactItems = document.querySelectorAll('.contact-item');
const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = Number(entry.target.dataset.index || 0);
        setTimeout(() => entry.target.classList.add('animate-in'), index * 120);
        contactObserver.unobserve(entry.target);
    });
}, { threshold: 0.15 });

contactItems.forEach((item, index) => {
    item.dataset.index = String(index);
    contactObserver.observe(item);
    item.addEventListener('click', function () {
        const icon = this.querySelector('.contact-icon');
        icon.style.transform = 'scale(0.9)';
        setTimeout(() => { icon.style.transform = 'scale(1.1)'; }, 100);
        setTimeout(() => { icon.style.transform = 'scale(1)'; }, 200);
    });
});

function showNotification(text) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = text;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

const emailElement = document.querySelector('a[href^="mailto:"]');
if (emailElement) {
    emailElement.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailElement.getAttribute('href').replace('mailto:', '');
        const openMail = () => { window.location.href = `mailto:${email}`; };
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(email).then(() => {
                showNotification(t('ui.emailCopied'));
                setTimeout(openMail, 700);
            }).catch(() => {
                showNotification(t('ui.emailOpen'));
                openMail();
            });
        } else {
            openMail();
        }
    });
}

/* Interactive terminal */
const terminalBody = document.getElementById('terminal-body');
const terminalForm = document.getElementById('terminal-form');
const terminalInput = document.getElementById('terminal-input');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendLine(html) {
    if (!terminalBody) return;
    terminalBody.insertAdjacentHTML('beforeend', html);
}

async function typeCommand(command) {
    const line = document.createElement('div');
    line.innerHTML = '<span class="prompt">arina@portfolio:~$</span> <span class="command cursor-blink"></span>';
    terminalBody.appendChild(line);
    const commandEl = line.querySelector('.command');
    if (prefersReducedMotion) {
        commandEl.textContent = command;
        commandEl.classList.remove('cursor-blink');
        return;
    }
    for (const char of command) {
        commandEl.textContent += char;
        await sleep(42);
    }
    commandEl.classList.remove('cursor-blink');
}

function printOutput(text) {
    appendLine(`<span class="output">${text}</span>`);
}

const HOBBY_IDS = ['coffee', 'photo', 'music', 'festivals', 'lilac'];

function rainLilacs() {
    const count = prefersReducedMotion ? 8 : 36;
    const zh = currentLang === 'zh';
    for (let i = 0; i < count; i += 1) {
        const petal = document.createElement('span');
        petal.className = 'lilac-petal';
        petal.style.left = `${Math.random() * 100}vw`;
        petal.style.animationDuration = `${3.2 + Math.random() * 3.5}s`;
        petal.style.animationDelay = `${Math.random() * 1.2}s`;
        petal.style.transform = `rotate(${Math.random() * 80}deg)`;
        if (zh) {
            petal.style.background = 'radial-gradient(circle at 30% 30%, #f7d6d0, #c23a2b 70%)';
        }
        document.body.appendChild(petal);
        setTimeout(() => petal.remove(), 8000);
    }
}

function spawnNotes() {
    const marks = ['♪', '♫', '♩'];
    for (let i = 0; i < 5; i += 1) {
        const note = document.createElement('span');
        note.className = 'float-note';
        note.textContent = marks[i % marks.length];
        note.style.left = `${20 + Math.random() * 60}vw`;
        note.style.top = `${40 + Math.random() * 20}vh`;
        document.body.appendChild(note);
        setTimeout(() => note.remove(), 1200);
    }
}

function photoFlash() {
    const flash = document.createElement('div');
    flash.className = 'photo-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
}

function festivalBurst() {
    const colors = currentLang === 'zh'
        ? ['#9b2d2d', '#c9a227', '#2d5a4a', '#d4533e', '#f3ead8']
        : ['#e74c3c', '#f1c40f', '#3498db', '#c9a8e0', '#2ecc71'];
    for (let i = 0; i < 18; i += 1) {
        const bit = document.createElement('span');
        bit.className = 'lilac-petal';
        bit.style.left = `${Math.random() * 100}vw`;
        bit.style.background = colors[i % colors.length];
        bit.style.animationDuration = `${2.2 + Math.random() * 2}s`;
        bit.style.borderRadius = '2px';
        document.body.appendChild(bit);
        setTimeout(() => bit.remove(), 5000);
    }
}

function triggerHobby(id) {
    if (id === 'lilac') {
        showNotification(t('terminal.lilac'));
        rainLilacs();
        return;
    }
    if (id === 'coffee') showNotification(t('terminal.coffee'));
    if (id === 'photo') {
        photoFlash();
        showNotification(t('terminal.photo'));
    }
    if (id === 'music') {
        spawnNotes();
        showNotification(t('terminal.music'));
    }
    if (id === 'festivals') {
        festivalBurst();
        showNotification(t('terminal.festivals'));
    }
}

function renderHobbies() {
    if (!terminalBody) return;
    let wrap = terminalBody.querySelector('.hobby-row');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'hobby-row';
        terminalBody.appendChild(wrap);
    }
    wrap.innerHTML = '';
    HOBBY_IDS.forEach((id) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = id === 'lilac' ? 'hobby-chip is-secret' : 'hobby-chip';
        btn.dataset.hobby = id;
        btn.textContent = t(`terminal.hobbies.${id}`);
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHobby(id);
        });
        wrap.appendChild(btn);
    });
}

function runLilacCommand(raw) {
    const input = raw.trim().toLowerCase();
    if (!input) return;

    if (input === 'lilac' || input === 'сирень' || input === '丁香') {
        triggerHobby('lilac');
        terminalInput.value = '';
        return;
    }

    showNotification(t('terminal.tryLilac'));
    terminalInput.value = '';
}

async function playIntro() {
    if (!terminalBody) return;
    await typeCommand('whoami');
    appendLine(`<span class="output terminal-whoami">${t('terminal.whoami')}</span>`);
    renderHobbies();
    await sleep(prefersReducedMotion ? 0 : 220);
    await typeCommand('skills --show');
    appendLine(`<span class="output terminal-skills">${t('terminal.skills')}</span>`);
}

if (terminalForm && terminalInput && terminalBody) {
    terminalInput.disabled = true;
    playIntro().finally(() => {
        terminalInput.disabled = false;
    });
    terminalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runLilacCommand(terminalInput.value);
    });
    document.getElementById('terminal')?.addEventListener('click', (e) => {
        if (e.target.closest('.hobby-chip')) return;
        terminalInput.focus();
    });
}

let logoClicks = 0;
document.querySelector('.logo')?.addEventListener('click', () => {
    logoClicks += 1;
    if (logoClicks >= 5) {
        triggerHobby('lilac');
        logoClicks = 0;
    }
});

/* Motion extras */
const pointerGlow = document.querySelector('.pointer-glow');
if (pointerGlow && !prefersReducedMotion) {
    window.addEventListener('pointermove', (e) => {
        pointerGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }, { passive: true });
}

const heroImg = document.querySelector('.hero-img');
const heroSection = document.querySelector('.hero');
if (heroImg && heroSection && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
        heroImg.style.translate = `${x}px ${y}px`;
    });
    heroSection.addEventListener('mouseleave', () => {
        heroImg.style.translate = '0 0';
    });
}

function enableTilt(selector) {
    if (prefersReducedMotion || !window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll(selector).forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

enableTilt('.education-card');

document.querySelectorAll('.skill-tag').forEach((tag) => {
    tag.addEventListener('click', () => tag.classList.toggle('is-on'));
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.14 });

document.querySelectorAll('.skills-category, .education-card, .timeline-content').forEach((el) => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

/* i18n */
function applyLang(lang, persist = true) {
    if (!I18N[lang]) lang = 'ru';
    currentLang = lang;
    if (persist) localStorage.setItem('lang', lang);
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'zh' ? 'zh-CN' : lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const value = t(el.dataset.i18n);
        if (typeof value === 'string') el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        el.setAttribute('title', t(el.dataset.i18nTitle));
    });

    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
        el.setAttribute('alt', t(el.dataset.i18nAlt));
    });

    document.title = t('meta.title');
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', t('meta.description'));
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', t('meta.title'));
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', t('meta.description'));

    document.querySelectorAll('.lang-switch button').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });

    updateWorkExperience();
    applyTheme(currentTheme(), false);
    if (hamburger) {
        const open = navMenu.classList.contains('active');
        hamburger.setAttribute('aria-label', open ? t('menu.close') : t('menu.open'));
    }

    const who = document.querySelector('.terminal-whoami');
    if (who) who.textContent = t('terminal.whoami');
    const skillsOut = document.querySelector('.terminal-skills');
    if (skillsOut) skillsOut.textContent = t('terminal.skills');
    if (terminalBody?.querySelector('.hobby-row')) renderHobbies();
}

document.querySelectorAll('.lang-switch button').forEach((btn) => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

applyLang(currentLang, false);

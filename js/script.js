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
    const value = isHalf ? `${intPart}.5` : String(intPart);

    if (currentLang === 'zh') {
        return `<span class="exp-years">${value}</span><span class="exp-unit">年</span>`;
    }

    if (currentLang === 'en') {
        const label = !isHalf && intPart === 1 ? t('ui.yearsOne') : t('ui.yearsMany');
        return `<span class="exp-years">${value}</span> <span class="exp-unit">${label}</span>`;
    }

    let label;
    if (isHalf) {
        label = intPart >= 5 || intPart === 0 ? t('ui.yearsMany') : t('ui.yearsFew');
    } else {
        label = pluralizeRu(intPart, t('ui.yearsOne'), t('ui.yearsFew'), t('ui.yearsMany'));
    }
    return `<span class="exp-years">${value}</span> <span class="exp-unit">${label}</span>`;
}

function updateWorkExperience() {
    const workExperienceEl = document.getElementById('work-experience');
    if (workExperienceEl) {
        workExperienceEl.innerHTML = formatWorkExperience(new Date(2021, 1, 1));
    }
}

/* Inclusive month span: Nov–Dec = 2 months */
function parseYearMonth(value) {
    if (!value || value === 'present') {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    const [yearStr, monthStr] = value.split('-');
    return { year: Number(yearStr), month: Number(monthStr) };
}

function inclusiveMonths(startValue, endValue) {
    const start = parseYearMonth(startValue);
    const end = parseYearMonth(endValue);
    return (end.year - start.year) * 12 + (end.month - start.month) + 1;
}

function formatUnitParts(n, one, few, many) {
    if (currentLang === 'zh') {
        return { num: String(n), unit: one };
    }
    if (currentLang === 'en') {
        return { num: String(n), unit: n === 1 ? one : many };
    }
    return { num: String(n), unit: pluralizeRu(n, one, few, many) };
}

function buildDurationParts(totalMonths) {
    if (totalMonths < 1) totalMonths = 1;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts = [];

    if (years > 0) {
        parts.push({
            ...formatUnitParts(years, t('ui.yearsOne'), t('ui.yearsFew'), t('ui.yearsMany')),
            kind: 'years'
        });
    }
    if (months > 0 || years === 0) {
        const m = years === 0 ? totalMonths : months;
        parts.push({
            ...formatUnitParts(m, t('ui.monthsOne'), t('ui.monthsFew'), t('ui.monthsMany')),
            kind: 'months'
        });
    }
    return parts;
}

function updateJobDurationTips() {
    document.querySelectorAll('.timeline-content[data-start]').forEach((card, index) => {
        const totalMonths = inclusiveMonths(card.dataset.start, card.dataset.end);
        const parts = buildDurationParts(totalMonths);
        const tipId = `job-duration-${index}`;
        let tip = card.querySelector('.job-duration-tip');
        if (!tip) {
            tip = document.createElement('aside');
            tip.className = 'job-duration-tip';
            tip.id = tipId;
            card.appendChild(tip);
            card.setAttribute('aria-describedby', tipId);
        }

        const partsHtml = parts.map((part) => `
            <span class="job-duration-part job-duration-part--${part.kind}">
                <span class="job-duration-num">${part.num}</span>
                <span class="job-duration-unit">${part.unit}</span>
            </span>
        `).join('');

        tip.innerHTML = `
            <div class="job-duration-glow" aria-hidden="true"></div>
            <div class="job-duration-head">
                <span class="job-duration-mark" aria-hidden="true"></span>
                <span class="job-duration-label">${t('ui.durationLabel')}</span>
            </div>
            <div class="job-duration-value">${partsHtml}</div>
        `;
    });
}

function isTouchUi() {
    return window.matchMedia('(hover: none)').matches
        || window.matchMedia('(pointer: coarse)').matches;
}

function closeJobDurationTips(except = null) {
    document.querySelectorAll('.timeline-content.is-duration-open').forEach((card) => {
        if (card === except) return;
        card.classList.remove('is-duration-open');
        card.setAttribute('aria-expanded', 'false');
    });
}

function initJobDurationInteractions() {
    const timeline = document.querySelector('.timeline');
    if (!timeline || timeline.dataset.durationBound === '1') return;
    timeline.dataset.durationBound = '1';

    document.querySelectorAll('.timeline-content[data-start]').forEach((card) => {
        card.setAttribute('aria-expanded', 'false');
    });

    timeline.addEventListener('click', (e) => {
        if (!isTouchUi()) return;
        const card = e.target.closest('.timeline-content[data-start]');
        if (!card || !timeline.contains(card)) return;

        const willOpen = !card.classList.contains('is-duration-open');
        closeJobDurationTips(willOpen ? card : null);
        card.classList.toggle('is-duration-open', willOpen);
        card.setAttribute('aria-expanded', String(willOpen));
    });

    document.addEventListener('click', (e) => {
        if (!isTouchUi()) return;
        if (e.target.closest('.timeline-content[data-start]')) return;
        closeJobDurationTips();
    });
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

function systemTheme() {
    try {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
    } catch (e) {}
    return 'light';
}

function hasExplicitTheme() {
    try {
        const stored = localStorage.getItem('theme');
        return stored === 'dark' || stored === 'light';
    } catch (e) {
        return false;
    }
}

function applyTheme(theme, persist = true) {
    const next = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    if (persist) {
        localStorage.setItem('theme', next);
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        const dark = next === 'dark';
        const palette = {
            ru: { light: '#2c3e50', dark: '#1a1424' },
            en: { light: '#1a1a1a', dark: '#1c1f28' },
            zh: { light: '#8b1a1a', dark: '#140e0c' }
        };
        const pair = palette[currentLang] || palette.ru;
        meta.setAttribute('content', dark ? pair.dark : pair.light);
    }
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', next === 'dark' ? t('theme.toLight') : t('theme.toDark'));
        themeToggle.setAttribute('title', t('theme.title'));
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
}

applyTheme(hasExplicitTheme() ? currentTheme() : systemTheme(), false);

try {
    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemTheme = () => {
        if (!hasExplicitTheme()) applyTheme(systemTheme(), false);
    };
    if (themeMedia.addEventListener) {
        themeMedia.addEventListener('change', onSystemTheme);
    } else if (themeMedia.addListener) {
        themeMedia.addListener(onSystemTheme);
    }
} catch (e) {}

/* Mobile menu */
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

function setMenuOpen(open) {
    navMenu.classList.toggle('active', open);
    document.body.classList.toggle('nav-open', open);
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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) closeMenu();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) closeMenu();
    }, { passive: true });
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
            top: target.offsetTop - 72,
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

const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    || window.matchMedia('(hover: none)').matches;

function effectCount(desktop, mobile, reduced) {
    if (prefersReducedMotion) return reduced;
    return isCoarsePointer ? mobile : desktop;
}

function getFxLayer() {
    let layer = document.getElementById('fx-layer');
    if (!layer) {
        layer = document.createElement('div');
        layer.id = 'fx-layer';
        layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer);
    }
    return layer;
}

function rainLilacs() {
    const count = effectCount(56, 28, 12);
    const zh = currentLang === 'zh';
    const layer = getFxLayer();
    for (let i = 0; i < count; i += 1) {
        const petal = document.createElement('span');
        petal.className = 'lilac-petal';
        petal.style.left = `${Math.random() * 100}vw`;
        petal.style.animationDuration = `${5.5 + Math.random() * 4.5}s`;
        petal.style.animationDelay = `${Math.random() * 1.8}s`;
        petal.style.setProperty('--rot', `${Math.random() * 80}deg`);
        if (zh) {
            petal.style.background = 'radial-gradient(circle at 30% 30%, #f7d6d0, #c23a2b 70%)';
        }
        layer.appendChild(petal);
        setTimeout(() => petal.remove(), 13000);
    }
}

function rainCoffee() {
    const count = effectCount(64, 32, 14);
    const layer = getFxLayer();
    for (let i = 0; i < count; i += 1) {
        const bean = document.createElement('span');
        bean.className = 'coffee-bean';
        bean.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="12" cy="12" rx="8" ry="10" fill="currentColor"/><path d="M12 3.5c-1.2 2.4-1.4 5-1.4 8.5s.2 6.1 1.4 8.5c1.2-2.4 1.4-5 1.4-8.5S13.2 5.9 12 3.5z" fill="rgba(30,16,8,.45)"/></svg>';
        bean.style.left = `${Math.random() * 100}vw`;
        bean.style.animationDuration = `${5 + Math.random() * 4}s`;
        bean.style.animationDelay = `${Math.random() * 1.5}s`;
        bean.style.setProperty('--spin', `${180 + Math.random() * 540}deg`);
        bean.style.color = ['#6f4e37', '#5d4037', '#4e342e', '#8d6e63'][i % 4];
        layer.appendChild(bean);
        setTimeout(() => bean.remove(), 12000);
    }
}

function spawnNotes() {
    const marks = ['♪', '♫', '♩'];
    const count = effectCount(16, 10, 6);
    const layer = getFxLayer();
    for (let i = 0; i < count; i += 1) {
        const note = document.createElement('span');
        note.className = 'float-note';
        note.textContent = marks[i % marks.length];
        note.style.left = `${12 + Math.random() * 76}vw`;
        note.style.top = `${30 + Math.random() * 35}vh`;
        note.style.fontSize = `${1.3 + Math.random() * 0.5}rem`;
        note.style.animationDelay = `${Math.random() * 0.6}s`;
        layer.appendChild(note);
        setTimeout(() => note.remove(), 2800);
    }
}

function photoFlash() {
    const flash = document.createElement('div');
    flash.className = 'photo-flash';
    getFxLayer().appendChild(flash);
    setTimeout(() => flash.remove(), 900);
}

function festivalBurst() {
    const colors = currentLang === 'zh'
        ? ['#ff4d4f', '#ffd666', '#36cfc9', '#f759ab', '#fff1b8', '#9254de']
        : currentLang === 'en'
            ? ['#67e8f9', '#a78bfa', '#fb7185', '#fbbf24', '#34d399', '#60a5fa']
            : ['#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#2ecc71', '#e67e22'];

    const layer = getFxLayer();
    const sparkCount = effectCount(36, 18, 8);
    for (let i = 0; i < sparkCount; i += 1) {
        const spark = document.createElement('span');
        spark.className = 'fest-spark';
        spark.style.left = `${8 + Math.random() * 84}vw`;
        spark.style.top = `${18 + Math.random() * 50}vh`;
        spark.style.background = colors[i % colors.length];
        spark.style.animationDelay = `${Math.random() * 0.7}s`;
        spark.style.setProperty('--rise', `${40 + Math.random() * 80}px`);
        layer.appendChild(spark);
        setTimeout(() => spark.remove(), 3200);
    }

    const ticketCount = effectCount(28, 14, 6);
    for (let i = 0; i < ticketCount; i += 1) {
        const ticket = document.createElement('span');
        ticket.className = 'fest-ticket';
        ticket.style.left = `${Math.random() * 100}vw`;
        ticket.style.background = colors[i % colors.length];
        ticket.style.animationDuration = `${5.5 + Math.random() * 4}s`;
        ticket.style.animationDelay = `${Math.random() * 1.2}s`;
        ticket.style.setProperty('--tilt', `${-40 + Math.random() * 80}deg`);
        layer.appendChild(ticket);
        setTimeout(() => ticket.remove(), 12000);
    }
}

function triggerHobby(id) {
    if (id === 'lilac') {
        showNotification(t('terminal.lilac'));
        rainLilacs();
        return;
    }
    if (id === 'coffee') {
        rainCoffee();
        showNotification(t('terminal.coffee'));
        return;
    }
    if (id === 'photo') {
        photoFlash();
        showNotification(t('terminal.photo'));
        return;
    }
    if (id === 'music') {
        spawnNotes();
        showNotification(t('terminal.music'));
        return;
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
        btn.setAttribute('aria-label', t(`terminal.hobbies.${id}`));
        btn.textContent = t(`terminal.hobbies.${id}`);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (document.activeElement === terminalInput) terminalInput.blur();
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
        if (isCoarsePointer) terminalInput.blur();
    });
    document.getElementById('terminal')?.addEventListener('click', (e) => {
        if (e.target.closest('.hobby-chip')) return;
        if (e.target === terminalInput || e.target.closest('label[for="terminal-input"]')) {
            terminalInput.focus();
            return;
        }
        /* On phones, auto-focus opens the keyboard and breaks chip taps */
        if (isCoarsePointer) return;
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
if (
    pointerGlow
    && !prefersReducedMotion
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
) {
    window.addEventListener('pointermove', (e) => {
        pointerGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }, { passive: true });
} else if (pointerGlow) {
    pointerGlow.style.display = 'none';
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

    document.querySelectorAll('[data-i18n-href]').forEach((el) => {
        const href = t(el.dataset.i18nHref);
        if (typeof href === 'string' && href) el.setAttribute('href', href);
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
    updateJobDurationTips();
    initJobDurationInteractions();
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

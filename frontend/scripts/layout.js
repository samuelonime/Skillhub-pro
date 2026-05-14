// layout.js — renders sidebar, topbar, notifications for all dashboard pages

function buildLayout({ page, role = 'student', title = 'SkillHub' }) {
  document.title = `${title} — SkillHub`;

  const user = SkillHub.getUser();
  if (!user) return;

  const navItems = {
    student: [
      { icon: 'fa-grid-2', label: 'Dashboard',    href: 'index.html',              id: 'dashboard' },
      { icon: 'fa-book-open', label: 'Courses',   href: 'courses.html',            id: 'courses' },
      { icon: 'fa-briefcase', label: 'Jobs',       href: 'jobs.html',               id: 'jobs' },
      { icon: 'fa-folder-open', label: 'Portfolio',href: 'portfolio.html',          id: 'portfolio' },
      { icon: 'fa-certificate', label: 'Certificates', href: 'certificates.html',   id: 'certificates' },
      { icon: 'fa-road',  label: 'Skill Paths',    href: 'skillpaths.html',         id: 'skillpaths' },
      { icon: 'fa-coins', label: 'Rewards',        href: 'rewards.html',            id: 'rewards' },
    ],
    employer: [
      { icon: 'fa-grid-2',     label: 'Dashboard',    href: 'employer-dashboard.html', id: 'dashboard' },
      { icon: 'fa-briefcase',  label: 'Jobs',          href: 'jobs.html',               id: 'jobs' },
      { icon: 'fa-users',      label: 'Candidates',    href: 'candidates.html',         id: 'candidates' },
      { icon: 'fa-magnifying-glass-plus', label: 'Talent Pool', href: 'talent.html',   id: 'talent' },
    ],
    admin: [
      { icon: 'fa-grid-2', label: 'Dashboard',    href: 'Admin.html',              id: 'dashboard' },
      { icon: 'fa-users', label: 'Users',          href: 'Admin.html#users',        id: 'users' },
      { icon: 'fa-briefcase', label: 'Jobs',       href: 'Admin.html#jobs',         id: 'jobs' },
      { icon: 'fa-certificate', label: 'Certificates', href: 'Admin.html#certs',    id: 'certificates' },
    ],
  };

  const nav = (navItems[user.role] || navItems.student).map(item => `
    <a class="nav-link ${page === item.id ? 'active' : ''}" href="${item.href}">
      <i class="fas ${item.icon}"></i>${item.label}
    </a>`).join('');

  document.querySelector('.sidebar-nav').innerHTML = `
    <span class="nav-label">Main</span>
    ${nav}
    <span class="nav-label" style="margin-top:12px">Account</span>
    <a class="nav-link ${page === 'settings' ? 'active' : ''}" href="settings.html"><i class="fas fa-gear"></i>Settings</a>
  `;

  // Inject hamburger button into topbar (before topbar-title)
  const topbar = document.querySelector('.topbar');
  if (topbar && !topbar.querySelector('.mobile-menu-btn')) {
    const hamBtn = document.createElement('button');
    hamBtn.className = 'mobile-menu-btn';
    hamBtn.setAttribute('aria-label', 'Open menu');
    hamBtn.innerHTML = '<i class="fas fa-bars"></i>';
    topbar.insertBefore(hamBtn, topbar.firstChild);

    // Mobile search toggle button (inserted before topbar-actions)
    const topbarActions = topbar.querySelector('.topbar-actions');
    const mobileSearchBtn = document.createElement('button');
    mobileSearchBtn.className = 'icon-btn mobile-search-btn';
    mobileSearchBtn.setAttribute('aria-label', 'Search');
    mobileSearchBtn.innerHTML = '<i class="fas fa-search"></i>';
    mobileSearchBtn.style.cssText = 'display:none;';
    topbarActions.insertBefore(mobileSearchBtn, topbarActions.firstChild);

    const searchBar = topbar.querySelector('.topbar-search');
    mobileSearchBtn.addEventListener('click', () => {
      const expanded = searchBar.style.display === 'flex';
      if (expanded) {
        searchBar.style.display = '';
        searchBar.style.position = '';
        searchBar.style.maxWidth = '';
      } else {
        searchBar.style.display = 'flex';
        searchBar.style.position = 'absolute';
        searchBar.style.left = '14px';
        searchBar.style.right = '14px';
        searchBar.style.top = '10px';
        searchBar.style.maxWidth = 'calc(100% - 28px)';
        searchBar.style.zIndex = '60';
        searchBar.style.background = 'var(--white)';
        searchBar.querySelector('input')?.focus();
      }
    });

    // Show/hide mobile search button at 768px
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleMedia = (mq) => {
      mobileSearchBtn.style.display = mq.matches ? 'grid' : 'none';
    };
    mediaQuery.addEventListener('change', handleMedia);
    handleMedia(mediaQuery);

    // Backdrop element
    let backdrop = document.getElementById('sidebarBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      backdrop.id = 'sidebarBackdrop';
      document.body.appendChild(backdrop);
    }

    const sidebar = document.querySelector('.sidebar');
    const openSidebar = () => { sidebar.classList.add('open'); backdrop.classList.add('open'); };
    const closeSidebar = () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); };

    hamBtn.addEventListener('click', openSidebar);
    backdrop.addEventListener('click', closeSidebar);

    // Close sidebar on nav-link click (mobile navigation)
    sidebar.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeSidebar();
      });
    });
  }

  document.querySelector('.sidebar-user-name').textContent = `${user.firstName} ${user.lastName}`;
  document.querySelector('.sidebar-user-role').textContent = user.role;
  const sideImg = document.querySelector('.sidebar-user img');
  if (sideImg) sideImg.src = user.avatar;

  const topImg = document.getElementById('topbarAvatar');
  if (topImg) topImg.src = user.avatar;

  const topTitle = document.getElementById('topbarTitle');
  if (topTitle) topTitle.textContent = title;

  // Load notifications
  loadNotifications();

  // Dropdown close on outside click
  document.addEventListener('click', e => {
    document.querySelectorAll('.dropdown-menu.open, .notif-panel.open').forEach(el => {
      if (!el.closest('.dropdown, .notif-wrap')?.contains(e.target)) el.classList.remove('open');
    });
  });
}

function toggleDropdown(id) {
  const m = document.getElementById(id);
  const wasOpen = m.classList.contains('open');
  document.querySelectorAll('.dropdown-menu.open, .notif-panel.open').forEach(el => el.classList.remove('open'));
  if (!wasOpen) m.classList.add('open');
}

async function loadNotifications() {
  try {
    const d = await SkillHub.notifications();
    if (!d?.success) return;
    const notifs = d.data;
    const unread = notifs.filter(n => !n.read).length;

    const dot = document.getElementById('notifDot');
    if (dot) dot.style.display = unread > 0 ? 'block' : 'none';

    const list = document.getElementById('notifList');
    if (!list) return;

    const iconMap = { certificate:'fa-certificate', briefcase:'fa-briefcase', book:'fa-book', coins:'fa-coins', star:'fa-star', calendar:'fa-calendar', gift:'fa-gift', info:'fa-info-circle' };

    list.innerHTML = notifs.length ? notifs.slice(0,8).map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead('${n.id}', this)">
        <div class="notif-icon ${n.type}"><i class="fas ${iconMap[n.icon] || 'fa-bell'}"></i></div>
        <div style="flex:1;min-width:0">
          <div class="notif-title">${n.title}</div>
          <div class="notif-msg">${n.message}</div>
        </div>
        <div class="notif-time">${relTime(n.createdAt)}</div>
      </div>`).join('') :
      '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px"><i class="fas fa-bell-slash" style="font-size:24px;margin-bottom:8px;display:block"></i>No notifications</div>';
  } catch {}
}

async function markRead(id, el) {
  el.classList.remove('unread');
  await SkillHub.markRead(id);
}

async function markAllRead() {
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  document.getElementById('notifDot').style.display = 'none';
  await SkillHub.markAllRead();
}

// ── SCROLL PROGRESS BAR + BACK TO TOP ────────────────────────────────────────
(function initScrollFeatures() {
  // Progress bar
  const bar = document.createElement('div');
  bar.id = 'scrollProgressBar';
  document.body.prepend(bar);

  // Back to top button
  const btt = document.createElement('button');
  btt.id = 'backToTop';
  btt.setAttribute('aria-label', 'Back to top');
  btt.innerHTML = '<i class="fas fa-arrow-up"></i>';
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btt);

  // Toast container (if not already there)
  if (!document.getElementById('toastContainer')) {
    const tc = document.createElement('div');
    tc.id = 'toastContainer';
    document.body.appendChild(tc);
  }

  // Scroll handler
  const main = document.querySelector('.main') || window;
  const scrollEl = document.querySelector('.main') || document.documentElement;

  function onScroll() {
    const scrollTop    = scrollEl.scrollTop || window.scrollY;
    const scrollHeight = scrollEl.scrollHeight - scrollEl.clientHeight;
    const pct = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
    bar.style.width = pct + '%';

    if (pct > 15) btt.classList.add('visible');
    else          btt.classList.remove('visible');
  }

  (document.querySelector('.main') || window).addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // set initial state
})();

// ── TOAST HELPER ─────────────────────────────────────────────────────────────
function toast(message, type = 'info', duration = 4000) {
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
  el.addEventListener('click', () => remove(el));
  container.appendChild(el);

  function remove(t) {
    t.classList.add('removing');
    t.addEventListener('animationend', () => t.remove(), { once: true });
  }
  setTimeout(() => remove(el), duration);
}
window.toast = toast;

// ── RELATIVE TIME ─────────────────────────────────────────────────────────────
function relTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
window.relTime = relTime;
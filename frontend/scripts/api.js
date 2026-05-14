// SkillHub API Client — shared across all pages
//
// Configure API_BASE via a <meta name="api-base" content="https://api.example.com/api/v1">
// tag in your HTML, or it falls back to the environment-appropriate default.
(function () {
  const metaBase = document.querySelector('meta[name="api-base"]')?.content;
  // In production, replace the fallback with your real API origin.
  window.API_BASE = metaBase || (
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? `${location.protocol}//${location.hostname}:5000/api/v1`
      : 'https://skillhub-u918.onrender.com/api/v1'  // same-origin reverse proxy (Nginx, etc.)
  );
})();

// ── XSS guard ────────────────────────────────────────────────────────────────
// Always escape untrusted strings before inserting into innerHTML.
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.esc = esc;

const SkillHub = {
  getToken:  () => localStorage.getItem('sh_token'),
  getUser:   () => { try { return JSON.parse(localStorage.getItem('sh_user') || 'null'); } catch { return null; } },
  setSession(data) {
    localStorage.setItem('sh_token',   data.accessToken);
    localStorage.setItem('sh_refresh', data.refreshToken);
    localStorage.setItem('sh_user',    JSON.stringify(data.user));
  },
  clearSession() { ['sh_token', 'sh_refresh', 'sh_user'].forEach(k => localStorage.removeItem(k)); },

  async _fetch(path, opts = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    };
    let res;
    try {
      res = await fetch(`${window.API_BASE}${path}`, { ...opts, headers });
    } catch (networkErr) {
      // Surface network failures (offline, CORS block, server down) as toasts
      toast('Network error — check your connection and try again.', 'error');
      throw networkErr;
    }

    if (res.status === 401) {
      // Try a silent token refresh before giving up
      const refreshed = await this._tryRefresh();
      if (refreshed) {
        // Replay the original request with the new token
        const newHeaders = { ...headers, Authorization: `Bearer ${this.getToken()}` };
        res = await fetch(`${window.API_BASE}${path}`, { ...opts, headers: newHeaders });
      } else {
        this.clearSession();
        window.location.href = 'landing.html';
        return;
      }
    }

    if (!res.ok && res.status !== 400 && res.status !== 404) {
      // Log unexpected server errors; don't swallow them silently
      console.error(`API error ${res.status} on ${opts.method || 'GET'} ${path}`);
    }

    return res.json();
  },

  async _tryRefresh() {
    const refreshToken = localStorage.getItem('sh_refresh');
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${window.API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data?.success && data.data?.accessToken) {
        localStorage.setItem('sh_token',   data.data.accessToken);
        localStorage.setItem('sh_refresh', data.data.refreshToken);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  },

  get:    (path)       => SkillHub._fetch(path),
  post:   (path, body) => SkillHub._fetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => SkillHub._fetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  del:    (path)       => SkillHub._fetch(path, { method: 'DELETE' }),

  requireAuth(roles) {
    const user = this.getUser(), token = this.getToken();
    if (!user || !token) { window.location.href = 'landing.html'; return null; }
    if (roles && !roles.includes(user.role)) { window.location.href = 'landing.html'; return null; }
    return user;
  },

  async logout() {
    try { await this.post('/auth/logout', { refreshToken: localStorage.getItem('sh_refresh') }); } catch { /* best-effort */ }
    this.clearSession();
    window.location.href = 'landing.html';
  },

  // ── Named API helpers ──────────────────────────────────────────────────────
  dashboard:      ()          => SkillHub.get('/dashboard'),
  notifications:  ()          => SkillHub.get('/dashboard/notifications'),
  markRead:       (id)        => SkillHub.put(`/dashboard/notifications/${id}/read`, {}),
  markAllRead:    ()          => SkillHub.put('/dashboard/notifications/read-all', {}),

  courses:        (q = '')    => SkillHub.get(`/courses${q}`),
  enrollCourse:   (id)        => SkillHub.post(`/courses/${id}/enroll`, {}),
  updateProgress: (id, p)     => SkillHub.put(`/courses/${id}/progress`, { progress: p }),

  jobs:           (q = '')    => SkillHub.get(`/jobs${q}`),
  applyJob:       (id, body)  => SkillHub.post(`/jobs/${id}/apply`, body),
  saveJob:        (id)        => SkillHub.post(`/jobs/${id}/save`, {}),
  myApplications: ()          => SkillHub.get('/jobs/applications'),

  portfolio:      ()          => SkillHub.get('/portfolio'),
  addProject:     (b)         => SkillHub.post('/portfolio/projects', b),
  updateProject:  (id, b)     => SkillHub.put(`/portfolio/projects/${id}`, b),
  deleteProject:  (id)        => SkillHub.del(`/portfolio/projects/${id}`),
  updateSkills:   (s)         => SkillHub.put('/portfolio/skills', { skills: s }),

  certs:          ()          => SkillHub.get('/certificates'),
  addCert:        (b)         => SkillHub.post('/certificates', b),
  verifyCert:     (id)        => SkillHub.post(`/certificates/${id}/verify`, {}),
  deleteCert:     (id)        => SkillHub.del(`/certificates/${id}`),

  profile:        ()          => SkillHub.get('/users/me'),
  updateProfile:  (b)         => SkillHub.put('/users/me', b),
  changePassword: (b)         => SkillHub.put('/users/me/password', b),

  rewards:        ()          => SkillHub.get('/rewards'),
  redeemReward:   (id)        => SkillHub.post(`/rewards/${id}/redeem`, {}),
  meritCoins:     ()          => SkillHub.get('/rewards/merit-coins'),

  settings:       ()          => SkillHub.get('/settings'),
  saveSettings:   (b)         => SkillHub.put('/settings', b),

  adminStats:     ()          => SkillHub.get('/admin/stats'),
  adminUsers:     (q = '')    => SkillHub.get(`/admin/users${q}`),
  adminCerts:     ()          => SkillHub.get('/admin/certificates'),
  adminVerify:    (id)        => SkillHub.put(`/admin/certificates/${id}/verify`, {}),
  adminJobs:      ()          => SkillHub.get('/admin/jobs'),
};

function toast(msg, type = 'info', ms = 3500) {
  const colors = { success:'#22c55e', error:'#ef4444', info:'#5b4cf5', warning:'#f59e0b' };
  const icons  = { success:'check-circle', error:'exclamation-circle', info:'info-circle', warning:'exclamation-triangle' };
  if (!document.querySelector('#_ts')) {
    const s = document.createElement('style'); s.id = '_ts';
    s.textContent = '@keyframes _tIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes _tOut{to{transform:translateX(120%);opacity:0}}';
    document.head.appendChild(s);
  }
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;gap:10px;background:#1c1c2e;color:#fff;padding:13px 18px;border-radius:12px;font-size:13.5px;font-family:'DM Sans',sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.3);border-left:3px solid ${colors[type]};max-width:340px;animation:_tIn .28s ease;`;
  t.innerHTML = `<i class="fas fa-${icons[type]}" style="color:${colors[type]};font-size:15px;flex-shrink:0"></i><span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.animation = '_tOut .28s ease forwards'; setTimeout(() => t.remove(), 300); }, ms);
}

function relTime(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

// ── New feature API helpers (appended) ───────────────────────────────────────
SkillHub.skillPaths         = (q = '')  => SkillHub.get(`/skill-paths${q}`);
SkillHub.skillPath          = (id)      => SkillHub.get(`/skill-paths/${id}`);
SkillHub.enrollPath         = (id)      => SkillHub.post(`/skill-paths/${id}/enroll`, {});
SkillHub.completeCourse     = (id, cId) => SkillHub.post(`/skill-paths/${id}/complete-course`, { courseId: cId });
SkillHub.myEnrolledPaths    = ()        => SkillHub.get('/skill-paths/my/enrolled');
SkillHub.createSkillPath    = (b)       => SkillHub.post('/skill-paths', b);
SkillHub.searchTalent       = (q = '')  => SkillHub.get(`/talent${q}`);
SkillHub.candidateProfile   = (id)      => SkillHub.get(`/talent/${id}`);
SkillHub.shortlistCandidate = (id, b)   => SkillHub.post(`/talent/${id}/shortlist`, b || {});
SkillHub.myShortlisted      = ()        => SkillHub.get('/talent/my/shortlisted');
SkillHub.getResume          = ()        => SkillHub.get('/resume');
SkillHub.deleteResume       = ()        => SkillHub.del('/resume');
SkillHub.getVisibility      = ()        => SkillHub.get('/resume/visibility');
SkillHub.setVisibility      = (pub)     => SkillHub.put('/resume/visibility', { portfolioPublic: pub });
SkillHub.skillGap           = (jobId)   => SkillHub.get(`/skill-gap/${jobId}`);
SkillHub.marketGap          = ()        => SkillHub.get('/skill-gap/overview/market');
SkillHub.uploadResume = async (file) => {
  const form  = new FormData();
  form.append('resume', file);
  const token = SkillHub.getToken();
  const res   = await fetch(`${window.API_BASE}/resume`, {
    method:  'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body:    form,
  });
  return res.json();
};
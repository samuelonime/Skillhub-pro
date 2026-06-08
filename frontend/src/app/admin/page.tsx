'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Stats {
  users:        { total: number; students: number; employers: number; instructors: number };
  courses:      { total: number };
  jobs:         { total: number; active: number; totalApplications: number };
  certificates: { total: number; verified: number; pending: number };
  revenue:      { totalPayments: number; totalRevenue: number; currency: string };
}
interface User {
  id: string; email: string; firstName: string; lastName: string;
  role: string; verified: boolean; meritCoins: number; createdAt: string; company?: string;
}
interface Certificate {
  id: string; title: string; provider: string; status: string; createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}
interface Job {
  id: string; title: string; company: string; location: string; type: string;
  status: string; createdAt: string; _count: { applications: number };
}
interface Payment {
  id: string; amount: number; currency: string; status: string; purpose: string;
  createdAt: string; user: { firstName: string; lastName: string; email: string };
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function fmt(n: number) { return n?.toLocaleString() ?? '0'; }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); }
function initials(u: { firstName: string; lastName: string }) {
  return ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase();
}
const AVATAR_COLORS = ['#5b4cf5','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#06b6d4'];
function avatarColor(s: string) { return AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]; }

/* ─── Skeleton ──────────────────────────────────────────────────────────── */
function Sk({ h = 'h-4', w = 'w-full', r = 'rounded-lg' }: any) {
  return <div className={`${h} ${w} ${r} bg-[#1e1e2e] animate-pulse`} />;
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accent }: {
  icon: string; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className="relative bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl p-5 overflow-hidden group hover:border-[#2a2a40] transition-all duration-300">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top left, ${accent}08 0%, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-xl grid place-items-center text-sm"
            style={{ background: accent + '18', color: accent }}>
            <i className={`fas ${icon}`} />
          </div>
          <span className="text-[11px] font-semibold text-[#3a3a55] uppercase tracking-widest">{label}</span>
        </div>
        <div className="font-syne font-bold text-3xl text-white mb-1">{value}</div>
        {sub && <div className="text-[12px] text-[#4a4a65]">{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Badge ─────────────────────────────────────────────────────────────── */
const ROLE_META: Record<string, [string, string]> = {
  student:    ['#3b82f6', 'Student'],
  employer:   ['#f59e0b', 'Employer'],
  instructor: ['#10b981', 'Instructor'],
  admin:      ['#ef4444', 'Admin'],
};
const STATUS_META: Record<string, [string, string]> = {
  active:   ['#10b981', 'Active'],
  closed:   ['#6b6b8a', 'Closed'],
  draft:    ['#f59e0b', 'Draft'],
  pending:  ['#f59e0b', 'Pending'],
  verified: ['#10b981', 'Verified'],
  rejected: ['#ef4444', 'Rejected'],
  success:  ['#10b981', 'Success'],
  failed:   ['#ef4444', 'Failed'],
  abandoned:['#6b6b8a', 'Abandoned'],
};
function Badge({ text, type = 'default' }: { text: string; type?: string }) {
  const [color] = STATUS_META[text?.toLowerCase()] || ROLE_META[text?.toLowerCase()] || ['#4a4a65', text];
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold"
      style={{ background: color + '18', color }}>
      {text}
    </span>
  );
}

/* ─── Toggle Switch ─────────────────────────────────────────────────────── */
function Toggle({ on, onChange, loading }: { on: boolean; onChange: (v: boolean) => void; loading?: boolean }) {
  return (
    <button
      onClick={() => !loading && onChange(!on)}
      disabled={loading}
      className={`relative w-14 h-7 rounded-full border-0 cursor-pointer transition-all flex-shrink-0 ${on ? 'bg-[#5b4cf5]' : 'bg-[#1e1e2e]'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ padding: 0 }}>
      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${on ? 'left-[34px]' : 'left-1'}`} />
    </button>
  );
}

/* ─── Sidebar Nav ───────────────────────────────────────────────────────── */
const NAV = [
  { id: 'overview',      icon: 'fa-chart-pie',      label: 'Overview' },
  { id: 'users',         icon: 'fa-users',           label: 'Users' },
  { id: 'jobs',          icon: 'fa-briefcase',       label: 'Jobs' },
  { id: 'certificates',  icon: 'fa-certificate',     label: 'Certificates' },
  { id: 'payments',      icon: 'fa-credit-card',     label: 'Payments' },
  { id: 'settings',      icon: 'fa-sliders',         label: 'Settings' },
];

/* ─── Main Admin Page ───────────────────────────────────────────────────── */
export default function AdminPage() {
  const [tab, setTab]         = useState('overview');
  const [stats, setStats]     = useState<Stats | null>(null);
  const [users, setUsers]     = useState<User[]>([]);
  const [certs, setCerts]     = useState<Certificate[]>([]);
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole]     = useState('');
  const [billingEnabled, setBillingEnabled] = useState<boolean | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [verifyingCert, setVerifyingCert] = useState<string | null>(null);

  function setLoad(key: string, v: boolean) {
    setLoading(prev => ({ ...prev, [key]: v }));
  }

  function showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  /* ── Loaders ── */
  const loadStats = useCallback(async () => {
    setLoad('stats', true);
    try {
      const r = await apiFetch('/admin/stats');
      if (r.success) setStats(r.data);
    } catch { showToast('Failed to load stats', 'error'); }
    finally { setLoad('stats', false); }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoad('users', true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (userRole) params.set('role', userRole);
      if (userSearch) params.set('search', userSearch);
      const r = await apiFetch(`/admin/users?${params}`);
      if (r.success) setUsers(r.data.users || []);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setLoad('users', false); }
  }, [userRole, userSearch]);

  const loadCerts = useCallback(async () => {
    setLoad('certs', true);
    try {
      const r = await apiFetch('/admin/certificates?limit=100');
      if (r.success) setCerts(r.data.certs || []);
    } catch { showToast('Failed to load certificates', 'error'); }
    finally { setLoad('certs', false); }
  }, []);

  const loadJobs = useCallback(async () => {
    setLoad('jobs', true);
    try {
      const r = await apiFetch('/admin/jobs?limit=100');
      if (r.success) setJobs(r.data.jobs || []);
    } catch { showToast('Failed to load jobs', 'error'); }
    finally { setLoad('jobs', false); }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoad('payments', true);
    try {
      const r = await apiFetch('/admin/payments');
      if (r.success) setPayments(r.data || []);
    } catch { showToast('Failed to load payments', 'error'); }
    finally { setLoad('payments', false); }
  }, []);

  const loadBilling = useCallback(async () => {
    try {
      const r = await apiFetch('/admin/settings/billing');
      if (r.success) setBillingEnabled(r.data.employer_billing_enabled);
    } catch {}
  }, []);

  useEffect(() => { loadStats(); loadBilling(); }, [loadStats, loadBilling]);

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'certificates') loadCerts();
    if (tab === 'jobs') loadJobs();
    if (tab === 'payments') loadPayments();
    if (tab === 'settings') loadBilling();
  }, [tab, loadUsers, loadCerts, loadJobs, loadPayments, loadBilling]);

  useEffect(() => {
    if (tab === 'users') loadUsers();
  }, [userRole, userSearch]);

  /* ── Actions ── */
  async function toggleBilling(v: boolean) {
    setBillingLoading(true);
    try {
      const r = await apiFetch('/admin/settings/billing', { method: 'PUT', body: JSON.stringify({ enabled: v }) });
      if (r.success) {
        setBillingEnabled(v);
        showToast(r.message ?? `Employer subscription ${v ? 'enabled' : 'disabled'}`, 'success');
      } else {
        showToast(r.message ?? 'Failed to update billing', 'error');
      }
    } catch (e: any) { showToast(e.message || 'Failed', 'error'); }
    finally { setBillingLoading(false); }
  }

  async function verifyCert(id: string) {
    setVerifyingCert(id);
    try {
      const r = await apiFetch(`/admin/certificates/${id}/verify`, { method: 'PUT' });
      if (r.success) { showToast('Certificate verified! +50 coins awarded', 'success'); loadCerts(); }
      else showToast(r.message ?? 'Failed', 'error');
    } catch (e: any) { showToast(e.message || 'Failed', 'error'); }
    finally { setVerifyingCert(null); }
  }

  async function deleteUser(id: string) {
    try {
      const r = await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      if (r.success) { showToast('User deleted', 'success'); loadUsers(); loadStats(); }
      else showToast(r.message ?? 'Failed', 'error');
    } catch (e: any) { showToast(e.message || 'Failed', 'error'); }
    finally { setDeleteModal(null); }
  }

  async function toggleJobStatus(job: Job) {
    const next = job.status === 'active' ? 'closed' : 'active';
    try {
      const r = await apiFetch(`/admin/jobs/${job.id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
      if (r.success) { showToast(`Job marked as ${next}`, 'success'); loadJobs(); }
      else showToast(r.message ?? 'Failed', 'error');
    } catch (e: any) { showToast(e.message || 'Failed', 'error'); }
  }

  async function toggleUserVerified(user: User) {
    try {
      const r = await apiFetch(`/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ verified: !user.verified }) });
      if (r.success) { showToast(`User ${!user.verified ? 'verified' : 'unverified'}`, 'success'); loadUsers(); }
      else showToast(r.message ?? 'Failed', 'error');
    } catch (e: any) { showToast(e.message || 'Failed', 'error'); }
  }

  /* ─── UI ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#080810] text-white font-[DM_Sans,sans-serif] flex">

      {/* ── Sidebar ── */}
      <aside className="w-[220px] flex-shrink-0 border-r border-[#13131f] flex flex-col pt-0 sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-[#13131f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#5b4cf5] grid place-items-center">
              <i className="fas fa-shield-halved text-white text-sm" />
            </div>
            <div>
              <div className="font-syne font-bold text-[13px] text-white">Admin</div>
              <div className="text-[10px] text-[#3a3a55]">SkillHub Pro</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium mb-0.5 border-0 cursor-pointer transition-all text-left ${tab === n.id ? 'bg-[#5b4cf5]/15 text-[#7c6ff7] font-semibold' : 'bg-transparent text-[#4a4a65] hover:text-white hover:bg-[#13131f]'}`}>
              <i className={`fas ${n.icon} w-4 text-center`} style={{ color: tab === n.id ? '#5b4cf5' : undefined }} />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-5">
          <a href="/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-medium border-0 cursor-pointer text-[#3a3a55] hover:text-white hover:bg-[#13131f] transition-all no-underline">
            <i className="fas fa-arrow-left w-4 text-center" />Back to App
          </a>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 overflow-auto">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold border backdrop-blur-sm animate-[fadeUp_0.2s_ease] ${
            toast.type === 'error'   ? 'bg-[#1a0a0a] border-[#3d1010] text-[#f87171]' :
            toast.type === 'info'   ? 'bg-[#0d0d1a] border-[#2a2a50] text-[#a78bfa]' :
                                      'bg-[#0a1a12] border-[#103d20] text-[#4ade80]'}`}>
            <i className={`fas ${toast.type === 'error' ? 'fa-xmark-circle' : toast.type === 'info' ? 'fa-info-circle' : 'fa-check-circle'}`} />
            {toast.msg}
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#ef4444]/10 grid place-items-center text-2xl mx-auto mb-4">
                <i className="fas fa-triangle-exclamation text-[#ef4444]" />
              </div>
              <h3 className="font-syne font-bold text-lg text-white text-center mb-1">Delete User</h3>
              <p className="text-sm text-[#6b6b8a] text-center mb-6">This will permanently delete <span className="text-white font-semibold">{deleteModal.name}</span> and all their data.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#1e1e2e] text-sm font-semibold text-[#6b6b8a] bg-transparent cursor-pointer hover:border-[#2a2a40] transition-all">Cancel</button>
                <button onClick={() => deleteUser(deleteModal.id)} className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-semibold border-0 cursor-pointer hover:bg-[#dc2626] transition-all">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Page header ── */}
        <div className="border-b border-[#13131f] px-8 py-5 flex items-center justify-between sticky top-0 bg-[#080810]/95 backdrop-blur-md z-30">
          <div>
            <h1 className="font-syne font-bold text-xl text-white capitalize">{NAV.find(n => n.id === tab)?.label}</h1>
            <p className="text-[12px] text-[#3a3a55] mt-0.5">SkillHub Pro · Admin Panel</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0d0d18] border border-[#1e1e2e] px-3 py-1.5 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#4a4a65]">System live</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-7">

          {/* ══════════════ OVERVIEW ══════════════ */}
          {tab === 'overview' && (
            <div>
              {/* Quick billing banner on overview */}
              {billingEnabled !== null && (
                <div className={`mb-6 rounded-2xl border p-4 flex items-center gap-4 ${billingEnabled ? 'bg-[#5b4cf5]/08 border-[#5b4cf5]/25' : 'bg-[#0d0d18] border-[#1e1e2e]'}`}>
                  <div className={`w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 ${billingEnabled ? 'bg-[#5b4cf5] shadow-[0_0_20px_rgba(91,76,245,0.4)]' : 'bg-[#1e1e2e]'}`}>
                    <i className={`fas fa-toggle-${billingEnabled ? 'on' : 'off'} text-sm ${billingEnabled ? 'text-white' : 'text-[#4a4a65]'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-white">Employer Subscription</div>
                    <div className="text-[11px] text-[#4a4a65] mt-0.5">
                      {billingEnabled ? 'Currently required for employer access.' : 'Currently FREE — employers get full access without paying.'}
                    </div>
                  </div>
                  <Toggle on={billingEnabled} onChange={toggleBilling} loading={billingLoading} />
                </div>
              )}

              {loading.stats ? (
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {[...Array(8)].map((_, i) => <div key={i} className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl p-5 h-28"><Sk h="h-8 mb-3" /><Sk h="h-5 w-2/3" /></div>)}
                </div>
              ) : stats && (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <StatCard icon="fa-users" label="Total Users" value={fmt(stats.users.total)} sub={`${fmt(stats.users.students)} students`} accent="#5b4cf5" />
                    <StatCard icon="fa-user-tie" label="Employers" value={fmt(stats.users.employers)} sub="registered" accent="#f59e0b" />
                    <StatCard icon="fa-briefcase" label="Active Jobs" value={fmt(stats.jobs.active)} sub={`${fmt(stats.jobs.total)} total`} accent="#10b981" />
                    <StatCard icon="fa-paper-plane" label="Applications" value={fmt(stats.jobs.totalApplications)} sub="all time" accent="#3b82f6" />
                    <StatCard icon="fa-book-open" label="Courses" value={fmt(stats.courses.total)} sub="available" accent="#ec4899" />
                    <StatCard icon="fa-certificate" label="Certificates" value={fmt(stats.certificates.total)} sub={`${fmt(stats.certificates.pending)} pending`} accent="#f59e0b" />
                    <StatCard icon="fa-coins" label="Revenue" value={`₦${fmt(stats.revenue.totalRevenue)}`} sub={`${fmt(stats.revenue.totalPayments)} payments`} accent="#10b981" />
                    <StatCard icon="fa-chalkboard-user" label="Instructors" value={fmt(stats.users.instructors)} sub="registered" accent="#a78bfa" />
                  </div>

                  {/* User breakdown bar */}
                  <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl p-6 mb-6">
                    <div className="text-[13px] font-semibold text-white mb-4">User Breakdown</div>
                    <div className="flex gap-3 mb-4">
                      {[
                        { label: 'Students', count: stats.users.students, color: '#5b4cf5' },
                        { label: 'Employers', count: stats.users.employers, color: '#f59e0b' },
                        { label: 'Instructors', count: stats.users.instructors, color: '#10b981' },
                      ].map(s => (
                        <div key={s.label} className="flex-1 rounded-xl p-4" style={{ background: s.color + '0f', border: `1px solid ${s.color}25` }}>
                          <div className="font-syne font-bold text-2xl mb-0.5" style={{ color: s.color }}>{fmt(s.count)}</div>
                          <div className="text-[11px] text-[#4a4a65]">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex rounded-full overflow-hidden h-2.5 gap-0.5">
                      {stats.users.total > 0 && [
                        { c: stats.users.students, color: '#5b4cf5' },
                        { c: stats.users.employers, color: '#f59e0b' },
                        { c: stats.users.instructors, color: '#10b981' },
                      ].map((s, i) => (
                        <div key={i} className="transition-all duration-700 rounded-full"
                          style={{ width: `${(s.c / stats.users.total) * 100}%`, background: s.color }} />
                      ))}
                    </div>
                  </div>

                  {/* Cert + Jobs mini row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl p-6">
                      <div className="text-[13px] font-semibold text-white mb-4">Certificates</div>
                      <div className="space-y-3">
                        {[
                          { label: 'Verified', value: stats.certificates.verified, color: '#10b981' },
                          { label: 'Pending', value: stats.certificates.pending, color: '#f59e0b' },
                          { label: 'Total', value: stats.certificates.total, color: '#5b4cf5' },
                        ].map(s => (
                          <div key={s.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                              <span className="text-[12px] text-[#6b6b8a]">{s.label}</span>
                            </div>
                            <span className="font-syne font-bold text-sm" style={{ color: s.color }}>{fmt(s.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl p-6">
                      <div className="text-[13px] font-semibold text-white mb-4">Jobs Overview</div>
                      <div className="space-y-3">
                        {[
                          { label: 'Active', value: stats.jobs.active, color: '#10b981' },
                          { label: 'Total Posted', value: stats.jobs.total, color: '#5b4cf5' },
                          { label: 'Applications', value: stats.jobs.totalApplications, color: '#f59e0b' },
                        ].map(s => (
                          <div key={s.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                              <span className="text-[12px] text-[#6b6b8a]">{s.label}</span>
                            </div>
                            <span className="font-syne font-bold text-sm" style={{ color: s.color }}>{fmt(s.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════ USERS ══════════════ */}
          {tab === 'users' && (
            <div>
              {/* Filters */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a3a55] text-sm" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search users…"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0d0d18] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-[#3a3a55] outline-none focus:border-[#5b4cf5] transition-all font-[inherit]" />
                </div>
                <div className="flex gap-1.5">
                  {['', 'student', 'employer', 'instructor', 'admin'].map(r => (
                    <button key={r} onClick={() => setUserRole(r)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-0 cursor-pointer capitalize transition-all ${userRole === r ? 'bg-[#5b4cf5] text-white' : 'bg-[#0d0d18] border border-[#1e1e2e] text-[#4a4a65] hover:text-white hover:border-[#2a2a40]'}`}>
                      {r || 'All'}
                    </button>
                  ))}
                </div>
                <div className="ml-auto text-[12px] text-[#3a3a55]">{users.length} users</div>
              </div>

              {/* Table */}
              <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2e]">
                      {['User', 'Role', 'Coins', 'Verified', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-[#3a3a55] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading.users ? (
                      [...Array(8)].map((_, i) => (
                        <tr key={i} className="border-b border-[#13131f]">
                          {[...Array(6)].map((_, j) => (
                            <td key={j} className="px-5 py-4"><Sk h="h-4" w={j === 0 ? 'w-36' : 'w-16'} /></td>
                          ))}
                        </tr>
                      ))
                    ) : users.map(u => (
                      <tr key={u.id} className="border-b border-[#13131f] hover:bg-[#0a0a14] transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl grid place-items-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: avatarColor(u.firstName || u.email) }}>
                              {initials(u)}
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-white">{u.firstName} {u.lastName}</div>
                              <div className="text-[11px] text-[#3a3a55]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><Badge text={u.role} /></td>
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] font-semibold text-[#f59e0b]">
                            <i className="fas fa-coins mr-1 text-[10px]" />{fmt(u.meritCoins)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => toggleUserVerified(u)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border-0 cursor-pointer transition-all ${u.verified ? 'bg-[#10b981]/10 text-[#10b981] hover:bg-[#ef4444]/10 hover:text-[#ef4444]' : 'bg-[#1e1e2e] text-[#4a4a65] hover:bg-[#10b981]/10 hover:text-[#10b981]'}`}>
                            <i className={`fas ${u.verified ? 'fa-check-circle' : 'fa-circle-xmark'} text-[9px]`} />
                            {u.verified ? 'Verified' : 'Unverified'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-[#4a4a65]">{fmtDate(u.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => setDeleteModal({ id: u.id, name: `${u.firstName} ${u.lastName}` })}
                            className="w-7 h-7 rounded-lg bg-transparent border border-[#1e1e2e] text-[#3a3a55] text-xs cursor-pointer hover:bg-[#ef4444]/10 hover:text-[#ef4444] hover:border-[#ef4444]/30 transition-all grid place-items-center opacity-0 group-hover:opacity-100">
                            <i className="fas fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading.users && users.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-16 text-center text-[#3a3a55] text-sm">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════ JOBS ══════════════ */}
          {tab === 'jobs' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="text-[12px] text-[#3a3a55]">{jobs.length} jobs total</div>
              </div>
              <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2e]">
                      {['Title', 'Company', 'Type', 'Applications', 'Status', 'Posted', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-[#3a3a55] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading.jobs ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={i} className="border-b border-[#13131f]">
                          {[...Array(7)].map((_, j) => (
                            <td key={j} className="px-5 py-4"><Sk h="h-4" w="w-24" /></td>
                          ))}
                        </tr>
                      ))
                    ) : jobs.map(j => (
                      <tr key={j.id} className="border-b border-[#13131f] hover:bg-[#0a0a14] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="text-[13px] font-semibold text-white">{j.title}</div>
                          <div className="text-[11px] text-[#3a3a55]">{j.location}</div>
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-[#6b6b8a]">{j.company}</td>
                        <td className="px-5 py-3.5 text-[12px] text-[#4a4a65]">{j.type}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] font-semibold text-[#5b4cf5]">
                            <i className="fas fa-paper-plane mr-1 text-[10px]" />{j._count.applications}
                          </span>
                        </td>
                        <td className="px-5 py-3.5"><Badge text={j.status} /></td>
                        <td className="px-5 py-3.5 text-[12px] text-[#4a4a65]">{fmtDate(j.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => toggleJobStatus(j)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border-0 cursor-pointer transition-all ${j.status === 'active' ? 'bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20' : 'bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20'}`}>
                            {j.status === 'active' ? 'Close' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading.jobs && jobs.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-16 text-center text-[#3a3a55] text-sm">No jobs found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════ CERTIFICATES ══════════════ */}
          {tab === 'certificates' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="text-[12px] text-[#3a3a55]">{certs.length} certificates · {certs.filter(c => c.status === 'pending').length} pending</div>
              </div>
              <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2e]">
                      {['Certificate', 'User', 'Provider', 'Status', 'Submitted', 'Action'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-[#3a3a55] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading.certs ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={i} className="border-b border-[#13131f]">
                          {[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><Sk h="h-4" w="w-24" /></td>)}
                        </tr>
                      ))
                    ) : certs.map(c => (
                      <tr key={c.id} className="border-b border-[#13131f] hover:bg-[#0a0a14] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="text-[13px] font-semibold text-white">{c.title}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-[12px] font-semibold text-white">{c.user.firstName} {c.user.lastName}</div>
                          <div className="text-[11px] text-[#3a3a55]">{c.user.email}</div>
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-[#6b6b8a]">{c.provider}</td>
                        <td className="px-5 py-3.5"><Badge text={c.status} /></td>
                        <td className="px-5 py-3.5 text-[12px] text-[#4a4a65]">{fmtDate(c.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          {c.status === 'pending' ? (
                            <button onClick={() => verifyCert(c.id)} disabled={verifyingCert === c.id}
                              className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#5b4cf5] text-white border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all disabled:opacity-50">
                              {verifyingCert === c.id ? <><i className="fas fa-spinner fa-spin mr-1" />Verifying…</> : <><i className="fas fa-check mr-1" />Verify</>}
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#3a3a55]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!loading.certs && certs.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-16 text-center text-[#3a3a55] text-sm">No certificates found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════ PAYMENTS ══════════════ */}
          {tab === 'payments' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="text-[12px] text-[#3a3a55]">{payments.length} recent payments</div>
                <div className="font-syne font-bold text-lg text-[#10b981]">
                  ₦{fmt(payments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0) / 100)}
                  <span className="text-[12px] font-normal text-[#3a3a55] ml-1">total revenue</span>
                </div>
              </div>
              <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2e]">
                      {['User', 'Purpose', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-[#3a3a55] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading.payments ? (
                      [...Array(8)].map((_, i) => (
                        <tr key={i} className="border-b border-[#13131f]">
                          {[...Array(5)].map((_, j) => <td key={j} className="px-5 py-4"><Sk h="h-4" w="w-24" /></td>)}
                        </tr>
                      ))
                    ) : payments.map(p => (
                      <tr key={p.id} className="border-b border-[#13131f] hover:bg-[#0a0a14] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="text-[13px] font-semibold text-white">{p.user.firstName} {p.user.lastName}</div>
                          <div className="text-[11px] text-[#3a3a55]">{p.user.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] text-[#6b6b8a] capitalize">{p.purpose.replace('_', ' ')}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-syne font-bold text-[14px] text-white">₦{fmt(p.amount / 100)}</span>
                        </td>
                        <td className="px-5 py-3.5"><Badge text={p.status} /></td>
                        <td className="px-5 py-3.5 text-[12px] text-[#4a4a65]">{fmtDate(p.createdAt)}</td>
                      </tr>
                    ))}
                    {!loading.payments && payments.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-16 text-center text-[#3a3a55] text-sm">No payments found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════ SETTINGS ══════════════ */}
          {tab === 'settings' && (
            <div className="max-w-2xl">
              <div className="mb-2 text-[12px] text-[#3a3a55]">Manage platform-wide settings and feature flags.</div>

              {/* Billing Setting Card */}
              <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-[#1e1e2e] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#f59e0b]/10 grid place-items-center">
                    <i className="fas fa-credit-card text-[#f59e0b] text-sm" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-white">Subscription & Billing</div>
                    <div className="text-[11px] text-[#3a3a55]">Control employer access requirements</div>
                  </div>
                </div>
                <div className="p-6">
                  <div className={`rounded-xl p-5 border transition-all duration-500 ${billingEnabled ? 'bg-[#5b4cf5]/06 border-[#5b4cf5]/25' : 'bg-[#13131f] border-[#1e1e2e]'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-[14px] font-semibold text-white mb-1">Employer Subscription Required</div>
                        <div className="text-[12px] text-[#4a4a65] leading-relaxed">
                          {billingEnabled === null ? (
                            <Sk h="h-3" w="w-64" />
                          ) : billingEnabled ? (
                            'Employers must subscribe to access the platform. Billing is active.'
                          ) : (
                            'Subscription is currently disabled. Employers get full free access.'
                          )}
                        </div>
                      </div>
                      {billingEnabled !== null && (
                        <Toggle on={billingEnabled} onChange={toggleBilling} loading={billingLoading} />
                      )}
                    </div>

                    {/* Status pill */}
                    {billingEnabled !== null && (
                      <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11.5px] font-semibold ${billingEnabled ? 'bg-[#5b4cf5]/15 text-[#7c6ff7]' : 'bg-[#10b981]/10 text-[#10b981]'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${billingEnabled ? 'bg-[#5b4cf5] animate-pulse' : 'bg-[#10b981]'}`} />
                        {billingEnabled
                          ? 'Billing Active — employers must subscribe'
                          : 'Free Access — subscription not required'}
                      </div>
                    )}
                  </div>

                  {/* Plans info (read-only) */}
                  <div className="mt-5">
                    <div className="text-[12px] font-semibold text-[#3a3a55] uppercase tracking-widest mb-3">Configured Plans</div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'employer_monthly', label: 'Monthly Plan', icon: 'fa-calendar', note: 'Billed monthly' },
                        { key: 'employer_annual', label: 'Annual Plan', icon: 'fa-calendar-days', note: 'Billed yearly · best value' },
                      ].map(plan => (
                        <div key={plan.key} className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-4">
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-[#5b4cf5]/10 grid place-items-center">
                              <i className={`fas ${plan.icon} text-[#5b4cf5] text-[11px]`} />
                            </div>
                            <div className="text-[12px] font-semibold text-white">{plan.label}</div>
                          </div>
                          <div className="text-[11px] text-[#3a3a55]">{plan.note}</div>
                          <div className="mt-2 text-[10px] text-[#2a2a40] font-mono">{plan.key}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-[#0a0a14] border border-[#1e1e2e]">
                      <i className="fas fa-info-circle text-[#3a3a55] text-[11px] mt-0.5 flex-shrink-0" />
                      <div className="text-[11px] text-[#3a3a55] leading-relaxed">
                        Plan pricing and amounts are configured in your Paystack dashboard. Toggling billing above enables or disables the subscription gate — plan settings remain intact either way.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Placeholder cards for future settings */}
              <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-2xl overflow-hidden mt-4">
                <div className="px-6 py-4 border-b border-[#1e1e2e] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#5b4cf5]/10 grid place-items-center">
                    <i className="fas fa-certificate text-[#5b4cf5] text-sm" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-white">Certificate Rewards</div>
                    <div className="text-[11px] text-[#3a3a55]">Coins awarded per certificate verification</div>
                  </div>
                </div>
                <div className="px-6 py-5 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] text-white font-semibold">Reward per Verification</div>
                    <div className="text-[11px] text-[#3a3a55] mt-0.5">Each verified certificate awards 50 Merit Coins</div>
                  </div>
                  <div className="font-syne font-bold text-xl text-[#f59e0b]">50 <span className="text-[12px] font-normal text-[#3a3a55]">coins</span></div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
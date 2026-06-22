'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface JobScoutLead {
  id: string; title: string; company: string; location?: string;
  type?: string; salary?: string; description?: string;
  url: string; source: string; niche: string; skills: string[];
  postedAt?: string; fetchedAt: string;
}

interface Alert {
  id: string; sentAt: string; opened: boolean; applied: boolean;
  lead: JobScoutLead;
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SOURCE_META: Record<string, { icon: string; color: string }> = {
  linkedin:     { icon: '💼', color: '#0a66c2' },
  indeed:       { icon: '🔵', color: '#003a9b' },
  twitter:      { icon: '🐦', color: '#1da1f2' },
  glassdoor:    { icon: '🟢', color: '#0caa41' },
  company_site: { icon: '🏢', color: '#6366f1' },
  web:          { icon: '🌐', color: '#64748b' },
  other:        { icon: '🔍', color: '#94a3b8' },
};

const TYPE_COLORS: Record<string, string> = {
  'full-time': '#10b981', 'part-time': '#f59e0b',
  'remote': '#6366f1', 'contract': '#ec4899', 'internship': '#0ea5e9',
};

function JobCard({ alert, token, onUpdate }: { alert: Alert; token: string; onUpdate: () => void }) {
  const { lead } = alert;
  const [applying, setApplying] = useState(false);
  const src = SOURCE_META[lead.source] || SOURCE_META['other'];

  const markOpened = useCallback(async () => {
    if (alert.opened) return;
    await fetch(`${API}/api/v1/job-scout/alerts/${alert.id}/open`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    onUpdate();
  }, [alert.id, alert.opened, token, onUpdate]);

  const markApplied = async () => {
    setApplying(true);
    await fetch(`${API}/api/v1/job-scout/alerts/${alert.id}/applied`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    onUpdate();
    setApplying(false);
  };

  const handleViewJob = () => {
    markOpened();
    window.open(lead.url, '_blank', 'noreferrer');
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 20,
      border: `1px solid ${alert.opened ? '#e2e8f0' : '#c7d2fe'}`,
      borderLeft: `4px solid ${alert.opened ? '#e2e8f0' : '#6366f1'}`,
      transition: 'all 0.15s', position: 'relative',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      {/* Unread dot */}
      {!alert.opened && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 10, height: 10, borderRadius: '50%', background: '#6366f1',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: `${src.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
        }}>{src.icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
            {lead.title}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: '#475569', fontWeight: 600 }}>
            {lead.company}
          </p>
        </div>
      </div>

      {/* Meta badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {lead.location && (
          <span style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '3px 10px', borderRadius: 10 }}>
            📍 {lead.location}
          </span>
        )}
        {lead.type && (
          <span style={{
            fontSize: 12, color: '#fff', fontWeight: 700,
            background: TYPE_COLORS[lead.type] || '#64748b',
            padding: '3px 10px', borderRadius: 10,
          }}>{lead.type}</span>
        )}
        {lead.salary && (
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700, background: '#f0fdf4', padding: '3px 10px', borderRadius: 10 }}>
            💰 {lead.salary}
          </span>
        )}
        <span style={{ fontSize: 12, color: src.color, background: `${src.color}15`, padding: '3px 10px', borderRadius: 10 }}>
          {src.icon} {lead.source.replace('_', ' ')}
        </span>
      </div>

      {/* Description */}
      {lead.description && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          {lead.description.slice(0, 200)}{lead.description.length > 200 ? '…' : ''}
        </p>
      )}

      {/* Skills */}
      {lead.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {lead.skills.slice(0, 8).map(skill => (
            <span key={skill} style={{ fontSize: 11, color: '#6366f1', background: '#ede9fe', padding: '2px 9px', borderRadius: 8 }}>
              {skill}
            </span>
          ))}
          {lead.skills.length > 8 && (
            <span style={{ fontSize: 11, color: '#94a3b8', padding: '2px 9px' }}>+{lead.skills.length - 8} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {lead.postedAt ? `Posted ${timeAgo(lead.postedAt)} · ` : ''}Scouted {timeAgo(alert.sentAt)}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {alert.applied ? (
            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>✅ Applied</span>
          ) : (
            <button onClick={markApplied} disabled={applying} style={{
              padding: '7px 16px', borderRadius: 10, border: '1px solid #e2e8f0',
              background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>{applying ? '…' : '✓ Mark Applied'}</button>
          )}
          <button onClick={handleViewJob} style={{
            padding: '7px 18px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}>View Job →</button>
        </div>
      </div>
    </div>
  );
}

export default function JobScoutPage() {
  const [token, setToken]       = useState('');
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);
  const [unread, setUnread]     = useState(0);
  const [total, setTotal]       = useState(0);
  const [filter, setFilter]     = useState<'all' | 'unread' | 'applied'>('all');
  const loaderRef               = useRef<HTMLDivElement>(null);
  const key                     = useRef(0);

  useEffect(() => {
    const t = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
    setToken(t);
  }, []);

  const fetchAlerts = useCallback(async (p: number) => {
    if (!token) return;
    try {
      const resp = await fetch(`${API}/api/v1/job-scout/my-alerts?page=${p}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (data.success) {
        setAlerts(prev => p === 1 ? data.data.alerts : [...prev, ...data.data.alerts]);
        setHasMore(p < data.data.pages);
        setUnread(data.data.unread);
        setTotal(data.data.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { if (token) { setPage(1); setAlerts([]); setLoading(true); fetchAlerts(1); } }, [token, fetchAlerts]);
  useEffect(() => { if (page > 1) fetchAlerts(page); }, [page, fetchAlerts]);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) setPage(p => p + 1);
    }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading]);

  const refresh = () => { key.current++; setPage(1); setAlerts([]); setLoading(true); fetchAlerts(1); };

  const filtered = filter === 'all' ? alerts
    : filter === 'unread' ? alerts.filter(a => !a.opened)
    : alerts.filter(a => a.applied);

  if (!token) return <div style={{ padding: 40, color: '#94a3b8', textAlign: 'center' }}>Loading…</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: 0 }}>🔍 Job Scout</h1>
            {unread > 0 && (
              <span style={{ background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, padding: '3px 12px', borderRadius: 20 }}>
                {unread} new
              </span>
            )}
          </div>
          <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>
            AI-curated job alerts matched to your niche — discovered daily from LinkedIn, Indeed, Twitter, and more.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { icon: '📬', label: 'Total Alerts', value: total, color: '#6366f1' },
            { icon: '🔔', label: 'Unread', value: unread, color: '#f59e0b' },
            { icon: '✅', label: 'Applied', value: alerts.filter(a => a.applied).length, color: '#10b981' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 14, padding: '14px 20px',
              border: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center', flex: '1 1 130px',
            }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {(['all', 'unread', 'applied'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: filter === f ? '#fff' : 'transparent',
              color: filter === f ? '#6366f1' : '#64748b',
              fontWeight: filter === f ? 700 : 500, fontSize: 14,
              boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              textTransform: 'capitalize',
            }}>{f}</button>
          ))}
        </div>

        {/* How it works banner (empty state) */}
        {!loading && total === 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #6366f115, #8b5cf615)',
            border: '1px solid #6366f130', borderRadius: 20, padding: 32, textAlign: 'center',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🤖</div>
            <h3 style={{ color: '#4338ca', fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>
              Job Scout is warming up…
            </h3>
            <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 20px', lineHeight: 1.6 }}>
              Our AI agent scans LinkedIn, Indeed, Twitter, and company career pages daily
              to find jobs matching your niche. Make sure your <strong>Interest Niche</strong> is
              set in your profile settings — the AI targets jobs specifically for your field.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['1️⃣ Set your niche in Settings', '2️⃣ AI scans job boards daily', '3️⃣ Get matched alerts here', '4️⃣ Apply with one click'].map(s => (
                <span key={s} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 10, fontSize: 13, color: '#475569' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading your job alerts…</div>}

        {!loading && filtered.length === 0 && total > 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            No {filter} alerts. <button onClick={() => setFilter('all')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 700 }}>View all</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(alert => (
            <JobCard key={alert.id} alert={alert} token={token} onUpdate={refresh} />
          ))}
        </div>

        <div ref={loaderRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!hasMore && total > 0 && <span style={{ color: '#94a3b8', fontSize: 13 }}>You've seen all alerts 🎉</span>}
        </div>
      </div>
    </div>
  );
}

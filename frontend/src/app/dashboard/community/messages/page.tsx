'use client';

import { useState, useRef, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',             icon: 'fa-home',          label: 'Dashboard' },
  { href: '/dashboard/courses',     icon: 'fa-book-open',     label: 'Courses' },
  {
    icon: 'fa-sparkles',
    label: 'Next Generation',
    children: [
      { href: '/dashboard/career-oracle',   icon: 'fa-brain',               label: 'Career Oracle' },
      { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',         label: 'Skill Coach' },
      { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',          label: 'Skill Decay' },
      { href: '/dashboard/peer-genome',     icon: 'fa-users',               label: 'Peer Genome' },
      { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles', label: 'Ghost Recruiter' },
    ],
  },
  { href: '/dashboard/community',   icon: 'fa-users',         label: 'Community' },
  { href: '/dashboard/portfolio',   icon: 'fa-layer-group',   label: 'Portfolio' },
  { href: '/dashboard/resume',        icon: 'fa-file-lines',           label: 'Resume' },
  { href: '/dashboard/platforms',   icon: 'fa-graduation-cap',label: 'Learning Platforms' },
  { href: '/dashboard/jobs',        icon: 'fa-briefcase',     label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate',   label: 'Certificates' },
  { href: '/dashboard/rewards',     icon: 'fa-coins',         label: 'Rewards' },
  { href: '/dashboard/settings',    icon: 'fa-gear',          label: 'Settings' },
];


/* ── Design tokens (matches all other dashboard pages) ─────────────────── */
const D = {
  bg:      '#080E19',
  card:    '#0F1521',
  card2:   '#0D1525',
  border:  'rgba(255,255,255,0.07)',
  accent:  '#4F8EF7',
  green:   '#00E5A0',
  amber:   '#F59E0B',
  red:     '#F87171',
  purple:  '#A78BFA',
  text:    'rgba(255,255,255,0.85)',
  subtext: 'rgba(255,255,255,0.45)',
  muted:   'rgba(255,255,255,0.25)',
  input:   'rgba(255,255,255,0.06)',
  hover:   'rgba(255,255,255,0.04)',
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)    return 'Now';
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function Avatar({ user, size = 36 }: { user: any; size?: number }) {
  const name     = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const palette  = [D.accent, D.green, D.amber, '#38BDF8', D.red, D.purple];
  const color    = palette[(initials.charCodeAt(0) || 0) % palette.length];
  const style    = { width: size, height: size, borderRadius: '50%', flexShrink: 0 as const };

  if (user?.avatar) {
    return <img src={user.avatar} alt={name} style={{ ...style, objectFit: 'cover' as const, border: `2px solid ${D.border}` }} />;
  }
  return (
    <div style={{ ...style, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.33 }}>
      {initials}
    </div>
  );
}

function OnlineDot({ online }: { online: boolean }) {
  return (
    <div style={{
      position: 'absolute', bottom: -1, right: -1,
      width: 10, height: 10, borderRadius: '50%',
      background: online ? D.green : 'rgba(255,255,255,0.2)',
      border: `2px solid #0F1521`,
    }} />
  );
}

export default function MessagesPage() {
  const [contacts,        setContacts]        = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [activeContact,   setActiveContact]   = useState<any | null>(null);
  const [messages,        setMessages]        = useState<Record<string, any[]>>({});
  const [text,            setText]            = useState('');
  const [status,          setStatus]          = useState('');
  const [isSending,       setIsSending]       = useState(false);
  const [search,          setSearch]          = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingContacts(true);
    apiFetch('/community/contacts')
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setContacts(res.data);
          if (res.data.length > 0) setActiveContact(res.data[0]);
        }
      })
      .catch(e => console.error('Failed to load contacts', e))
      .finally(() => setLoadingContacts(false));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeContact, messages]);

  const filtered = contacts.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  async function sendMessage() {
    if (!activeContact) return;
    const trimmed = text.trim(); if (!trimmed) return;

    const newMsg = { id: `m${Date.now()}`, from: 'me', text: trimmed, time: new Date().toISOString() };
    setMessages(prev => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), newMsg] }));
    setText(''); setIsSending(true); setStatus('Sending…');

    try {
      const res = await apiFetch('/community/messages', { method: 'POST', body: JSON.stringify({ recipientId: activeContact.id, message: trimmed }) });
      if (!res.success) throw new Error(res.message || 'Send failed');

      if (!res.data?.online) {
        setMessages(prev => ({
          ...prev,
          [activeContact.id]: [...(prev[activeContact.id] || []), { id: `sys-${Date.now()}`, from: 'system', text: 'Recipient is offline. Your message was delivered as a notification.', time: new Date().toISOString() }],
        }));
        setStatus('Delivered as notification');
      } else {
        setStatus('Delivered');
      }
    } catch (err: any) {
      setStatus(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
      setTimeout(() => setStatus(''), 4000);
    }
  }

  const currentMessages = activeContact ? (messages[activeContact.id] || []) : [];

  /* ── Shared input style ─────────────────────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    background: D.input, border: `1px solid ${D.border}`, borderRadius: 12,
    padding: '9px 14px', fontSize: 13, color: D.text, outline: 'none',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  };

  return (
    <SidebarLayout navItems={navItems} pageTitle="Messages">
      <div style={{ color: D.text }}>

        {/* ── Breadcrumb ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Link href="/dashboard/community"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: D.subtext, textDecoration: 'none', fontWeight: 600 }}
            onMouseEnter={e => (e.currentTarget.style.color = D.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = D.subtext)}>
            <i className="fas fa-arrow-left" style={{ fontSize: 11 }} /> Back to Community
          </Link>
          <span style={{ color: D.border }}>·</span>
          <h1 style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontWeight: 800, fontSize: 18, margin: 0, color: '#fff' }}>Messages</h1>
        </div>

        {/* ── Main panel ───────────────────────────────────────────────── */}
        <div style={{
          background: D.card, border: `1px solid ${D.border}`, borderRadius: 20,
          overflow: 'hidden', height: 'calc(100vh - 200px)', minHeight: 520,
          display: 'flex',
        }}>

          {/* ── Contacts sidebar ──────────────────────────────────────── */}
          <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column' }}>

            {/* Search */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${D.border}` }}>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: D.muted }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  style={{ ...inputStyle, paddingLeft: 32 }}
                />
              </div>
            </div>

            {/* Contact list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingContacts ? (
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ height: 68, borderRadius: 14, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: D.subtext }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: D.text, marginBottom: 8 }}>No contacts yet</div>
                  <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>Visit the community feed to start a conversation with active members.</p>
                  <Link href="/dashboard/community"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: D.accent, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    <i className="fas fa-users" /> Browse community
                  </Link>
                </div>
              ) : filtered.map(contact => {
                const isActive = activeContact?.id === contact.id;
                return (
                  <button key={contact.id} onClick={() => setActiveContact(contact)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: isActive ? `${D.accent}12` : 'transparent',
                      borderLeft: isActive ? `3px solid ${D.accent}` : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = D.hover; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar user={contact} size={38} />
                      <OnlineDot online={contact.online} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? D.accent : D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contact.firstName} {contact.lastName}
                        </span>
                        <span style={{ fontSize: 10.5, color: D.muted, flexShrink: 0, marginLeft: 6 }}>{timeAgo(contact.lastTime)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: 11.5, color: D.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.lastMessage}</span>
                        {contact.unread > 0 && (
                          <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: '50%', background: D.accent, color: '#fff', fontSize: 9, fontWeight: 700, display: 'grid', placeItems: 'center' }}>
                            {contact.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chat window ───────────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {activeContact ? (
              <>
                {/* Chat header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar user={activeContact} size={38} />
                    <OnlineDot online={activeContact.online} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{activeContact.firstName} {activeContact.lastName}</div>
                    <div style={{ fontSize: 11.5, color: D.subtext, marginTop: 1 }}>
                      {activeContact.online
                        ? <><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: D.green, marginRight: 5 }} />Active now</>
                        : activeContact.title || 'Offline'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ icon: 'fa-phone' }, { icon: 'fa-video' }, { icon: 'fa-ellipsis-v' }].map(btn => (
                      <button key={btn.icon}
                        style={{ width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: D.input, color: D.subtext, display: 'grid', placeItems: 'center', fontSize: 12, transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${D.accent}20`; (e.currentTarget as HTMLButtonElement).style.color = D.accent; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = D.input; (e.currentTarget as HTMLButtonElement).style.color = D.subtext; }}>
                        <i className={`fas ${btn.icon}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: D.card2 }}>
                  <div style={{ textAlign: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, color: D.muted, background: D.input, padding: '3px 12px', borderRadius: 20, display: 'inline-block' }}>Today</span>
                  </div>

                  {currentMessages.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: D.muted }}>
                      <div style={{ fontSize: 40 }}>💬</div>
                      <p style={{ fontSize: 13, margin: 0 }}>No messages yet. Say hello!</p>
                    </div>
                  )}

                  {currentMessages.map((msg, i) => {
                    const isMe     = msg.from === 'me';
                    const isSystem = msg.from === 'system';
                    const showAvatar = !isMe && !isSystem && (i === 0 || currentMessages[i - 1]?.from === 'me');

                    if (isSystem) {
                      return (
                        <div key={msg.id} style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: 11, color: D.muted, background: D.input, padding: '4px 14px', borderRadius: 20, display: 'inline-block' }}>
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                        {!isMe && (
                          <div style={{ flexShrink: 0, width: 28 }}>
                            {showAvatar && <Avatar user={activeContact} size={28} />}
                          </div>
                        )}
                        <div style={{ maxWidth: '65%' }}>
                          <div style={{
                            padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            fontSize: 13, lineHeight: 1.55,
                            background: isMe ? D.accent : D.card,
                            color: isMe ? '#fff' : D.text,
                            border: isMe ? 'none' : `1px solid ${D.border}`,
                            boxShadow: isMe ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
                          }}>
                            {msg.text}
                          </div>
                          <div style={{ fontSize: 10, marginTop: 4, color: D.muted, textAlign: isMe ? 'right' : 'left' }}>
                            {timeAgo(msg.time)}
                            {isMe && <i className="fas fa-check-double" style={{ marginLeft: 5, color: D.accent, fontSize: 10 }} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderTop: `1px solid ${D.border}`, background: D.card, flexShrink: 0 }}>
                  {[{ icon: 'fa-image' }, { icon: 'fa-smile' }].map(btn => (
                    <button key={btn.icon}
                      style={{ width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', background: D.input, color: D.muted, display: 'grid', placeItems: 'center', fontSize: 13, flexShrink: 0, transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = D.accent; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = D.muted; }}>
                      <i className={`fas ${btn.icon}`} />
                    </button>
                  ))}
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={`Message ${activeContact.firstName}…`}
                    style={{ ...inputStyle, flex: 1, width: 'auto' }}
                  />
                  <button onClick={sendMessage} disabled={!text.trim() || isSending}
                    style={{
                      width: 34, height: 34, borderRadius: 10, border: 'none', cursor: !text.trim() || isSending ? 'not-allowed' : 'pointer',
                      background: D.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0,
                      opacity: !text.trim() || isSending ? 0.5 : 1, transition: 'opacity 0.15s',
                    }}>
                    <i className="fas fa-paper-plane" style={{ fontSize: 12 }} />
                  </button>
                </div>

                {/* Status line */}
                {status && (
                  <div style={{ padding: '6px 16px 10px', fontSize: 12, color: D.accent, background: D.card }}>{status}</div>
                )}
              </>
            ) : (
              /* Empty state */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `${D.accent}18`, display: 'grid', placeItems: 'center', marginBottom: 20, fontSize: 28 }}>
                  💬
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>No contact selected</div>
                <p style={{ fontSize: 13, color: D.subtext, maxWidth: 380, lineHeight: 1.6, margin: '0 0 24px' }}>
                  Select someone from the left to start a conversation, or browse the community to connect with active members.
                </p>
                <Link href="/dashboard/community"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, background: D.accent, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  <i className="fas fa-users" /> Browse community
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </SidebarLayout>
  );
}
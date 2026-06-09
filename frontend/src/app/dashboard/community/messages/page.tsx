'use client';

import { useState, useRef, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',              icon: 'fa-home',         label: 'Dashboard' },
  { href: '/dashboard/courses',      icon: 'fa-book-open',    label: 'Courses' },
  { href: '/dashboard/community',    icon: 'fa-users',        label: 'Community' },
  { href: '/dashboard/portfolio',    icon: 'fa-layer-group',  label: 'Portfolio' },
  { href: '/dashboard/platforms',    icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs',         icon: 'fa-briefcase',    label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate',  label: 'Certificates' },
  { href: '/dashboard/rewards',      icon: 'fa-coins',        label: 'Rewards' },
  { href: '/dashboard/settings',     icon: 'fa-gear',         label: 'Settings' },
];


function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)    return 'Now';
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function Avatar({ user, size = 10 }: { user: any; size?: number }) {
  const name     = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors   = ['#5b4cf5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];
  const color    = colors[(initials.charCodeAt(0) || 0) % colors.length];
  if (user?.avatar) {
    return <img src={user.avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0 border-2 border-white`} />;
  }
  return (
    <div className={`w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-bold text-white`} style={{ background: color, fontSize: size < 8 ? '10px' : '13px' }}>
      {initials}
    </div>
  );
}

export default function MessagesPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [activeContact, setActiveContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadContacts() {
      setLoadingContacts(true);
      try {
        const res = await apiFetch('/community/contacts');
        if (res.success && Array.isArray(res.data)) {
          setContacts(res.data);
          if (res.data.length > 0) {
            setActiveContact(res.data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load contacts', error);
      } finally {
        setLoadingContacts(false);
      }
    }

    loadContacts();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact, messages]);

  const filtered = contacts.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  async function sendMessage() {
    if (!activeContact) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const newMsg = { id: `m${Date.now()}`, from: 'me', text: trimmed, time: new Date().toISOString() };
    setMessages(prev => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg],
    }));
    setText('');
    setIsSending(true);
    setStatus('Sending message...');

    try {
      const res = await apiFetch('/community/messages', {
        method: 'POST',
        body: JSON.stringify({ recipientId: activeContact.id, message: trimmed }),
      });
      if (!res.success) throw new Error(res.message || 'Send failed');

      if (!res.data?.online) {
        setMessages(prev => ({
          ...prev,
          [activeContact.id]: [
            ...((prev[activeContact.id] || [])),
            {
              id: `sys-${Date.now()}`,
              from: 'system',
              text: 'Recipient is offline. Your message was delivered as a notification.',
              time: new Date().toISOString(),
            },
          ],
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

  const currentMessages = activeContact ? messages[activeContact.id] || [] : [];

  return (
    <SidebarLayout navItems={navItems} pageTitle="Messages">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/dashboard/community"
          className="flex items-center gap-2 text-[13px] text-[#6b6b8a] hover:text-[#5b4cf5] no-underline font-medium transition-colors">
          <i className="fas fa-arrow-left text-[11px]" />
          Back to Community
        </Link>
        <span className="text-[#e8e8f0]">·</span>
        <h1 className="font-syne font-bold text-[18px] text-[#0a0a0f]">Messages</h1>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-[280px] flex-shrink-0 border-r border-[#f0f0f8] flex flex-col max-md:hidden">
            <div className="p-3.5 border-b border-[#f0f0f8]">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#9898b8] text-[11px]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#e8e8f0] text-[12.5px] font-[inherit] bg-[#fafaff] outline-none focus:border-[#5b4cf5] transition-all"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingContacts ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4].map(index => (
                    <div key={index} className="h-20 rounded-2xl bg-[#f0f0f8] animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-[#6b6b8a]">
                  <div className="mb-3 text-[14px] font-semibold text-[#0a0a0f]">No message contacts yet</div>
                  <p className="mb-4">Visit the community feed to start a conversation with active members.</p>
                  <Link href="/dashboard/community" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5b4cf5] text-white text-[13px] font-semibold no-underline hover:bg-[#4a3de0] transition-all">
                    <i className="fas fa-users" /> Browse community
                  </Link>
                </div>
              ) : (
                filtered.map(contact => (
                  <button key={contact.id}
                    onClick={() => setActiveContact(contact)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 border-0 cursor-pointer text-left transition-all ${activeContact?.id === contact.id ? 'bg-[#f4f2ff]' : 'bg-transparent hover:bg-[#fafaff]'}`}>
                    <div className="relative flex-shrink-0">
                      <Avatar user={contact} size={10} />
                      {contact.online ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10b981] rounded-full border-2 border-white" />
                      ) : (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#c8c8d8] rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[13px] font-semibold truncate ${activeContact?.id === contact.id ? 'text-[#5b4cf5]' : 'text-[#0a0a0f]'}`}>
                          {contact.firstName} {contact.lastName}
                        </span>
                        <span className="text-[10.5px] text-[#c8c8d8] flex-shrink-0 ml-1">{timeAgo(contact.lastTime)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11.5px] text-[#9898b8] truncate">{contact.lastMessage}</span>
                        {contact.unread > 0 && (
                          <span className="ml-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#5b4cf5] text-white text-[9px] font-bold grid place-items-center">
                            {contact.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeContact ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f0f0f8] flex-shrink-0">
                  <div className="relative">
                    <Avatar user={activeContact} size={10} />
                    {activeContact.online ? (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10b981] rounded-full border-2 border-white" />
                    ) : (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#c8c8d8] rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[14px] text-[#0a0a0f]">{activeContact.firstName} {activeContact.lastName}</div>
                    <div className="text-[11.5px] text-[#9898b8]">
                      {activeContact.online
                        ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10b981] mr-1.5 mb-px" />Active now</>
                        : activeContact.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center hover:bg-[#f0f0f8] hover:text-[#5b4cf5] transition-all text-[12px]">
                      <i className="fas fa-phone" />
                    </button>
                    <button className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center hover:bg-[#f0f0f8] hover:text-[#5b4cf5] transition-all text-[12px]">
                      <i className="fas fa-video" />
                    </button>
                    <button className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center hover:bg-[#f0f0f8] transition-all text-[12px]">
                      <i className="fas fa-ellipsis-v" />
                    </button>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#fafaff]">
                  <div className="text-center text-[10.5px] text-[#c8c8d8] mb-2 bg-[#f0f0f8] inline-block px-3 py-1 rounded-full mx-auto block w-fit">Today</div>
                  {currentMessages.map((msg, i) => {
                    const isMe = msg.from === 'me';
                    const showAvatar = !isMe && (i === 0 || currentMessages[i - 1]?.from === 'me');
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2.5 items-end`}>
                        {!isMe && (
                          <div className="flex-shrink-0 w-8">
                            {showAvatar && <Avatar user={activeContact} size={8} />}
                          </div>
                        )}
                        <div className={`max-w-[65%] group`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${isMe ? 'bg-[#5b4cf5] text-white rounded-br-sm' : 'bg-white text-[#0a0a0f] border border-[#e8e8f0] rounded-bl-sm shadow-sm'}`}>
                            {msg.text}
                          </div>
                          <div className={`text-[10px] mt-1 ${isMe ? 'text-right text-[#c8c8d8]' : 'text-left text-[#c8c8d8]'}`}>
                            {timeAgo(msg.time)}
                            {isMe && <i className="fas fa-check-double ml-1 text-[#5b4cf5]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-t border-[#f0f0f8] bg-white flex-shrink-0">
                  <button className="w-9 h-9 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#9898b8] grid place-items-center hover:bg-[#f0f0f8] hover:text-[#5b4cf5] transition-all text-[13px] flex-shrink-0">
                    <i className="fas fa-image" />
                  </button>
                  <button className="w-9 h-9 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#9898b8] grid place-items-center hover:bg-[#f0f0f8] hover:text-[#5b4cf5] transition-all text-[13px] flex-shrink-0">
                    <i className="fas fa-smile" />
                  </button>
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={`Message ${activeContact.firstName}…`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#f5f5fb] border border-transparent text-[13px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:bg-white transition-all"
                  />
                  <button onClick={sendMessage} disabled={!text.trim() || isSending}
                    className="w-9 h-9 rounded-xl bg-[#5b4cf5] text-white border-0 cursor-pointer grid place-items-center hover:bg-[#4a3de0] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0">
                    <i className="fas fa-paper-plane text-[12px]" />
                  </button>
                </div>
                {status && (
                  <div className="px-5 pb-3 text-[12px] text-[#5b4cf5]">{status}</div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="text-[22px] font-semibold text-[#0a0a0f] mb-3">No contact selected</div>
                <p className="text-[13px] text-[#6b6b8a] max-w-lg mb-5">
                  Select someone from the left-hand list to start a conversation, or browse the community to connect with active members.
                </p>
                <Link href="/dashboard/community" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#5b4cf5] text-white text-[13px] font-semibold no-underline hover:bg-[#4a3de0] transition-all">
                  <i className="fas fa-users" /> Browse community
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

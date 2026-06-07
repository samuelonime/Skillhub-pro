'use client';

import { useState, useRef, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import Link from 'next/link';

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

const CONTACTS = [
  {
    id: 'u1',
    firstName: 'Amara', lastName: 'Osei',
    title: 'Full-Stack Developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amara&backgroundColor=b6e3f4',
    online: true,
    lastMessage: "Happy to share the code if you're interested!",
    lastTime: new Date(Date.now() - 1000*60*4).toISOString(),
    unread: 2,
  },
  {
    id: 'u2',
    firstName: 'Kemi', lastName: 'Adeyemi',
    title: 'Senior Frontend Engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kemi&backgroundColor=ffdfbf',
    online: true,
    lastMessage: "The real issue is skipping fundamentals entirely.",
    lastTime: new Date(Date.now() - 1000*60*60).toISOString(),
    unread: 0,
  },
  {
    id: 'u3',
    firstName: 'Chidi', lastName: 'Nwosu',
    title: 'Staff Engineer @ Flutterwave',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chidi&backgroundColor=c0aede',
    online: false,
    lastMessage: "Just dropped the guide. 200+ questions, all free!",
    lastTime: new Date(Date.now() - 1000*60*60*5).toISOString(),
    unread: 1,
  },
  {
    id: 'u4',
    firstName: 'Tolu', lastName: 'Bankole',
    title: 'Backend Developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tolu&backgroundColor=d1d4f9',
    online: false,
    lastMessage: "Kafka + Redis for a todo app 😂 I feel so seen",
    lastTime: new Date(Date.now() - 1000*60*60*8).toISOString(),
    unread: 0,
  },
  {
    id: 'u5',
    firstName: 'Ngozi', lastName: 'Eze',
    title: 'Open Source Maintainer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ngozi&backgroundColor=ffd5dc',
    online: true,
    lastMessage: "Would love a contribution if you're up for it 🙌",
    lastTime: new Date(Date.now() - 1000*60*60*12).toISOString(),
    unread: 0,
  },
];

const MESSAGES: Record<string, any[]> = {
  u1: [
    { id: 'm1', from: 'them', text: "Hey! Saw your post about the job board. The real-time alerts are impressive.", time: new Date(Date.now() - 1000*60*8).toISOString() },
    { id: 'm2', from: 'me',   text: "Thanks! It took a while to get SSE working right with Next.js App Router but it's solid now.", time: new Date(Date.now() - 1000*60*7).toISOString() },
    { id: 'm3', from: 'them', text: "Would you be open to doing a pair coding session sometime? I'm building something similar.", time: new Date(Date.now() - 1000*60*6).toISOString() },
    { id: 'm4', from: 'me',   text: "Absolutely! DM me your availability.", time: new Date(Date.now() - 1000*60*5).toISOString() },
    { id: 'm5', from: 'them', text: "Happy to share the code if you're interested!", time: new Date(Date.now() - 1000*60*4).toISOString() },
  ],
  u2: [
    { id: 'm1', from: 'them', text: "Loved your post on Tailwind. Sparked a great debate!", time: new Date(Date.now() - 1000*60*90).toISOString() },
    { id: 'm2', from: 'me',   text: "Haha yeah it got spicy fast 😄. Do you use Tailwind yourself?", time: new Date(Date.now() - 1000*60*85).toISOString() },
    { id: 'm3', from: 'them', text: "Yep, but I always teach vanilla CSS first. Tooling should come after fundamentals.", time: new Date(Date.now() - 1000*60*80).toISOString() },
    { id: 'm4', from: 'them', text: "The real issue is skipping fundamentals entirely.", time: new Date(Date.now() - 1000*60*60).toISOString() },
  ],
  u3: [
    { id: 'm1', from: 'them', text: "Just dropped the guide. 200+ questions, all free!", time: new Date(Date.now() - 1000*60*60*5).toISOString() },
    { id: 'm2', from: 'me',   text: "This is incredible Chidi, saving this immediately. Any plans for a part 2?", time: new Date(Date.now() - 1000*60*60*4).toISOString() },
  ],
  u4: [
    { id: 'm1', from: 'them', text: "Kafka + Redis for a todo app 😂 I feel so seen", time: new Date(Date.now() - 1000*60*60*8).toISOString() },
    { id: 'm2', from: 'me',   text: "It's a real problem lol. I need a 12 step program for over-engineering.", time: new Date(Date.now() - 1000*60*60*7).toISOString() },
  ],
  u5: [
    { id: 'm1', from: 'me',   text: "Congrats on 1k stars! Well deserved 🎉", time: new Date(Date.now() - 1000*60*60*13).toISOString() },
    { id: 'm2', from: 'them', text: "Thank you so much! Would love a contribution if you're up for it 🙌", time: new Date(Date.now() - 1000*60*60*12).toISOString() },
  ],
};

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
  const [activeContact, setActiveContact] = useState(CONTACTS[0]);
  const [messages, setMessages] = useState<Record<string, any[]>>(MESSAGES);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact, messages]);

  const filtered = CONTACTS.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  function sendMessage() {
    if (!text.trim()) return;
    const newMsg = { id: `m${Date.now()}`, from: 'me', text: text.trim(), time: new Date().toISOString() };
    setMessages(prev => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg],
    }));
    setText('');
    // Simulate reply
    setTimeout(() => {
      const replies = [
        "That's a great point! 🙌",
        "Totally agree with you there.",
        "Haha yeah exactly 😄",
        "Let me think about that...",
        "100%! We should hop on a call.",
      ];
      const reply = { id: `m${Date.now()}r`, from: 'them', text: replies[Math.floor(Math.random() * replies.length)], time: new Date().toISOString() };
      setMessages(prev => ({
        ...prev,
        [activeContact.id]: [...(prev[activeContact.id] || []), reply],
      }));
    }, 1200 + Math.random() * 800);
  }

  const currentMessages = messages[activeContact.id] || [];

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
              {filtered.map(contact => (
                <button key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-0 cursor-pointer text-left transition-all ${activeContact.id === contact.id ? 'bg-[#f4f2ff]' : 'bg-transparent hover:bg-[#fafaff]'}`}>
                  <div className="relative flex-shrink-0">
                    <Avatar user={contact} size={10} />
                    {contact.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10b981] rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[13px] font-semibold truncate ${activeContact.id === contact.id ? 'text-[#5b4cf5]' : 'text-[#0a0a0f]'}`}>
                        {contact.firstName} {contact.lastName}
                      </span>
                      <span className="text-[10.5px] text-[#c8c8d8] flex-shrink-0 ml-1">{timeAgo(contact.lastTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] text-[#9898b8] truncate">{contact.lastMessage}</span>
                      {contact.unread > 0 && (
                        <span className="ml-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#5b4cf5] text-white text-[9px] font-bold grid place-items-center">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f0f0f8] flex-shrink-0">
              <div className="relative">
                <Avatar user={activeContact} size={10} />
                {activeContact.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10b981] rounded-full border-2 border-white" />
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
              <button onClick={sendMessage} disabled={!text.trim()}
                className="w-9 h-9 rounded-xl bg-[#5b4cf5] text-white border-0 cursor-pointer grid place-items-center hover:bg-[#4a3de0] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0">
                <i className="fas fa-paper-plane text-[12px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

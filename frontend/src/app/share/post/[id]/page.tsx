/**
 * Public community share page — /share/post/[id]
 *
 * This is a SERVER component (no 'use client'), so Next.js renders real
 * <head> meta tags on the server. That is what social crawlers (Facebook,
 * WhatsApp, LinkedIn, X/Twitter, Slack, Telegram…) read to build a link
 * preview. The interactive page lives at /dashboard/community/post/[id]
 * behind the login wall — but the *preview* must be public, or crawlers
 * only ever see the login screen and the image never pulls.
 *
 * This is the route PostCard.tsx actually generates share links for
 * (`${origin}/share/post/${post.id}`) — see copyShareLink() / shareToSocial().
 *
 * Flow:
 *   1. Sharing a post pulls the post image + title + body (OG tags below).
 *   2. Anyone can SEE the full post on this page.
 *   3. Clicking "Log in to reply" sends them to /dashboard/... which the
 *      middleware guards → login is requested, then they land on the post.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 300; // crawlers get a fresh-enough cached copy

/* Base URLs -------------------------------------------------------------- */
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://skillhub.meritlives.com';

// Server-side calls go straight to the backend (same var next.config uses).
const BACKEND = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

/* Design tokens (match the dashboard) ------------------------------------ */
const D = {
  bg: '#080E19', card: '#0F1521', card2: '#0D1525',
  border: 'rgba(255,255,255,0.08)', accent: '#4F8EF7', brand: '#2563EB',
  green: '#00E5A0', amber: '#F59E0B', red: '#F87171', sky: '#38BDF8',
  text: 'rgba(255,255,255,0.88)', sub: 'rgba(255,255,255,0.5)', muted: 'rgba(255,255,255,0.3)',
};
const TYPE_COLORS: Record<string, string> = {
  discussion: D.accent, project: D.green, resource: D.sky, question: D.amber, showcase: D.red,
};

interface PublicPost {
  id: string; title: string; body: string; type: string; tags: string[];
  imageUrl: string | null; projectUrl: string | null;
  likes: number; views: number; commentCount: number; createdAt: string;
  author: { firstName: string; lastName: string; avatar: string | null; title: string | null };
}

/* Fetch the public post (no auth) ---------------------------------------- */
async function getPost(id: string): Promise<PublicPost | null> {
  try {
    const res = await fetch(`${BACKEND}/api/v1/community/public/${id}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? (json.data as PublicPost) : null;
  } catch {
    return null;
  }
}

/* Build a reliable raster OG image --------------------------------------- */
// SVGs and un-sized images render inconsistently on social platforms, so:
//  • Cloudinary image uploads → transform to a clean 1200×630 JPG card.
//  • Cloudinary video uploads → generate a 1200×630 JPG poster frame.
//  • Other raster URLs → use as-is.
//  • No image → branded default PNG.
function ogImage(imageUrl: string | null): string {
  if (!imageUrl) return `${SITE}/og-default.png`;

  if (imageUrl.includes('res.cloudinary.com')) {
    if (imageUrl.includes('/image/upload/')) {
      const [head, tail] = imageUrl.split('/image/upload/');
      return `${head}/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/${tail}`;
    }
    if (imageUrl.includes('/video/upload/')) {
      // First-frame poster as a static JPG (valid og:image; videos are not).
      const [head, tail] = imageUrl.split('/video/upload/');
      const poster = tail.replace(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, '.jpg');
      return `${head}/video/upload/so_0,c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/${poster}`;
    }
  }
  return imageUrl;
}

function excerpt(body: string, max = 200): string {
  const clean = (body || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/* ── SEO / social metadata (what crawlers read) ─────────────────────────── */
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      metadataBase: new URL(SITE),
      title: 'Post not found · SkillHub Community',
      description: 'This community post is no longer available.',
    };
  }

  const authorName = `${post.author.firstName} ${post.author.lastName}`.trim();
  const title = `${post.title} · SkillHub Community`;
  const description = excerpt(post.body) || `A ${post.type} shared by ${authorName} on SkillHub.`;
  const image = ogImage(post.imageUrl);
  const url = `${SITE}/share/post/${post.id}`;

  return {
    metadataBase: new URL(SITE),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: 'SkillHub',
      title: post.title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      authors: [authorName],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [image],
    },
  };
}

/* ── Visible public page ────────────────────────────────────────────────── */
export default async function SharedCommunityPostPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await getPost(id);
  const loginTarget = `/dashboard/community/post/${id}`; // middleware requests login, then lands here

  const shell: React.CSSProperties = {
    minHeight: '100vh', background: D.bg, color: D.text,
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '32px 20px 64px',
  };

  if (!post) {
    return (
      <main style={shell}>
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center', marginTop: 80 }}>
          <BrandHeader />
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: 40, marginTop: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Post not found</h1>
            <p style={{ color: D.sub, fontSize: 14, margin: '0 0 24px' }}>
              This community post may have been removed or the link is incorrect.
            </p>
            <Link href={SITE} style={btnPrimary}>Explore SkillHub</Link>
          </div>
        </div>
      </main>
    );
  }

  const authorName = `${post.author.firstName} ${post.author.lastName}`.trim();
  const initials = authorName.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';
  const typeColor = TYPE_COLORS[post.type] || D.accent;
  const displayImage = post.imageUrl ? ogImage(post.imageUrl) : null;

  return (
    <main style={shell}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        <BrandHeader />

        <article style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 22, overflow: 'hidden', marginTop: 24 }}>
          {/* Post image (the thing that now pulls into every share preview) */}
          {displayImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={displayImage}
              alt={post.title}
              style={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block', borderBottom: `1px solid ${D.border}` }}
            />
          )}

          <div style={{ padding: 28 }}>
            {/* Author + type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              {post.author.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={post.author.avatar} alt={authorName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: D.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                  {initials}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{authorName}</div>
                {post.author.title && <div style={{ fontSize: 12, color: D.sub }}>{post.author.title}</div>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}30`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {post.type}
              </span>
            </div>

            {/* Title + body */}
            <h1 style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontWeight: 800, fontSize: 24, color: '#fff', margin: '0 0 14px', lineHeight: 1.25 }}>
              {post.title}
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: D.text, whiteSpace: 'pre-line', margin: 0 }}>{post.body}</p>

            {/* Project link */}
            {post.projectUrl && (
              <a href={post.projectUrl} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, color: D.sky, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                🔗 {post.projectUrl.replace(/^https?:\/\//, '')}
              </a>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
                {post.tags.map(t => (
                  <span key={t} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: `${D.accent}12`, color: D.accent }}>#{t}</span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22, paddingTop: 18, borderTop: `1px solid ${D.border}` }}>
              {[
                { icon: '👁', val: `${post.views} views` },
                { icon: '💬', val: `${post.commentCount} replies` },
                { icon: '❤️', val: `${post.likes} likes` },
              ].map(s => (
                <span key={s.val} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: D.sub }}>
                  {s.icon} {s.val}
                </span>
              ))}
            </div>
          </div>

          {/* Login CTA — clicking asks for login, then lands on the full post */}
          <div style={{ background: D.card2, borderTop: `1px solid ${D.border}`, padding: '22px 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Join the discussion</div>
              <div style={{ fontSize: 12.5, color: D.sub, marginTop: 2 }}>Log in to like, comment and reply on SkillHub.</div>
            </div>
            <Link href={loginTarget} style={btnPrimary}>Log in to reply →</Link>
          </div>
        </article>

        <p style={{ textAlign: 'center', fontSize: 12, color: D.muted, marginTop: 20 }}>
          A community post on <Link href={SITE} style={{ color: D.accent, textDecoration: 'none' }}>SkillHub</Link> — the workforce platform for African tech talent.
        </p>
      </div>
    </main>
  );
}

/* ── Small server-rendered pieces ───────────────────────────────────────── */
function BrandHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: D.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22 }}>S</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', lineHeight: 1 }}>SkillHub</div>
        <div style={{ fontSize: 11, color: D.brand, fontWeight: 600 }}>Community</div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '11px 22px', borderRadius: 12, background: D.brand, color: '#fff',
  fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
};
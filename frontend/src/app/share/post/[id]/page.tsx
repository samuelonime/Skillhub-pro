import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

async function getPublicPost(id: string) {
  try {
    const backend = process.env.BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backend}/api/v1/community/public/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPost(id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  if (!post) {
    return { title: 'Skillhub Community', description: 'Join the Skillhub community.' };
  }

  const title = post.title;
  const description = (post.body || '').slice(0, 160);
  const image = post.imageUrl || `${appUrl}/og-default.png`;
  const url = `${appUrl}/share/post/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      publishedTime: post.createdAt,
      authors: [
        `${post.author?.firstName ?? ''} ${post.author?.lastName ?? ''}`.trim(),
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharePostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPublicPost(id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const loginUrl = `${appUrl}/login?next=/dashboard/community/post/${id}`;
  const dashUrl = `${appUrl}/dashboard/community/post/${id}`;

  const TYPE_COLORS: Record<string, string> = {
    discussion: '#4F8EF7',
    project: '#00E5A0',
    resource: '#38BDF8',
    question: '#F59E0B',
    showcase: '#F87171',
  };

  if (!post) {
    return (
      <main style={{ minHeight: '100vh', background: '#080E19', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Post not found</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>This post may have been removed.</p>
          <a href={`${appUrl}/dashboard/community`}
            style={{ display: 'inline-block', padding: '10px 24px', background: '#4F8EF7', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>
            Browse Community
          </a>
        </div>
      </main>
    );
  }

  const author = post.author ?? {};
  const typeColor = TYPE_COLORS[post.type] ?? '#4F8EF7';
  const initials = `${author.firstName?.[0] ?? ''}${author.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <main style={{ minHeight: '100vh', background: '#080E19', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>

      {/* Top bar */}
      <div style={{ background: '#0A1120', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: 17, color: '#4F8EF7' }}>Skillhub</span>
        <a href={loginUrl}
          style={{ padding: '8px 20px', background: '#4F8EF7', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
          Login to join
        </a>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Post image */}
        {post.imageUrl && (
          <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 28 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={post.title}
              style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* Card */}
        <div style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, marginBottom: 20 }}>

          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.avatar} alt={initials} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
              ) : (
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#4F8EF7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                  {initials}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {author.firstName} {author.lastName}
                </div>
                {author.title && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{author.title}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {post.type && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}30`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {post.type}
                </span>
              )}
              {post.tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(79,142,247,0.1)', color: '#4F8EF7' }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {[
              { icon: '👁️', val: `${post.views ?? 0} views` },
              { icon: '❤️', val: `${post.likes ?? 0} likes` },
              { icon: '💬', val: `${post._count?.comments ?? 0} comments` },
            ].map(s => (
              <span key={s.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                {s.icon} {s.val}
              </span>
            ))}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />

          {/* Title + body */}
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.3 }}>{post.title}</h1>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', margin: 0, whiteSpace: 'pre-wrap' }}>{post.body}</p>

          {post.projectUrl && (
            <a href={post.projectUrl} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, color: '#38BDF8', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              🔗 {post.projectUrl.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        {/* Login CTA */}
        <div style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.12), rgba(0,229,160,0.08))', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 20, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Join the conversation</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 20px', lineHeight: 1.6 }}>
            Log in to like, comment, and connect with {author.firstName || 'this'} and others in the Skillhub community.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={loginUrl}
              style={{ padding: '12px 28px', background: '#4F8EF7', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              Log in to reply
            </a>
            <a href={dashUrl}
              style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.07)', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
              View full post
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}

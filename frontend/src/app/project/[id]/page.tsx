import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MAX_SHARE_DESCRIPTION_LENGTH } from '@/lib/mediaStandards';

const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://skillhub.meritlives.com';

async function fetchProject(id: string) {
  const res = await fetch(`${backendUrl}/api/v1/portfolio/projects/${id}/public`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const payload = await res.json();
  if (!payload?.success || !payload?.data) return null;
  return payload.data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await fetchProject(id);
  if (!project) {
    return {
      title: 'Project not found | SkillHub',
      description: 'This shared SkillHub project is unavailable.',
    };
  }

  const title = `${project.title} | SkillHub Project`;
  const description =
    (project.description || 'Explore this project shared on SkillHub.').slice(0, MAX_SHARE_DESCRIPTION_LENGTH);
  const image = project.thumbnail || `${siteUrl}/community-covers/project.svg`;
  const url = `${siteUrl}/project/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: [{ url: image, width: 1200, height: 628, alt: project.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await fetchProject(id);
  if (!project) notFound();

  const creator = project.creator;
  const projectLink = project.liveUrl || project.githubUrl || '#';

  return (
    <main style={{ minHeight: '100vh', background: '#080E19', color: 'white', padding: '32px 16px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div
          style={{
            background: '#0F1521',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          {project.thumbnail && (
            <img
              src={project.thumbnail}
              alt={project.title}
              style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block' }}
              loading="eager"
            />
          )}
          <div style={{ padding: 24 }}>
            <p style={{ margin: 0, color: '#4F8EF7', fontWeight: 700, fontSize: 12, letterSpacing: 0.4 }}>
              SHARED PROJECT
            </p>
            <h1 style={{ marginTop: 8, marginBottom: 10, fontSize: 32, lineHeight: 1.2 }}>{project.title}</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
              {project.description || 'No description provided.'}
            </p>

            <div style={{ marginTop: 18, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              Built by <strong style={{ color: 'white' }}>{creator?.firstName} {creator?.lastName}</strong>
              {creator?.title ? ` · ${creator.title}` : ''}
            </div>

            {project.skills?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                {project.skills.slice(0, 8).map((skill: string) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: 12,
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: 'rgba(79,142,247,0.15)',
                      color: '#7fb2ff',
                    }}
                  >
                    #{skill}
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {projectLink !== '#' && (
                <a
                  href={projectLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    background: '#4F8EF7',
                    color: 'white',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  View full project
                </a>
              )}
              <Link
                href="/login"
                style={{
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: 'rgba(255,255,255,0.9)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Open SkillHub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

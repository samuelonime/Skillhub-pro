import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillHub Pro — Launch Your Tech Career in Africa',
  description: 'SkillHub connects African tech talent with world-class courses, verified certificates, and top employers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
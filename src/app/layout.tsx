
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Primary font
import './globals.css';
import { AppClientBoundary } from '@/components/layout/AppClientBoundary';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter', // Set CSS variable for Inter
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://plotform-ai-planner.web.app';

const fullAppName = "PlotForm Ai Production Planner";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${fullAppName} | AI Production Tool for Podcasts, YouTube & Music`,
    template: `%s | ${fullAppName}`,
  },
  description: `The ultimate AI production tool for content creators. Go from a single idea to a production-ready plan for podcasts, YouTube series, music albums, and more. Featuring generative AI planning, script collaboration, and automated workflow management.`,
  keywords: [
    "PlotForm Ai Production Planner", "AI production tool", "AI content planner", "podcast planning tool", 
    "YouTube series planner", "album creation tool", "generative AI for creators",
    "episode planner", "content strategy", "script writing software", "AI story generator",
    "pre-production tools", "collaborative writing", "kanban for creators", "content calendar",
    "AI assistant for youtube", "AI podcast script generator"
  ],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/logo.png',
    apple: '/logo.png',
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/logo.png',
      },
    ],
  },
  openGraph: {
    title: `${fullAppName} | AI Production Tool for Podcasts, YouTube & Music`,
    description: `Transform your creative ideas into structured, production-ready plans with ${fullAppName}'s generative AI and collaborative tools.`,
    url: siteUrl,
    siteName: fullAppName,
    images: [
      {
        url: `/ad-banner-nynp.png`,
        width: 1200,
        height: 630,
        alt: `Logo and promotional banner for ${fullAppName}`,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${fullAppName} | AI Production Tool for Podcasts, YouTube & Music`,
    description: `The ultimate AI-powered production and planning tool for content creators. Go from idea to production-ready plan in seconds.`,
    images: [`${siteUrl}/ad-banner-nynp.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body>
        <AppClientBoundary>{children}</AppClientBoundary>
      </body>
    </html>
  );
}

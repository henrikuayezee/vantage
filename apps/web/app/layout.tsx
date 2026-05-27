import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Vantage', template: '%s | Vantage' },
  description: 'Project management for high-performing IT teams.',
};

// Inline script runs before React hydration to prevent theme flash
const themeScript = `
  try {
    const s = JSON.parse(localStorage.getItem('vantage-ui') || '{}');
    if (s?.state?.theme === 'dark') document.documentElement.classList.add('theme-dark');
  } catch {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

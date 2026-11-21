import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Doomsday Ready | MCU Watch-Party Platform',
  description:
    'Track MCU rewatch prerequisites, compute topological viewing sequences, and optimize cinema bundles ahead of Avengers: Doomsday.',
  keywords: ['MCU', 'Avengers Doomsday', 'Marvel', 'Topological Sort', 'Watch-Party', 'Ticket Optimizer'],
  authors: [{ name: 'Antigravity Engineering' }],
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Doomsday Ready | MCU Watch-Party Platform',
    description: 'Topological rewatch planner and dynamic programming cinema bundle optimizer.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-mcu-dark text-slate-100 antialiased min-h-screen font-sans selection:bg-stark-cyan/30 selection:text-stark-cyan">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Doomsday Ready | MCU Watch-Party Platform',
  description: 'Track MCU rewatch prerequisites and book cinema watch parties ahead of Avengers: Doomsday.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-mcu-dark text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

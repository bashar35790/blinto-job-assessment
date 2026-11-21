'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, CheckSquare, Ticket, Shield } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Shield,
    description: 'Overview',
  },
  {
    name: 'Movie Catalog',
    href: '/movies',
    icon: Film,
    description: 'Manage & Prereqs',
  },
  {
    name: 'Rewatch Plan',
    href: '/rewatch',
    icon: CheckSquare,
    description: 'Sequenced Checklist',
  },
  {
    name: 'Watch-Party Booking',
    href: '/booking',
    icon: Ticket,
    description: 'Bundle Quotes',
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-mcu-dark/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-marvel-red text-white shadow-lg shadow-marvel-red/20 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 font-black tracking-wider text-base text-white">
              <span className="text-marvel-red">DOOMSDAY</span>
              <span className="text-stark-cyan">READY</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
              MCU Phase 6 Platform
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-stark-cyan shadow-sm border border-stark-cyan/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? 'text-stark-cyan' : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
export default Navbar;

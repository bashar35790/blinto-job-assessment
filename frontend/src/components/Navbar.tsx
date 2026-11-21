'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, CheckSquare, Ticket, Shield, Menu, X, ArrowRight } from 'lucide-react';

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
    description: 'Platform Overview',
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-mcu-dark/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-marvel-red text-white shadow-lg shadow-marvel-red/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1 font-black tracking-wider text-sm sm:text-base text-white truncate">
              <span className="text-marvel-red">DOOMSDAY</span>
              <span className="text-stark-cyan">READY</span>
            </div>
            <div className="hidden xs:block text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-medium truncate">
              MCU Phase 6 Platform
            </div>
          </div>
        </Link>

        {/* Desktop Navigation (>= md screens) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
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
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs lg:text-sm font-medium transition-colors ${
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

        {/* Mobile Hamburger Button (< md screens) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="md:hidden inline-flex items-center justify-center rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-stark-cyan transition-colors"
        >
          {isOpen ? <X className="h-6 w-6 text-stark-cyan" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu (< md screens) */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-800 bg-mcu-card/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-2xl">
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
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between rounded-xl p-3 transition-colors ${
                  isActive
                    ? 'bg-slate-800/90 border border-stark-cyan/40 text-stark-cyan shadow-md'
                    : 'text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                      isActive
                        ? 'bg-stark-cyan/20 border-stark-cyan/40 text-stark-cyan'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.description}</div>
                  </div>
                </div>
                <ArrowRight className={`h-4 w-4 ${isActive ? 'text-stark-cyan' : 'text-slate-600'}`} />
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

export default Navbar;

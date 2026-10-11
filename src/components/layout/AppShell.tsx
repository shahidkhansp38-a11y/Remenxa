'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Bell,
  RefreshCw,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/ui/Logo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface AppShellProps {
  children: React.ReactNode;
  attentionCount?: number;
}

export default function AppShell({ children, attentionCount = 0 }: AppShellProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/documents', label: 'Documents', icon: <FileText size={18} /> },
    {
      href: '/reminders',
      label: 'Reminders',
      icon: <Bell size={18} />,
      badge: attentionCount > 0 ? attentionCount : undefined,
    },
  ];

  const toolsNavItems: NavItem[] = [
    { href: '/renewal-assistant', label: 'Renewal Assistant', icon: <RefreshCw size={18} /> },
    { href: '/history', label: 'Renewal History', icon: <History size={18} /> },
  ];

  const settingsNavItems: NavItem[] = [
    { href: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  // Keyboard shortcut for command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setSidebarOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const userInitial = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="app-shell">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Main navigation">
        <Link href="/dashboard" className="sidebar-logo" aria-label="Remnexa Dashboard">
          <Logo size={28} showText />
        </Link>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
              </Link>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Tools</div>
            {toolsNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="sidebar-section">
            {settingsNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                userInitial
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.displayName || 'User'}</div>
              <div className="sidebar-user-email">{user?.email || ''}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-main">
        <header className="app-header">
          <div className="app-header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Search documents"
            >
              <Search size={14} />
              <span>Search</span>
              <kbd className="kbd" aria-hidden="true">Ctrl+K</kbd>
            </button>
          </div>
          <div className="app-header-right">
            <Link href="/documents/new" className="btn btn-primary btn-sm">
              <PlusCircle size={14} />
              Add document
            </Link>
            <button
              className="btn btn-tertiary btn-sm"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <main>
          {children}
        </main>
      </div>

      {/* Command Palette */}
      {commandPaletteOpen && (
        <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
      )}
    </div>
  );
}

// Command Palette Component
function CommandPalette({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const router = useRouter();

  const quickActions = [
    { label: 'Go to Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'View Documents', href: '/documents', icon: <FileText size={16} /> },
    { label: 'Add New Document', href: '/documents/new', icon: <PlusCircle size={16} /> },
    { label: 'Check Reminders', href: '/reminders', icon: <Bell size={16} /> },
    { label: 'Renewal Assistant', href: '/renewal-assistant', icon: <RefreshCw size={16} /> },
    { label: 'Renewal History', href: '/history', icon: <History size={16} /> },
    { label: 'Settings', href: '/settings', icon: <Settings size={16} /> },
  ];

  const filtered = quickActions.filter((a) =>
    a.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[highlightedIndex]) {
      handleSelect(filtered[highlightedIndex].href);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  return (
    <div
      className="command-palette-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Search and quick actions"
    >
      <div className="command-palette">
        <input
          type="text"
          className="command-palette-input"
          placeholder="Search or jump to..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="Search"
        />
        <div className="command-palette-results" role="listbox">
          {filtered.length > 0 ? (
            filtered.map((item, index) => (
              <button
                key={item.href}
                className={`command-palette-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => handleSelect(item.href)}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))
          ) : (
            <div className="command-palette-empty">
              No results found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

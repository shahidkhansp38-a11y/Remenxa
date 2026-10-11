'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Clock,
  Bell,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  ArrowRight,
  Shield,
  History,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/ui/Logo';

const FAQ_ITEMS = [
  {
    q: 'What types of documents can I manage with Remnexa?',
    a: 'You can manage any document with an expiry date: insurance policies, vehicle registrations, driving licences, passports, certificates, permits, and more. Remnexa supports custom categories for any document type.',
  },
  {
    q: 'Does Remnexa automatically renew my documents?',
    a: 'No. Remnexa helps you track expiry dates, provides renewal checklists, and links to external renewal portals. You complete the renewal process yourself through the appropriate authority or provider.',
  },
  {
    q: 'How do reminders work?',
    a: 'Remnexa calculates document status based on expiry dates and shows in-app reminders for documents that are overdue, expiring today, urgent (within 7 days), or upcoming (within 30 days). You can check your reminder centre any time you sign in.',
  },
  {
    q: 'Is my data private?',
    a: 'Your documents are private to your account. Each user can only access their own records. Data is stored securely in cloud infrastructure with access scoped to authenticated users.',
  },
  {
    q: 'Can I delete my account and data?',
    a: 'Yes. You can delete your account from the Settings page. This will remove your profile and associated data.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div>
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-left">
          <Logo size={28} showText />
        </div>

        <nav className="landing-nav" aria-label="Landing page navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>

        <div className="landing-header-right">
          {user ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary btn-sm">
                Sign in
              </Link>
              <button onClick={handleGetStarted} className="btn btn-primary btn-sm">
                Get started
              </button>
            </>
          )}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className={`mobile-nav-menu ${mobileMenuOpen ? 'open' : ''}`} aria-label="Mobile navigation">
        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</a>
        <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
        <Link href="/privacy" onClick={() => setMobileMenuOpen(false)}>Privacy</Link>
        <Link href="/terms" onClick={() => setMobileMenuOpen(false)}>Terms</Link>
        {user ? (
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
        ) : (
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
        )}
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <h1>Know what expires next. Renew before it does.</h1>
        <p>
          Keep important documents, expiry dates, reminders, and renewal steps in one organized workspace.
        </p>
        <div className="landing-hero-actions">
          <button onClick={handleGetStarted} className="btn btn-primary btn-lg">
            Get started
            <ArrowRight size={16} />
          </button>
          <a href="#how-it-works" className="btn btn-secondary btn-lg">
            See how it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="landing-section">
        <h2 className="landing-section-title">How it works</h2>
        <p className="landing-section-desc">
          Remnexa follows a simple document lifecycle to keep you ahead of every deadline.
        </p>

        <div className="grid-2col" style={{ gap: 'var(--space-4)' }}>
          <div className="landing-step">
            <div className="landing-step-number">1</div>
            <div>
              <h3>Add document details</h3>
              <p>Enter your document name, category, expiry date, and optional details like issuer and renewal link.</p>
            </div>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">2</div>
            <div>
              <h3>Track expiry dates</h3>
              <p>See at a glance which documents are valid, upcoming, urgent, or overdue based on their expiry dates.</p>
            </div>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">3</div>
            <div>
              <h3>Review reminders and renewal steps</h3>
              <p>Check your reminder centre for documents needing attention and follow renewal checklists with external portal links.</p>
            </div>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">4</div>
            <div>
              <h3>Record renewal and set the next expiry</h3>
              <p>Mark a document as renewed with the new expiry date. Remnexa records the event and recalculates your schedule.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="landing-section" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
          <h2 className="landing-section-title">Features</h2>
          <p className="landing-section-desc">
            Everything you need to stay on top of your important documents.
          </p>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-card-icon"><FileText size={18} /></div>
              <h3>Centralized document list</h3>
              <p>All your important documents in one searchable, filterable workspace. No more digging through emails and folders.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon"><Clock size={18} /></div>
              <h3>Expiry status tracking</h3>
              <p>Instantly see which documents are valid, upcoming, urgent, or overdue with clear status indicators and days remaining.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon"><Bell size={18} /></div>
              <h3>Reminder centre</h3>
              <p>A dedicated view of documents needing your attention, sorted by urgency so you always know what to act on first.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon"><CheckSquare size={18} /></div>
              <h3>Renewal checklists</h3>
              <p>Step-by-step checklists to guide you through each renewal process. Add external renewal portal links for quick access.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon"><History size={18} /></div>
              <h3>Renewal history</h3>
              <p>A complete record of every renewal event, including previous and new expiry dates, so you never lose track.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon"><Shield size={18} /></div>
              <h3>Private and secure</h3>
              <p>Your documents are private to your account. Sign in with Google and access only your own records.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section">
        <h2 className="landing-section-title">Frequently asked questions</h2>
        <p className="landing-section-desc">
          Common questions about how Remnexa works.
        </p>

        <div className="landing-faq" style={{ maxWidth: '720px', margin: '0 auto' }}>
          {FAQ_ITEMS.map((item, index) => (
            <div key={index} className="faq-item">
              <button
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                aria-expanded={openFaq === index}
              >
                <span>{item.q}</span>
                {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openFaq === index && (
                <div className="faq-answer">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: 'var(--color-primary)', padding: 'var(--space-16) var(--space-6)', textAlign: 'center' }}>
        <h2 style={{ color: '#FFFFFF', fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-3)' }}>
          Start organizing your documents today
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 'var(--space-6)', maxWidth: '480px', margin: '0 auto var(--space-6)' }}>
          Create your free workspace and never miss another expiry date.
        </p>
        <button
          onClick={handleGetStarted}
          className="btn btn-lg"
          style={{ backgroundColor: '#FFFFFF', color: 'var(--color-primary)', border: 'none' }}
        >
          Get started
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <Logo size={24} showText />
            <p>
              Document lifecycle and renewal management. Track expiry dates, follow renewal steps, and keep your important documents organized.
            </p>
          </div>
          <div className="landing-footer-links">
            <h4>Product</h4>
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            {user ? (
              <Link href="/dashboard">Dashboard</Link>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
          </div>
          <div className="landing-footer-links">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms and Conditions</Link>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>&copy; 2026 Remnexa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

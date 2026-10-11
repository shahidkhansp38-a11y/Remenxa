'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import Logo from '@/components/ui/Logo';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading, error, signInWithGoogle, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="auth-layout">
        <div style={{ textAlign: 'center' }}>
          <div
            className="spinner"
            style={{
              width: 32,
              height: 32,
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              margin: '0 auto var(--space-4)',
            }}
          />
          <p className="text-secondary">Checking session...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Redirect happening
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Logo size={36} showText />
        </div>

        <h1 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
          Sign in to Remnexa
        </h1>
        <p style={{ marginBottom: 'var(--space-6)' }}>
          Manage your documents, track expiry dates, and stay on top of renewals.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-danger-soft)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-danger)',
              textAlign: 'left',
            }}
          >
            {error}
            <button
              className="btn-link text-xs"
              onClick={clearError}
              style={{ display: 'block', marginTop: 'var(--space-1)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        <GoogleSignInButton onClick={signInWithGoogle} loading={loading} />

        <p
          style={{
            marginTop: 'var(--space-6)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          By signing in, you agree to our{' '}
          <Link href="/terms">Terms</Link> and{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

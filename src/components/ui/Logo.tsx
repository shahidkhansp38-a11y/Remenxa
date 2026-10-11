'use client';

import Image from 'next/image';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Reusable brand component.
 * Used by landing page, login, sidebar, and favicon workflow.
 * Logo asset is in /public/images/logo.png.
 */
export default function Logo({ size = 28, showText = true, className = '' }: LogoProps) {
  return (
    <span className={`sidebar-logo ${className}`} style={{ border: 'none', padding: 0, minHeight: 'auto' }}>
      <Image
        src="/images/logo.png"
        alt="Remnexa"
        width={size}
        height={size}
        priority
        style={{ objectFit: 'contain' }}
      />
      {showText && (
        <span className="sidebar-logo-text">Remnexa</span>
      )}
    </span>
  );
}

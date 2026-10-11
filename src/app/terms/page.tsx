import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions - Remnexa',
  description: 'Remnexa Terms and Conditions. Understand the terms of using our service.',
};

export default function TermsPage() {
  return (
    <div>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-6)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-ink)', textDecoration: 'none' }}>
          Remnexa
        </Link>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link href="/privacy" className="btn btn-tertiary btn-sm">Privacy</Link>
          <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>
        </div>
      </header>

      <div className="legal-page">
        <h1>Terms and Conditions</h1>
        <p className="last-updated">Last updated: October 2026</p>

        <p>
          These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of the Remnexa document lifecycle management
          application (&ldquo;Service&rdquo;). By accessing or using the Service, you agree to be bound by these Terms.
        </p>

        <h2>1. Service Description</h2>
        <p>
          Remnexa is a personal document management tool that helps you organize documents, track expiry dates,
          receive in-app reminders, follow renewal checklists, and maintain renewal history.
        </p>

        <h2>2. Account Registration</h2>
        <p>
          You must sign in with a Google account to use the Service. You are responsible for maintaining
          the security of your Google account. You must provide accurate information and keep it up to date.
        </p>

        <h2>3. User Responsibilities</h2>
        <ul>
          <li>You are responsible for the accuracy of the document information you enter into the Service.</li>
          <li>You should verify expiry dates and renewal requirements with the issuing authority or provider.</li>
          <li>You should not rely solely on Remnexa reminders to meet critical deadlines. Set independent reminders for important dates.</li>
          <li>You must not use the Service for any unlawful purpose or to store illegal content.</li>
        </ul>

        <h2>4. No Guarantee of Reminders</h2>
        <p>
          While Remnexa provides in-app expiry tracking and reminders, we do not guarantee that reminders will prevent
          every missed expiry. The Service is a tool to assist your own document management process.
          Email, SMS, and push notifications are not currently available.
        </p>

        <h2>5. No Automatic Renewal</h2>
        <p>
          Remnexa does not automatically renew any document on your behalf. The Service may link to external renewal
          portals that you configure, but completion of any renewal is your responsibility. We are not affiliated
          with any government agency, insurer, or document issuer.
        </p>

        <h2>6. Third-Party Links and Services</h2>
        <p>
          The Service may contain links to external websites or renewal portals that you provide. We do not control,
          endorse, or assume responsibility for the content, privacy policies, or practices of any third-party sites.
          You access external links at your own risk.
        </p>

        <h2>7. General Information Only</h2>
        <p>
          Renewal checklists and guidance provided by the Service are general information only. They are not official
          legal, government, financial, or regulatory advice. Always verify requirements with the relevant authority
          or qualified professional.
        </p>

        <h2>8. Data and Privacy</h2>
        <p>
          Your use of the Service is also governed by our <Link href="/privacy">Privacy Policy</Link>.
          Your document data is private to your account. We implement access controls to protect your information,
          but we cannot guarantee absolute security.
        </p>

        <h2>9. Service Availability</h2>
        <p>
          We aim to provide reliable access to the Service, but we do not guarantee uninterrupted or error-free
          operation. The Service may be temporarily unavailable for maintenance, updates, or due to circumstances
          beyond our control.
        </p>

        <h2>10. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Remnexa and its operators shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages arising from your use of the Service,
          including but not limited to damages from missed expiry dates, failed renewals, data loss, or
          service interruptions.
        </p>

        <h2>11. Account Termination</h2>
        <p>
          You may delete your account at any time from the Settings page. We reserve the right to suspend or
          terminate accounts that violate these Terms or are used for abusive purposes.
        </p>

        <h2>12. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Changes will be reflected on this page with an updated date.
          Continued use of the Service after changes constitutes acceptance of the revised Terms.
        </p>

        <h2>13. Contact</h2>
        <p>
          For questions about these Terms, please contact the site administrator.
        </p>

        <hr className="divider" />
        <p className="text-xs text-secondary">
          These terms reflect the current implementation. The site owner should review and update them with
          appropriate legal counsel before public launch.
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Remnexa',
  description: 'Remnexa Privacy Policy. Learn how we handle your data.',
};

export default function PrivacyPage() {
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
          <Link href="/terms" className="btn btn-tertiary btn-sm">Terms</Link>
          <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>
        </div>
      </header>

      <div className="legal-page">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: October 2026</p>

        <p>
          This Privacy Policy describes how Remnexa (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and protects
          information when you use our document lifecycle management application.
        </p>

        <h2>1. Information We Collect</h2>
        <p><strong>Account information:</strong> When you sign in with Google, we receive your name, email address, and profile photo from Google. We use this to create and identify your account.</p>
        <p><strong>Document data:</strong> You voluntarily provide document metadata such as names, categories, expiry dates, issuers, reference numbers, notes, and renewal URLs. This information is stored in our database to provide the service.</p>
        <p><strong>Renewal records:</strong> When you mark a document as renewed, we store the previous and new expiry dates, renewal date, and any notes you provide.</p>
        <p><strong>Usage data:</strong> We may collect basic usage information such as sign-in timestamps to maintain security and improve the service.</p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain the document tracking and renewal management service.</li>
          <li>To calculate expiry statuses and generate in-app reminders.</li>
          <li>To display your profile information within your authenticated session.</li>
          <li>To improve service reliability and security.</li>
        </ul>

        <h2>3. Data Storage and Security</h2>
        <p>
          Your data is stored in cloud infrastructure provided by Google (Firebase/Firestore). Access to your documents is scoped
          to your authenticated account. We implement access controls to prevent unauthorized access between accounts.
        </p>
        <p>
          We do not guarantee absolute security. No method of electronic storage or transmission is 100% secure.
        </p>

        <h2>4. Third-Party Services</h2>
        <p><strong>Google Authentication:</strong> We use Google sign-in for account authentication. Google&rsquo;s privacy practices are governed by their own privacy policy.</p>
        <p><strong>Firebase/Firestore:</strong> Your data is stored using Google Firebase services, subject to Google Cloud&rsquo;s terms of service and privacy commitments.</p>
        <p>
          Remnexa may link to external renewal portals that you configure. We do not control these external sites and are not
          responsible for their privacy practices.
        </p>

        <h2>5. Data Retention and Deletion</h2>
        <p>
          Your document data is retained as long as your account is active. You can delete individual documents at any time.
          Account deletion removes your authentication credentials. Contact the site administrator for complete data deletion requests.
        </p>

        <h2>6. Cookies and Sessions</h2>
        <p>
          We use authentication session tokens to maintain your signed-in state. These are essential for the service to function
          and are not used for advertising or tracking.
        </p>

        <h2>7. Your Choices</h2>
        <ul>
          <li>You can choose what information to enter when creating document records.</li>
          <li>You can delete documents and renewal records at any time.</li>
          <li>You can delete your account from the Settings page.</li>
          <li>You can revoke Google sign-in access through your Google account settings.</li>
        </ul>

        <h2>8. Children&rsquo;s Privacy</h2>
        <p>Remnexa is not directed at children under 13. We do not knowingly collect information from children.</p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be reflected on this page with an updated date.
          Continued use of the service after changes constitutes acceptance.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about this Privacy Policy or data practices, please contact the site administrator.
        </p>

        <hr className="divider" />
        <p className="text-xs text-secondary">
          This policy reflects the current implementation. The site owner should review and update it to match actual
          data practices and applicable legal requirements before public launch.
        </p>
      </div>
    </div>
  );
}

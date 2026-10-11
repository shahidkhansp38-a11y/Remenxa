import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Remnexa - Document Lifecycle & Renewal Management',
  description:
    'Keep important documents, expiry dates, reminders, and renewal steps in one organized workspace. Know what expires next and renew before it does.',
  icons: {
    icon: '/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

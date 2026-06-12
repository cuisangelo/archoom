import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@xyflow/react/dist/style.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'archoom — architecture as code',
  description:
    'Open-source architecture diagrams from plain .md and .yaml files — interactive, annotated, beautiful.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface font-sans text-ink antialiased">{children}</body>
    </html>
  );
}

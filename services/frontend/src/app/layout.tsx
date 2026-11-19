import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseSupply — Enterprise Inventory & Order Management',
  description:
    'Portfolio-grade multi-service SaaS for enterprise supply chain operations. Built with Next.js, Node.js/Express, Python FastAPI, Redis BullMQ, and PostgreSQL.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-200 antialiased min-h-screen">{children}</body>
    </html>
  );
}


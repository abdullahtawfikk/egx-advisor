import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EGX Advisor | مستشار البورصة المصرية',
  description: 'Short-term trading advisor for Egyptian Exchange (EGX30) stocks. BUY/HOLD/SELL signals with TA, news sentiment, and next-session predictions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

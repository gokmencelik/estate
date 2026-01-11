import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estate SaaS",
  description: "White-label Real Estate SaaS"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}


import type { Metadata, Viewport } from "next";

import "./globals.css";

/**
 * Typography note: DETECH uses a native system font stack (see
 * `--font-sans` in globals.css) rather than a webfont. That keeps the
 * first paint instant, removes a third-party request, and lets the app
 * build and run in offline / air-gapped school networks.
 *
 * To use a webfont instead, add:
 *   import { Geist } from "next/font/google";
 *   const geist = Geist({ subsets: ["latin"], variable: "--font-app" });
 * and put `className={geist.variable}` on <html>.
 */

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "DETECH — School Management System",
    template: "%s · DETECH",
  },
  description:
    "DETECH is a complete school management system: students, teachers, attendance, timetables, exams, fees, library, transport, parent portal, messaging and analytics — in one secure platform.",
  keywords: [
    "school management system",
    "student information system",
    "attendance",
    "timetable",
    "fees",
    "gradebook",
    "parent portal",
    "DETECH",
  ],
  authors: [{ name: "DETECH" }],
  openGraph: {
    type: "website",
    url: appUrl,
    title: "DETECH — School Management System",
    description:
      "Run your whole school from one dashboard: admissions, attendance, grading, fees, library, transport and parent communication.",
    siteName: "DETECH",
  },
  twitter: {
    card: "summary_large_image",
    title: "DETECH — School Management System",
    description:
      "Run your whole school from one dashboard — attendance, grading, fees, library, transport and parent communication.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1d3ff5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

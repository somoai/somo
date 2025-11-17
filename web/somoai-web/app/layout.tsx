import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SomoAI - AI-Powered Learning for Kenyan Students",
    template: "%s | SomoAI",
  },
  description: "Your personal AI learning companion. Access personalized tutoring via SMS, voice, or mobile app for grades 1-8 in Kenya.",
  keywords: ["AI tutoring", "Kenya education", "SMS learning", "mobile learning", "personalized education"],
  authors: [{ name: "SomoAI" }],
  creator: "SomoAI",
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://somoai.co.ke",
    title: "SomoAI - AI-Powered Learning for Kenyan Students",
    description: "Your personal AI learning companion",
    siteName: "SomoAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "SomoAI - AI-Powered Learning",
    description: "Your personal AI learning companion",
    creator: "@SomoAI_Kenya",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

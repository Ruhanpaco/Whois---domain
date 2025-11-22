import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WHOIS Lookup Tool | Domain Information & Registration Details",
  description: "Find website ownership details with our free WHOIS lookup tool. Get comprehensive domain registration information, DNS records, SSL certificates & more.",
  keywords: [
    "whois lookup", 
    "domain information tool", 
    "whois search", 
    "domain registration information", 
    "website ownership details", 
    "domain lookup", 
    "dns records", 
    "ssl certificate checker", 
    "domain analysis", 
    "subdomain discovery", 
    "free whois lookup", 
    "domain registration history",
    "domain information for website analysis"
  ],
  authors: [{ name: "Ruhan Pacolli", url: "https://ruhanpacolli.online" }],
  creator: "Ruhan Pacolli",
  publisher: "DomainInfo Tool",
  metadataBase: new URL("https://domaininfo.ruhanpacolli.online"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WHOIS Lookup Tool | Domain Information & Registration Details",
    description: "Find website ownership details with our free WHOIS lookup tool. Get comprehensive domain registration information, DNS records, SSL certificates & more.",
    url: "https://domaininfo.ruhanpacolli.online",
    siteName: "DomainInfo Tool",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DomainInfo Tool - WHOIS Lookup and Domain Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free WHOIS Lookup Tool | Domain Information & Registration Details",
    description: "Find website ownership details with our free WHOIS lookup tool. Get comprehensive domain registration information, DNS records, SSL certificates & more.",
    images: ["/twitter-image.png"],
    creator: "@ruhanpacodev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <Navbar />
        <main className="pt-20 min-h-screen">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

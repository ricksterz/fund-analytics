import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A soft, flowing display serif for the wordmark and tagline -- picked for
// its literal curves, echoing the app's own J-curve.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Vantage Curve",
  description:
    "Every vintage. Every curve. One vantage point. Private fund J-curve analytics built on real SEC Form D fund data, with Takahashi-Alexander, empirical benchmarking, Monte Carlo, and Marshall-Lerner cash-flow projections.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950">{children}</body>
    </html>
  );
}

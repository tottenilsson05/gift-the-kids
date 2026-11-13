import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import { siteConfig } from "@/site.config";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-mono", display: "swap" });

const title = `${siteConfig.name} (${siteConfig.ticker})`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title,
  description: siteConfig.description,
  keywords: ["Gift The Kids", "$GIFT", "charity memecoin", "toy donations", "Christmas gifts", "donate.gg", "Pump.fun"],
  openGraph: {
    title,
    description: siteConfig.description,
    type: "website",
    images: [{ url: "/gift.webp", width: 496, height: 496, alt: "Gift The Kids — green gift box logo" }],
  },
  twitter: {
    card: "summary",
    title,
    description: siteConfig.description,
    images: ["/gift.webp"],
  },
  // Favicon: app/icon.png (from the original gift logo).
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Scroll-reveal content is only hidden once JS is confirmed running. If the
            reveal script hasn't started 3s after load, everything is shown as-is. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(d){d.classList.add('js');addEventListener('load',function(){setTimeout(function(){if(d.dataset.reveal!=='ready')d.classList.remove('js')},3000)})})(document.documentElement)`,
          }}
        />
      </head>
      <body className="bg-black font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}

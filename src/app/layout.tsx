import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Covenant";
const appUrl = process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${appName} — Official Trading Card Game Portal`,
    template: `%s — ${appName}`,
  },
  description:
    "The official web portal for Covenant: create an account, track rankings, read the latest news, and get into the game.",
  openGraph: {
    type: "website",
    siteName: appName,
    title: `${appName} — Official Trading Card Game Portal`,
    description:
      "The official web portal for Covenant: create an account, track rankings, read the latest news, and get into the game.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} — Official Trading Card Game Portal`,
    description: "Create an account, track rankings, read the latest news, and get into the game.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${cinzel.variable} ${inter.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-ink font-sans text-parchment antialiased">
        {children}
      </body>
    </html>
  );
}

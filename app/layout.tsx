import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono, DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfitHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

const norse = localFont({
  src: "../assets/fonts/Norse.otf",
  variable: "--font-norse",
});

const norseBold = localFont({
  src: "../assets/fonts/Norsebold.otf",
  variable: "--font-norse-bold",
});

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devhack | Devhost",
  description: "Hackathon evaluation and event workspace for Devhack.",
  icons: {
    icon: "/favicons/favicon.ico",
    shortcut: "/favicons/favicon-16x16.png",
    apple: "/favicons/apple-touch-icon.png",
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        "font-sans",
        dmSans.variable,
        outfitHeading.variable,
        norse.variable,
        norseBold.variable,
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

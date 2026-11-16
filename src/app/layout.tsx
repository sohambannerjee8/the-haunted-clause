import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Both fonts are committed under src/app/fonts/ with their SIL OFL 1.1 files and self-hosted by
// next/font, so the browser requests no font from another origin (haunted-house-ui R1.4).
const creepster = localFont({
  src: "./fonts/Creepster-Regular.ttf",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-creepster",
  fallback: ["Georgia", "serif"],
});
const atkinson = localFont({
  src: [
    { path: "./fonts/AtkinsonHyperlegible-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/AtkinsonHyperlegible-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-atkinson",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "The Haunted Clause",
  description:
    "Turn Terms & Conditions and privacy policies into a haunted house. Not legal advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${creepster.variable} ${atkinson.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

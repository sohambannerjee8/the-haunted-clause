import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Haunted Clause",
  description:
    "Turn Terms & Conditions and privacy policies into a haunted house. Not legal advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

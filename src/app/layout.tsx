import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MahaKissanSeva — AI Sugarcane Expert",
  description: "AI-powered RAG expert system for Maharashtra sugarcane farmers. Get instant guidance on diseases, pests, irrigation, soil, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

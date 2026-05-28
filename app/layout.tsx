import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sub2API Token Leaderboard",
  description: "A monitoring screen for Sub2API token usage ranking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

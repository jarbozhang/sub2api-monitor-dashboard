import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Token消耗榜",
  description: "Token 使用量与请求量排行榜。",
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

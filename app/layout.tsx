import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sub2API 监控看板",
  description: "Sub2API token 使用量与请求量监控看板。",
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

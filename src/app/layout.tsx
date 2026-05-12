import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "関西ジュニアユース進路レーダー",
  description:
    "関西2府4県のサッカージュニアユースチームの募集・セレクション・体験練習会情報を集約",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}

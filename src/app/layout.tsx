import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "만다라트 - 목표를 실현하는 9칸의 힘",
  description: "만다라트 목표 설정법으로 꿈을 체계적으로 달성하세요. 팀원들과 함께 목표를 공유하고 실천을 기록합니다.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="grain">
        {children}
      </body>
    </html>
  );
}

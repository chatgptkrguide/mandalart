import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "만다라트 - 목표를 실현하는 9칸의 힘",
  description: "만다라트 목표 설정법으로 꿈을 체계적으로 달성하세요. 팀원들과 함께 목표를 공유하고 실천을 기록합니다.",
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

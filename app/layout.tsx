import type { Metadata } from "next";
import { Alexandria, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const alexandria = Alexandria({
  variable: "--next-alexandria",
  subsets: ["arabic", "latin"],
  weight: ["200", "600", "700", "800"],
  display: "swap",
});

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--next-notokufi",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "كود الإمارات — للخدمات الحكومية وتصفير البيروقراطية",
  description:
    "اطرح أسئلتك حول كود الإمارات للخدمات الحكومية وتصفير البيروقراطية واحصل على إجابات مستندة إلى الوثيقة الرسمية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${alexandria.variable} ${notoKufiArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

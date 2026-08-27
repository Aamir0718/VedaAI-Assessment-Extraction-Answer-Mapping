import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AssessmentProvider } from "@/lib/state/assessment-store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VedaAI Assessment Extraction & Answer Mapping",
  description:
    "Upload a question paper and a handwritten answer sheet to extract questions, map answers, and highlight exactly where each answer appears.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AssessmentProvider>{children}</AssessmentProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Source_Serif_4, Plus_Jakarta_Sans } from "next/font/google";
import { AssessmentProvider } from "@/lib/state/assessment-store";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Assessment Extraction & Answer Mapping",
  description:
    "Upload a question paper and a handwritten answer sheet to extract questions, map answers, and highlight exactly where each answer appears.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${jakarta.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (ColorZilla etc.) inject
          attributes like cz-shortcut-listen onto <body> before React hydrates
          -- a harmless mismatch, not an app bug. This only skips warnings for
          body's own attributes, not for children. */}
      <body className="min-h-full flex flex-col bg-bg text-ink-900" suppressHydrationWarning>
        <AssessmentProvider>
          <div className="flex min-h-0 flex-1">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          </div>
        </AssessmentProvider>
      </body>
    </html>
  );
}

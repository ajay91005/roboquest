import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../public/monaco/editor.css";
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
  title: "RoboQuest | The Path to Principal Engineer",
  description:
    "Build a mobile manipulator, master ROS 2 Humble, and grow from first principles to autonomous systems in your virtual garage.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

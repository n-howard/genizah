import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cousine } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cousine = Cousine({
  variable: "--font-cousine",
  weight: "400",
});

export const metadata: Metadata = {
  title: "TEXTEVOLVE Data Analysis Tool",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cousine.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}

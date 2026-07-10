import { ClerkProvider } from "@clerk/nextjs";
import { ClerkAxiosProvider } from "@/components/ClerkAxiosProvider";
import { Header } from "@/components/Header";
import { HotToaster } from "@/components/HotToaster";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Photography",
  description: "Photography gallery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overscroll-y-none`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ClerkAxiosProvider>
            <HotToaster />
            <Header />
            {children}
          </ClerkAxiosProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

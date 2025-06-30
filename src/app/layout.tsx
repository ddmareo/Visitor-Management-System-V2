import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "../components/header";
import { NextAuthProvider } from "../providers/NextAuthProvider";
import NotificationListener from "@/components/notificationtoast";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Visitor Management System",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextAuthProvider>
          <Toaster richColors position="top-center" />
          <Header />
          <main>{children}</main>
          <NotificationListener />
        </NextAuthProvider>
      </body>
    </html>
  );
}

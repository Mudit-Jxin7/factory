import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "@/components/dashboard.css";
import { Providers } from "@/components/Providers";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Factory Dashboard",
  description: "Lot Production Dashboard - Track and manage production data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

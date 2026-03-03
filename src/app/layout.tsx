import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopFlow — E-Commerce Automation Platform",
  description:
    "Full-stack e-commerce platform with authentication, workflow automation, and admin tooling.",
  openGraph: {
    title: "ShopFlow — E-Commerce Automation Platform",
    description:
      "Full-stack e-commerce platform with authentication, workflow automation, and admin tooling.",
    url: "https://shopflow-srujan-kothuris-projects.vercel.app/",
    siteName: "ShopFlow",
    images: [
      {
        url: "https://shopflow-srujan-kothuris-projects.vercel.app/og-preview.png",
        width: 1200,
        height: 627,
        alt: "ShopFlow — E-Commerce Automation Platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopFlow — E-Commerce Automation Platform",
    description:
      "Full-stack e-commerce platform with authentication, workflow automation, and admin tooling.",
    images: [
      "https://shopflow-srujan-kothuris-projects.vercel.app/og-preview.png",
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

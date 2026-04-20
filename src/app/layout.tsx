import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "CollabFlow V2 - AI Project Management System",
  description: "Modern SaaS for project management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="h-full">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

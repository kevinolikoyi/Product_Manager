import type { Metadata } from "next";
import "./globals.css";
import { getAuthenticatedCollaborator, getAuthenticatedUser } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "AS WORLD TECH - Project Management System",
  description: "AS WORLD TECH - plateforme moderne de gestion de projets",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, collaborator] = await Promise.all([
    getAuthenticatedUser(),
    getAuthenticatedCollaborator(),
  ]);

  return (
    <html lang="fr" className="h-full antialiased">
      <body className="h-full">
        <StoreProvider
          authenticatedEmail={user?.email ?? null}
          initialCurrentMemberId={collaborator ? String(collaborator.id) : null}
        >
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}

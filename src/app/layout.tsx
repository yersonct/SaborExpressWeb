import type { Metadata } from "next";
import "./globals.css";
import { LanguageInitializer } from "@/components/language-initializer";
import { BackNavigationGuard } from "@/components/back-navigation-guard";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/features/auth/context/auth-context";

export const metadata: Metadata = {
  title: "SaborExpress",
  description: "Panel de administración de SaborExpress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <BackNavigationGuard />
          <LanguageInitializer />
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { LoginSuccessToast } from "@/components/LoginSuccessToast";
import { UserProvider } from "@/components/UserProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { LanguageProvider } from "@/components/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArmorClaw | AI Security Audit",
  description: "Next-generation security auditing powered by AI and eBPF",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground flex h-screen`}
      >
        <UserProvider user={user}>
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {/* Sidebar */}
              <Sidebar user={user} />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col relative">
                {/* Top Navigation */}
                <Header user={user} />

                <main className="flex-1 mt-16 overflow-hidden relative">
                  <LoginSuccessToast />
                  {children}
                </main>
              </div>
            </ThemeProvider>
          </LanguageProvider>
        </UserProvider>
      </body>
    </html>
  );
}


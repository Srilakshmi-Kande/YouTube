import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "../lib/AuthContext";
import { LayoutProvider } from "../lib/LayoutContext";
import { AppThemeProvider } from "@/components/AppThemeProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppThemeProvider>
      <UserProvider>
        <LayoutProvider>
          <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            <Header />
            <Toaster />
            <div className="flex min-h-[calc(100dvh-3.5rem)]">
              <Sidebar />
              <div className="flex-1 min-w-0">
                <Component {...pageProps} />
              </div>
            </div>
          </div>
        </LayoutProvider>
      </UserProvider>
    </AppThemeProvider>
  );
}

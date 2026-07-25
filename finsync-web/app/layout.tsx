import AuthProvider from "@/components/AuthProvider";
import OfflineSyncManager from "@/components/OfflineSyncManager";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinSync - Life & Business ERP",
  description:
    "Manage your personal finances and business operations in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning fixes errors caused by browser extensions like Grammarly */}
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <OfflineSyncManager />
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
        <Script
          id="pwa-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

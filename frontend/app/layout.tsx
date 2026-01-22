import type { Metadata } from "next";
import { Urbanist, Outfit } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/wallet/provider";
import { Toaster } from "sonner";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SilentPay | Confidential Payroll",
  description: "Secure, private, and compliant payroll management on Inco Network.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${urbanist.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <WalletProvider>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'linear-gradient(135deg, rgba(11, 30, 38, 0.95) 0%, rgba(11, 30, 38, 0.8) 100%)',
                border: '1px solid rgba(248, 253, 255, 0.1)',
                borderRadius: '20px',
                color: '#fff',
                backdropFilter: 'blur(8px)',
              },
              actionButtonStyle: {
                backgroundColor: 'rgba(74, 198, 255, 0.15)',
                color: '#4AC6FF',
                borderRadius: '12px',
                fontWeight: 'bold',
              },
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
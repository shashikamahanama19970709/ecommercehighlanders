import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/lib/cart-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { AppFooter } from "@/components/app-footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Highlanders Sports & Fitness",
    template: "%s | Highlanders Sports & Fitness",
  },
  description:
    "Train like a champion. Premium sports gear and fitness equipment from Highlanders Sports & Fitness — your one-stop destination for cricket, football, gym, and more.",
  keywords: ["sports equipment", "fitness gear", "cricket", "football", "gym", "London", "UK", "Highlanders"],
  authors: [{ name: "Highlanders Sports & Fitness" }],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Highlanders Sports & Fitness",
    description: "Train like a champion. Premium sports gear and fitness equipment.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>{children}</CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
        <AppFooter />
      </body>
    </html>
  );
}

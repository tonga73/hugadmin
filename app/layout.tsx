import type { Metadata } from "next";
import { Work_Sans, JetBrains_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers";
import { AuthProvider } from "@/contexts/auth-context";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hugadmin",
  description: "Panel administrativo moderno",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${workSans.variable} ${jetbrainsMono.variable} ${montserrat.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

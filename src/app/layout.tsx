import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tipovi | AI fudbalski tipovi svaki dan",
  description: "Besplatni i VIP fudbalski tipovi generisani uz pomoć veštačke inteligencije.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              ⚽ Tipovi<span className="text-emerald-400">AI</span>
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/" className="hover:text-emerald-400">
                Naslovna
              </Link>
              <Link
                href="/vip"
                className="rounded-full bg-emerald-500 px-3 py-1 text-neutral-950 hover:bg-emerald-400"
              >
                VIP tipovi
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
          <p>Tipovi su generisani uz pomoć AI modela i predstavljaju procenu, ne garanciju ishoda.</p>
          <p>Klađenje je zakonski dozvoljeno isključivo osobama 18+. Kladi se odgovorno.</p>
        </footer>
      </body>
    </html>
  );
}

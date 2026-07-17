import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}
        className="min-h-screen flex flex-col"
      >
        <main className="flex-1 flex items-center justify-center p-6 md:p-10">
          {children}
        </main>
        <footer style={{ marginTop: 64 }} className="w-full max-w-[1100px] mx-auto flex items-center justify-between px-6 md:px-10 pb-8">
          <div className="text-[#9AA0A6] text-xs">
            <select
              aria-label="Language"
              className="bg-transparent border-none text-[#9AA0A6] text-xs cursor-pointer outline-none appearance-none"
              defaultValue="en"
            >
              <option value="en" className="bg-[#0A0A0A] text-[#E8EAED]">
                English (United States)
              </option>
              <option value="es" className="bg-[#0A0A0A] text-[#E8EAED]">
                Español
              </option>
              <option value="fr" className="bg-[#0A0A0A] text-[#E8EAED]">
                Français
              </option>
              <option value="zh" className="bg-[#0A0A0A] text-[#E8EAED]">
                中文（简体）
              </option>
            </select>
          </div>
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            <a href="#" className="text-[#9AA0A6] text-xs hover:text-[#E8EAED] transition-colors duration-200">
              Help
            </a>
            <a href="#" className="text-[#9AA0A6] text-xs hover:text-[#E8EAED] transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="text-[#9AA0A6] text-xs hover:text-[#E8EAED] transition-colors duration-200">
              Terms
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}

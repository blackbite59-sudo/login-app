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
      <body className="bg-[#202124] min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center p-6 md:p-8">
          {children}
        </main>
        <footer className="w-full max-w-[1080px] mx-auto flex items-center justify-between px-6 md:px-8 pb-6 md:pb-8">
          <div className="text-[#BDC1C6] text-xs">
            <select
              aria-label="Language"
              className="bg-transparent border-none text-[#BDC1C6] text-xs cursor-pointer outline-none appearance-none"
              defaultValue="en"
            >
              <option value="en" className="bg-[#0F0F10] text-[#E8EAED]">
                English (United States)
              </option>
              <option value="es" className="bg-[#0F0F10] text-[#E8EAED]">
                Español
              </option>
              <option value="fr" className="bg-[#0F0F10] text-[#E8EAED]">
                Français
              </option>
              <option value="zh" className="bg-[#0F0F10] text-[#E8EAED]">
                中文（简体）
              </option>
            </select>
          </div>
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            <a href="#" className="text-[#BDC1C6] text-xs hover:text-[#E8EAED] transition-colors duration-200">
              Help
            </a>
            <a href="#" className="text-[#BDC1C6] text-xs hover:text-[#E8EAED] transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="text-[#BDC1C6] text-xs hover:text-[#E8EAED] transition-colors duration-200">
              Terms
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}

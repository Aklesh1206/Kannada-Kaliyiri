import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/noto-sans-kannada";
import "./globals.css";
import { Splash } from "@/components/Splash";

export const metadata: Metadata = {
  title: "Kannada Kaliyiri",
  description: "Learn the Kannada you will actually use: autos, markets, neighbours and small talk.",
};

export const viewport: Viewport = {
  themeColor: "#ffc20e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><Splash />
        {children}
      </body>
    </html>
  );
}

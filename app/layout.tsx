import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fireline Commander | Emergency Drill Simulator",
  description:
    "A step-by-step disaster drill simulator for schools, clinics, and households.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

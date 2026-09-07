import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Truck Dispatch Platform",
  description:
    "Dispatch management for owner-operators, small fleets, and dispatch companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

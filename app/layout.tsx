import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Ajaia Docs — Collaborative documents",
  description: "A focused workspace for writing and sharing documents.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="app-body"
      >
        {children}
      </body>
    </html>
  );
}

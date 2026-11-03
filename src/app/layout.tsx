import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScottToDo",
  description: "Project tracker dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="bg-gray-50 text-gray-900 h-full overflow-hidden">
        {children}
      </body>
    </html>
  );
}

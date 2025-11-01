import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Administrative access to the Laaiqa platform",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
  openGraph: {
    title: "Admin Login - Laaiqa",
    description: "Administrative access",
  },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
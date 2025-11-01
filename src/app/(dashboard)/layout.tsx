import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your artistic services, quotes, and bookings on Laaiqa",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <>{children}</>;
  }
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Dashboard",
  description: "Browse artists, request quotes, manage bookings, and bring your creative projects to life on Laaiqa",
  openGraph: {
    title: "Customer Dashboard - Laaiqa",
    description: "Find artists and manage your creative projects",
    images: [
      {
        url: '/Laaiqa Coloured Favicon.png',
        width: 1200,
        height: 630,
        alt: 'Laaiqa Customer Dashboard',
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artist Dashboard",
  description: "Manage your artistic services, create quotes, track bookings, and grow your creative business on Laaiqa",
  openGraph: {
    title: "Artist Dashboard - Laaiqa",
    description: "Manage your artistic services and grow your creative business",
    images: [
      {
        url: '/Laaiqa Coloured Favicon.png',
        width: 1200,
        height: 630,
        alt: 'Laaiqa Artist Dashboard',
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artist Signup",
  description: "Join Laaiqa as an artist - Showcase your creative work, connect with clients, and grow your artistic business",
  openGraph: {
    title: "Artist Signup - Laaiqa",
    description: "Showcase your creative work and connect with clients",
    images: [
      {
        url: '/Laaiqa Coloured Favicon.png',
        width: 1200,
        height: 630,
        alt: 'Join Laaiqa as an Artist',
      },
    ],
  },
  keywords: [
    "artist signup",
    "creative professional",
    "art portfolio",
    "freelance artist",
    "creative services",
    "art business"
  ],
};

export default function ArtistSignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
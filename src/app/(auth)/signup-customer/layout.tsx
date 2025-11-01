import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Signup",
  description: "Join Laaiqa as a customer - Discover talented artists, request custom work, and bring your creative projects to life",
  openGraph: {
    title: "Customer Signup - Laaiqa",
    description: "Find talented artists for your creative projects",
    images: [
      {
        url: '/Laaiqa Coloured Favicon.png',
        width: 1200,
        height: 630,
        alt: 'Join Laaiqa as a Customer',
      },
    ],
  },
  keywords: [
    "find artists",
    "custom art",
    "creative projects",
    "art commission",
    "hire artist",
    "creative services"
  ],
};

export default function CustomerSignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
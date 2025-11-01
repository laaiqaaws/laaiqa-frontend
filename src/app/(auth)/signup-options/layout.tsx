import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Laaiqa",
  description: "Choose your account type - Join as an artist to showcase your work or as a customer to find creative talent",
  openGraph: {
    title: "Join Laaiqa - Choose Your Path",
    description: "Artist or Customer? Start your creative journey today",
    images: [
      {
        url: '/Laaiqa Coloured Favicon.png',
        width: 1200,
        height: 630,
        alt: 'Join Laaiqa - Artist or Customer',
      },
    ],
  },
};

export default function SignupOptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
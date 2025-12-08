import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Sign in or create your account to connect with professional artists on Laaiqa",
  openGraph: {
    title: "Join Laaiqa - Connect with Professional Artists",
    description: "Sign up as an artist to showcase your work or as a customer to find creative talent",
    images: [
      {
        url: '/Laaiqa Coloured Favicon.png',
        width: 1200,
        height: 630,
        alt: 'Join Laaiqa Platform',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-screen bg-[#1a1a1a]">
        {children}
      </div>
    );
  }
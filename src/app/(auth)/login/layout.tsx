import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Laaiqa account to access your dashboard and manage your artistic services or projects",
  openGraph: {
    title: "Sign In - Laaiqa",
    description: "Access your Laaiqa account",
    images: [
      {
        url: '/Laaiqa Coloured Favicon.png',
        width: 1200,
        height: 630,
        alt: 'Sign In to Laaiqa',
      },
    ],
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
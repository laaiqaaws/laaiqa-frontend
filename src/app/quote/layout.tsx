import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quote Details",
  description: "View and manage your custom art quote on Laaiqa",
  openGraph: {
    title: "Quote Details - Laaiqa",
    description: "Review your custom art quote and booking details",
    images: [
      {
        url: '/Laaiqa Coloured Favicon.png',
        width: 1200,
        height: 630,
        alt: 'Laaiqa Quote Details',
      },
    ],
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
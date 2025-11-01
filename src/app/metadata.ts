import type { Metadata } from "next";

export const homeMetadata: Metadata = {
  title: "Laaiqa - Connect with Professional Artists",
  description: "Discover and connect with talented artists for your creative projects. Book professional services, get custom quotes, and bring your artistic vision to life.",
  openGraph: {
    title: "Laaiqa - Professional Artist Platform",
    description: "Connect with talented artists and bring your creative projects to life",
    type: "website",
    images: [
      {
        url: '/Laaiqa Coloured Favicon.png',
        width: 1200,
        height: 630,
        alt: 'Laaiqa - Professional Artist Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Laaiqa - Connect with Professional Artists',
    description: 'Discover talented artists for your creative projects',
    images: ['/Laaiqa Coloured Favicon.png'],
  },
};
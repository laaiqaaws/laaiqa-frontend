import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono, Cormorant } from "next/font/google";
import "./globals.css";
import { StructuredData } from "@/components/seo/structured-data";
import { Toaster } from "sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"], 
  display: "swap",
});

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Laaiqa - Connect with Professional Artists",
    template: "%s | Laaiqa"
  },
  description: "Discover and connect with talented artists for your creative projects. Book professional services, get custom quotes, and bring your artistic vision to life with Laaiqa.",
  keywords: [
    "artists",
    "creative services", 
    "custom art",
    "professional artists",
    "art booking",
    "creative projects",
    "art marketplace",
    "artistic services"
  ],
  authors: [{ name: "Laaiqa Team" }],
  creator: "Laaiqa",
  publisher: "Laaiqa",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Laaiqa - Connect with Professional Artists',
    description: 'Discover and connect with talented artists for your creative projects. Book professional services, get custom quotes, and bring your artistic vision to life.',
    siteName: 'Laaiqa',
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
    description: 'Discover and connect with talented artists for your creative projects.',
    images: ['/Laaiqa Coloured Favicon.png'],
    creator: '@laaiqa',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/Laaiqa Coloured Favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/Laaiqa White Favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/Laaiqa Coloured Favicon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/Laaiqa White Favicon.png',
        color: '#C40F5A',
      },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#C40F5A' },
    { media: '(prefers-color-scheme: dark)', color: '#100D0F' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable} ${cormorant.variable}`}>
      <body className={`font-sans antialiased`}>
        <StructuredData type="organization" />
        <StructuredData type="website" />
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #2a2a2a',
            },
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
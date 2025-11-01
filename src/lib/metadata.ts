import type { Metadata, Viewport } from "next";

// Brand colors from your color palette
export const BRAND_COLORS = {
    primary: '#C40F5A',
    secondary: '#F46CA4',
    background: '#100D0F',
    surface: '#1A1518',
} as const;

// Base metadata configuration
export const baseMetadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    alternates: {
        canonical: '/',
    },
    authors: [{ name: "Laaiqa Team" }],
    creator: "Laaiqa",
    publisher: "Laaiqa",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
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
                color: BRAND_COLORS.primary,
            },
        ],
    },
    manifest: '/manifest.json',
};

// Base viewport configuration
export const baseViewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: BRAND_COLORS.primary },
        { media: '(prefers-color-scheme: dark)', color: BRAND_COLORS.background },
    ],
};

// Generate metadata for different page types
export function generatePageMetadata({
    title,
    description,
    path = '/',
    image = '/Laaiqa Coloured Favicon.png',
    noIndex = false,
    keywords = [],
}: {
    title: string;
    description: string;
    path?: string;
    image?: string;
    noIndex?: boolean;
    keywords?: string[];
}): Metadata {
    return {
        ...baseMetadata,
        title,
        description,
        keywords: [
            'Laaiqa',
            'artists',
            'creative services',
            'art platform',
            ...keywords,
        ],
        alternates: {
            canonical: path,
        },
        openGraph: {
            type: 'website',
            locale: 'en_US',
            url: path,
            title,
            description,
            siteName: 'Laaiqa',
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
            creator: '@laaiqa',
        },
        robots: {
            index: !noIndex,
            follow: !noIndex,
            googleBot: {
                index: !noIndex,
                follow: !noIndex,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

// Predefined metadata for common pages
export const pageMetadata = {
    home: generatePageMetadata({
        title: 'Laaiqa - Connect with Professional Artists',
        description: 'Discover and connect with talented artists for your creative projects. Book professional services, get custom quotes, and bring your artistic vision to life.',
        keywords: ['professional artists', 'creative projects', 'art booking', 'custom art'],
    }),

    login: generatePageMetadata({
        title: 'Sign In - Laaiqa',
        description: 'Sign in to your Laaiqa account to access your dashboard and manage your artistic services or projects.',
        path: '/login',
    }),

    signupOptions: generatePageMetadata({
        title: 'Join Laaiqa - Choose Your Path',
        description: 'Choose your account type - Join as an artist to showcase your work or as a customer to find creative talent.',
        path: '/signup-options',
        keywords: ['join laaiqa', 'artist signup', 'customer signup'],
    }),

    artistSignup: generatePageMetadata({
        title: 'Artist Signup - Laaiqa',
        description: 'Join Laaiqa as an artist - Showcase your creative work, connect with clients, and grow your artistic business.',
        path: '/signup-artist',
        keywords: ['artist signup', 'creative professional', 'art portfolio', 'freelance artist'],
    }),

    customerSignup: generatePageMetadata({
        title: 'Customer Signup - Laaiqa',
        description: 'Join Laaiqa as a customer - Discover talented artists, request custom work, and bring your creative projects to life.',
        path: '/signup-customer',
        keywords: ['find artists', 'custom art', 'art commission', 'hire artist'],
    }),

    artistDashboard: generatePageMetadata({
        title: 'Artist Dashboard - Laaiqa',
        description: 'Manage your artistic services, create quotes, track bookings, and grow your creative business.',
        path: '/artist',
        noIndex: true,
    }),

    customerDashboard: generatePageMetadata({
        title: 'Customer Dashboard - Laaiqa',
        description: 'Browse artists, request quotes, manage bookings, and bring your creative projects to life.',
        path: '/customer',
        noIndex: true,
    }),

    adminDashboard: generatePageMetadata({
        title: 'Admin Dashboard - Laaiqa',
        description: 'Platform administration and management tools.',
        path: '/admin',
        noIndex: true,
    }),
} as const;
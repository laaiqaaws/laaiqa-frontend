export interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: 'artist' | 'customer' | 'admin' | string;

    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
    phone?: string | null;

    gender?: string | null;

    height?: number | null;
    weight?: number | null;
    color?: string | null;
    ethnicity?: string | null;
    age?: number | null;
    other?: string | null;

    bio?: string | null;
    specialties?: string | null;
    portfolioLink?: string | null;
    bookingInfo?: string[] | null;
    services?: string[] | null;
    availableLocations?: string[] | null;

    bookingPreferences?: string[] | null;
    preferredArtists?: string[] | null;

    profileComplete?: boolean;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.laaiqa.app';
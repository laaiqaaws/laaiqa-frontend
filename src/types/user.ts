export interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: 'artist' | 'customer' | 'admin' | 'user' | string;

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

// Re-export API_BASE_URL from config for backward compatibility
export { API_BASE_URL } from '@/lib/config';
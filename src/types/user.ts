export interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: 'artist' | 'customer' | 'admin' | 'user' | string;

    // Common address fields
    address?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
    phone?: string | null;
    gender?: string | null;

    // Customer-specific physical attributes
    height?: number | null;
    weight?: number | null;
    color?: string | null;
    ethnicity?: string | null;
    age?: number | null;
    other?: string | null;

    // Artist-specific profile fields
    companyName?: string | null;
    category?: string | null;
    experience?: string | null;
    bio?: string | null;
    specialties?: string | null;
    portfolioLink?: string | null;
    services?: string[] | null;
    availableLocations?: string[] | null;

    // Artist booking settings
    advanceBookingDays?: number | null;
    bookingType?: string | null;
    paymentMethods?: string[] | null;
    allowPartialPayment?: boolean | null;
    bookingInfo?: string[] | null;

    // Customer preferences
    bookingPreferences?: string[] | null;
    preferredArtists?: string[] | null;

    profileComplete?: boolean;
}

// Re-export API_BASE_URL from config for backward compatibility
export { API_BASE_URL } from '@/lib/config';
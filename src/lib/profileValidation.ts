export interface ProfileValidationResult {
  isComplete: boolean;
  missingFields: string[];
  requiredFields: string[];
  optionalFields: string[];
}

export interface UserProfile {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  phone?: string | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  color?: string | null;
  ethnicity?: string | null;
  bio?: string | null;
  specialties?: string | null;
  services?: string[] | null;
  availableLocations?: string[] | null;
  bookingInfo?: string[] | null;
  bookingPreferences?: string[] | null;
  preferredArtists?: string[] | null;
  [key: string]: any;
}
export const PROFILE_FIELD_CONFIG = {
  artist: {
    // Minimum required fields for artist profile completion
    required: ['phone', 'address', 'city', 'state', 'zipCode', 'country'] as string[],
    optional: [
      'companyName', 'category', 'experience', 'bio', 'specialties', 
      'services', 'availableLocations', 'bookingInfo', 'portfolioLink',
      'addressLine2', 'advanceBookingDays', 'bookingType', 'paymentMethods', 'allowPartialPayment'
    ] as string[]
  },
  customer: {
    // Minimum required fields for customer profile completion
    required: ['phone', 'age', 'height', 'color', 'ethnicity', 'address', 'city', 'state', 'zipCode', 'country'] as string[],
    optional: ['weight', 'other', 'gender', 'addressLine2', 'bookingPreferences', 'preferredArtists'] as string[]
  },
  admin: {
    required: [] as string[],
    optional: [] as string[]
  },
  user: {
    // User role is temporary - they need to select artist or customer
    required: [] as string[],
    optional: [] as string[]
  }
};

export function validateProfileCompletion(user: UserProfile): ProfileValidationResult {
  if (!user || !user.role) {
    return {
      isComplete: false,
      missingFields: ['role'],
      requiredFields: ['role'],
      optionalFields: []
    };
  }

  // Basic required fields for all users
  const basicRequiredFields = ['name'];
  const missingBasicFields = basicRequiredFields.filter(field => !user[field]);

  if (missingBasicFields.length > 0) {
    return {
      isComplete: false,
      missingFields: missingBasicFields,
      requiredFields: basicRequiredFields,
      optionalFields: []
    };
  }

  const roleConfig = PROFILE_FIELD_CONFIG[user.role as 'artist' | 'customer' | 'admin' | 'user'];
  
  if (!roleConfig) {
    return {
      isComplete: false,
      missingFields: ['valid_role'],
      requiredFields: ['valid_role'],
      optionalFields: []
    };
  }

  // User role is temporary - profile is incomplete until they select artist/customer
  if (user.role === 'user') {
    return {
      isComplete: false,
      missingFields: ['role_selection'],
      requiredFields: ['role_selection'],
      optionalFields: []
    };
  }

  if (user.role === 'admin') {
    return {
      isComplete: true,
      missingFields: [],
      requiredFields: [],
      optionalFields: []
    };
  }

  const allRequiredFields = [...basicRequiredFields, ...roleConfig.required];
  const missingFields = allRequiredFields.filter(field => {
    const value = user[field];
    return value === null || value === undefined || 
           (typeof value === 'string' && value.trim() === '') || 
           (typeof value === 'number' && isNaN(value));
  });

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    requiredFields: allRequiredFields,
    optionalFields: roleConfig.optional
  };
}

export function isFieldRequired(fieldName: string, role: string): boolean {
  const basicRequired = ['name'];
  if (basicRequired.includes(fieldName)) return true;

  const roleConfig = PROFILE_FIELD_CONFIG[role as 'artist' | 'customer' | 'admin' | 'user'];
  return roleConfig ? roleConfig.required.includes(fieldName) : false;
}

export function isFieldOptional(fieldName: string, role: string): boolean {
  const roleConfig = PROFILE_FIELD_CONFIG[role as 'artist' | 'customer' | 'admin' | 'user'];
  return roleConfig ? roleConfig.optional.includes(fieldName) : false;
}

export function getAllowedFields(role: string): string[] {
  const basicFields = ['name', 'role'];
  const roleConfig = PROFILE_FIELD_CONFIG[role as 'artist' | 'customer' | 'admin' | 'user'];
  
  if (!roleConfig) return basicFields;
  
  return [...basicFields, ...roleConfig.required, ...roleConfig.optional];
}

export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  age: 'Age',
  height: 'Height',
  weight: 'Weight',
  color: 'Skin Color',
  ethnicity: 'Ethnicity',
  bio: 'Bio',
  specialties: 'Specialties',
  address: 'Street Address',
  addressLine2: 'Address Line 2',
  city: 'City',
  state: 'State',
  zipCode: 'ZIP Code',
  country: 'Country',
  gender: 'Gender',
  other: 'Additional Information',
  services: 'Services Offered',
  availableLocations: 'Available Locations',
  bookingInfo: 'Booking Information',
  portfolioLink: 'Portfolio Link',
  bookingPreferences: 'Booking Preferences',
  preferredArtists: 'Preferred Artists',
  companyName: 'Company/Studio Name',
  category: 'Category',
  experience: 'Experience',
  advanceBookingDays: 'Advance Booking Days',
  bookingType: 'Booking Type',
  paymentMethods: 'Payment Methods',
  allowPartialPayment: 'Allow Partial Payment'
};

export function getMissingFieldNames(missingFields: string[]): string[] {
  return missingFields.map(field => FIELD_DISPLAY_NAMES[field] || field);
}
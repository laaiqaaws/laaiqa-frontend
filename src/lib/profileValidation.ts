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
    required: ['bio', 'specialties', 'phone', 'address', 'city', 'state', 'zipCode', 'country'] as string[],
    optional: ['services', 'availableLocations', 'bookingInfo', 'portfolioLink'] as string[]
  },
  customer: {
    required: ['phone', 'age', 'height', 'color', 'ethnicity', 'address', 'city', 'state', 'zipCode', 'country'] as string[],
    optional: ['weight', 'other', 'gender', 'bookingPreferences', 'preferredArtists'] as string[]
  },
  admin: {
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

  const roleConfig = PROFILE_FIELD_CONFIG[user.role as 'artist' | 'customer' | 'admin'];
  
  if (!roleConfig) {
    return {
      isComplete: false,
      missingFields: ['valid_role'],
      requiredFields: ['valid_role'],
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

  const roleConfig = PROFILE_FIELD_CONFIG[role as 'artist' | 'customer' | 'admin'];
  return roleConfig ? roleConfig.required.includes(fieldName) : false;
}

export function isFieldOptional(fieldName: string, role: string): boolean {
  const roleConfig = PROFILE_FIELD_CONFIG[role as 'artist' | 'customer' | 'admin'];
  return roleConfig ? roleConfig.optional.includes(fieldName) : false;
}

export function getAllowedFields(role: string): string[] {
  const basicFields = ['name', 'role'];
  const roleConfig = PROFILE_FIELD_CONFIG[role as 'artist' | 'customer' | 'admin'];
  
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
  preferredArtists: 'Preferred Artists'
};

export function getMissingFieldNames(missingFields: string[]): string[] {
  return missingFields.map(field => FIELD_DISPLAY_NAMES[field] || field);
}
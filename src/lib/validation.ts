/**
 * Input validation utilities for user data (Frontend)
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Indian phone number regex (10 digits, optionally with +91 or 0 prefix)
const INDIAN_PHONE_REGEX = /^(?:\+91|91|0)?[6-9]\d{9}$/;

// Indian PIN code regex (6 digits)
const INDIAN_PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;

// Email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL regex (basic)
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

// Name regex (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-Z\s'-]{2,100}$/;

/**
 * Validate phone number (Indian format)
 */
export function validatePhone(phone: string | null | undefined): string | null {
  if (!phone) return 'Phone number is required';

  const cleaned = phone.replace(/[\s-]/g, '');
  if (!INDIAN_PHONE_REGEX.test(cleaned)) {
    return 'Please enter a valid 10-digit Indian phone number';
  }
  return null;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  // Remove country code prefix if present
  let digits = cleaned;
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  // Format as XXX-XXX-XXXX
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Validate PIN code (Indian format)
 */
export function validatePinCode(pinCode: string | null | undefined): string | null {
  if (!pinCode) return 'PIN code is required';

  const cleaned = pinCode.replace(/\s/g, '');
  if (!INDIAN_PIN_CODE_REGEX.test(cleaned)) {
    return 'Please enter a valid 6-digit PIN code';
  }
  return null;
}

/**
 * Validate email
 */
export function validateEmail(email: string | null | undefined): string | null {
  if (!email) return 'Email is required';
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validate URL
 */
export function validateUrl(
  url: string | null | undefined,
  fieldName: string = 'URL'
): string | null {
  if (!url) return null; // URLs are often optional
  if (!URL_REGEX.test(url)) {
    return `Please enter a valid ${fieldName}`;
  }
  return null;
}

/**
 * Validate name
 */
export function validateName(name: string | null | undefined): string | null {
  if (!name) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 100) return 'Name must be less than 100 characters';
  if (!NAME_REGEX.test(name.trim())) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return null;
}

/**
 * Validate age
 */
export function validateAge(age: number | string | null | undefined): string | null {
  if (age === null || age === undefined || age === '') return 'Age is required';

  const numAge = typeof age === 'string' ? parseInt(age, 10) : age;
  if (isNaN(numAge)) return 'Age must be a number';
  if (!Number.isInteger(numAge)) return 'Age must be a whole number';
  if (numAge < 18) return 'You must be at least 18 years old';
  if (numAge > 120) return 'Please enter a valid age';
  return null;
}

/**
 * Validate height (in cm)
 */
export function validateHeight(height: number | string | null | undefined): string | null {
  if (height === null || height === undefined || height === '') return 'Height is required';

  const numHeight = typeof height === 'string' ? parseFloat(height) : height;
  if (isNaN(numHeight)) return 'Height must be a number';
  if (numHeight < 50 || numHeight > 300) {
    return 'Please enter a valid height in centimeters (50-300 cm)';
  }
  return null;
}

/**
 * Validate weight (in kg)
 */
export function validateWeight(weight: number | string | null | undefined): string | null {
  if (weight === null || weight === undefined || weight === '') return null; // Often optional

  const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight;
  if (isNaN(numWeight)) return 'Weight must be a number';
  if (numWeight < 20 || numWeight > 500) {
    return 'Please enter a valid weight in kilograms (20-500 kg)';
  }
  return null;
}

/**
 * Validate required string field
 */
export function validateRequiredString(
  value: string | null | undefined,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 5000
): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  if (value.trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  if (value.trim().length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`;
  }
  return null;
}

/**
 * Validate optional string field
 */
export function validateOptionalString(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number = 5000
): string | null {
  if (!value) return null;
  if (value.trim().length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`;
  }
  return null;
}

/**
 * Validate address fields
 */
export function validateAddress(data: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  const addressError = validateRequiredString(data.address, 'Address', 5, 200);
  if (addressError) errors.address = addressError;

  const cityError = validateRequiredString(data.city, 'City', 2, 100);
  if (cityError) errors.city = cityError;

  const stateError = validateRequiredString(data.state, 'State', 2, 100);
  if (stateError) errors.state = stateError;

  const zipCodeError = validatePinCode(data.zipCode);
  if (zipCodeError) errors.zipCode = zipCodeError;

  const countryError = validateRequiredString(data.country, 'Country', 2, 100);
  if (countryError) errors.country = countryError;

  return errors;
}

/**
 * Validate artist profile data
 */
export function validateArtistProfile(data: {
  bio?: string | null;
  specialties?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  portfolioLink?: string | null;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const bioError = validateRequiredString(data.bio, 'Bio', 10, 2000);
  if (bioError) errors.bio = bioError;

  const specialtiesError = validateRequiredString(data.specialties, 'Specialties', 3, 500);
  if (specialtiesError) errors.specialties = specialtiesError;

  const phoneError = validatePhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const addressErrors = validateAddress(data);
  Object.assign(errors, addressErrors);

  const portfolioError = validateUrl(data.portfolioLink, 'Portfolio link');
  if (portfolioError) errors.portfolioLink = portfolioError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate customer profile data
 */
export function validateCustomerProfile(data: {
  phone?: string | null;
  age?: number | string | null;
  height?: number | string | null;
  weight?: number | string | null;
  color?: string | null;
  ethnicity?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const phoneError = validatePhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const ageError = validateAge(data.age);
  if (ageError) errors.age = ageError;

  const heightError = validateHeight(data.height);
  if (heightError) errors.height = heightError;

  const weightError = validateWeight(data.weight);
  if (weightError) errors.weight = weightError;

  const colorError = validateRequiredString(data.color, 'Skin color', 2, 50);
  if (colorError) errors.color = colorError;

  const ethnicityError = validateRequiredString(data.ethnicity, 'Ethnicity', 2, 100);
  if (ethnicityError) errors.ethnicity = ethnicityError;

  const addressErrors = validateAddress(data);
  Object.assign(errors, addressErrors);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Field display names for error messages
 */
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
  zipCode: 'PIN Code',
  country: 'Country',
  gender: 'Gender',
  other: 'Additional Information',
  services: 'Services Offered',
  availableLocations: 'Available Locations',
  bookingInfo: 'Booking Information',
  portfolioLink: 'Portfolio Link',
  bookingPreferences: 'Booking Preferences',
  preferredArtists: 'Preferred Artists',
};

/**
 * Get display name for a field
 */
export function getFieldDisplayName(field: string): string {
  return FIELD_DISPLAY_NAMES[field] || field;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string>): string[] {
  return Object.entries(errors).map(([field, error]) => {
    const displayName = getFieldDisplayName(field);
    // If error already contains field name, return as is
    if (error.toLowerCase().includes(displayName.toLowerCase())) {
      return error;
    }
    return `${displayName}: ${error}`;
  });
}

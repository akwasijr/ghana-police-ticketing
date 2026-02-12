// Validation Utilities

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Generic validators
export function isRequired(value: unknown, fieldName = 'This field'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (Array.isArray(value) && value.length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
}

export function minLength(value: string, min: number, fieldName = 'This field'): ValidationResult {
  if (value.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  return { isValid: true };
}

export function maxLength(value: string, max: number, fieldName = 'This field'): ValidationResult {
  if (value.length > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max} characters` };
  }
  return { isValid: true };
}

export function isEmail(value: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true };
}

// Ghana-specific validators

/**
 * Validate Ghana vehicle registration number
 * Formats: GR-1234-20, AS 5678 21, etc.
 */
export function isValidVehicleRegistration(value: string): ValidationResult {
  // Normalize: remove spaces and hyphens, convert to uppercase
  const normalized = value.toUpperCase().replace(/[\s-]/g, '');
  
  // Check against standard pattern: 2 letters + 4 digits + 2 digits
  const standardPattern = /^[A-Z]{2}\d{4}\d{2}$/;
  
  if (!standardPattern.test(normalized)) {
    return { 
      isValid: false, 
      error: 'Invalid registration format. Expected: XX-0000-00 (e.g., GR-1234-20)' 
    };
  }

  // Validate the region prefix (first 2 letters)
  const validPrefixes = [
    'GR', 'GS', 'GW', 'GE', 'GC', 'GN', 'GV', 'GT', 'GX', // Greater regions
    'AS', 'BA', 'WR', 'ER', 'CR', 'NR', 'VR', 'UE', 'UW', // Regional
    'AH', 'BO', 'BE', 'OT', 'SV', 'NE', 'WN', // New regions
    'GV', // Government
    'CD', // Diplomatic
    'GT', 'GN', 'GC', 'GR', // Commercial
  ];
  
  const prefix = normalized.substring(0, 2);
  if (!validPrefixes.includes(prefix)) {
    // Still valid, just unknown prefix
    console.warn(`Unknown vehicle prefix: ${prefix}`);
  }

  return { isValid: true };
}

/**
 * Validate Ghana phone number
 * Formats: +233XXXXXXXXX, 0XXXXXXXXX
 */
export function isValidGhanaPhone(value: string): ValidationResult {
  // Remove all non-digits except +
  const cleaned = value.replace(/[^\d+]/g, '');
  
  // Check for Ghana formats
  // +233 20/23/24/25/26/27/28/50/54/55/56/57/59 XXX XXXX
  // 020/023/024/025/026/027/028/050/054/055/056/057/059 XXX XXXX
  
  const ghanaInternational = /^\+233[235]\d{8}$/;
  const ghanaLocal = /^0[235]\d{8}$/;
  
  if (!ghanaInternational.test(cleaned) && !ghanaLocal.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'Invalid phone number. Expected: 0XX XXX XXXX or +233 XX XXX XXXX' 
    };
  }

  return { isValid: true };
}

/**
 * Normalize Ghana phone number to international format
 */
export function normalizeGhanaPhone(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+233' + cleaned.substring(1);
  }
  
  if (cleaned.startsWith('+233') && cleaned.length === 13) {
    return cleaned;
  }
  
  if (cleaned.startsWith('233') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate driver's license number
 */
export function isValidLicenseNumber(value: string): ValidationResult {
  // Ghana license format varies, basic check for alphanumeric
  const cleaned = value.replace(/[\s-]/g, '').toUpperCase();
  
  if (cleaned.length < 6 || cleaned.length > 20) {
    return { 
      isValid: false, 
      error: 'License number should be between 6 and 20 characters' 
    };
  }
  
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'License number should only contain letters and numbers' 
    };
  }

  return { isValid: true };
}

/**
 * Validate amount (fine)
 */
export function isValidAmount(value: number, min = 0, max = 100000): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  if (value < min) {
    return { isValid: false, error: `Amount must be at least GH₵${min}` };
  }
  if (value > max) {
    return { isValid: false, error: `Amount cannot exceed GH₵${max}` };
  }
  return { isValid: true };
}

/**
 * Validate badge number
 */
export function isValidBadgeNumber(value: string): ValidationResult {
  const cleaned = value.replace(/[\s-]/g, '').toUpperCase();
  
  // Basic format: alphanumeric, 5-15 characters
  if (cleaned.length < 5 || cleaned.length > 15) {
    return { 
      isValid: false, 
      error: 'Badge number should be between 5 and 15 characters' 
    };
  }
  
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'Badge number should only contain letters and numbers' 
    };
  }

  return { isValid: true };
}

/**
 * Validate password
 */
export function isValidPassword(value: string): ValidationResult {
  if (value.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(value)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(value)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(value)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

// Composite validator
export function validate(
  value: unknown,
  validators: Array<(val: unknown) => ValidationResult>
): ValidationResult {
  for (const validator of validators) {
    const result = validator(value);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}

// Form validation helper
export interface FormErrors {
  [key: string]: string | undefined;
}

export function validateForm<T extends Record<string, unknown>>(
  data: T,
  rules: Record<keyof T, Array<(val: unknown) => ValidationResult>>
): { isValid: boolean; errors: FormErrors } {
  const errors: FormErrors = {};
  let isValid = true;

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field as keyof T];
    const result = validate(value, fieldRules as Array<(val: unknown) => ValidationResult>);
    
    if (!result.isValid) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

// Alias functions for convenience
export function validateVehicleRegistration(value: string): boolean {
  return isValidVehicleRegistration(value).isValid;
}

export function validatePhoneNumber(value: string): boolean {
  return isValidGhanaPhone(value).isValid;
}

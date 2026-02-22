export const validateName = (name: string): { isValid: boolean; error?: string } => {
  // Trim whitespace
  const trimmedName = name.trim();
  
  // Check if empty
  if (!trimmedName) {
    return { isValid: false, error: 'Name is required' };
  }

  // Check length (2-50 characters)
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Name must not exceed 50 characters' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  // Check for excessive whitespace
  if (/\s{2,}/.test(trimmedName)) {
    return { isValid: false, error: 'Name cannot contain multiple consecutive spaces' };
  }

  return { isValid: true };
};

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  // Trim whitespace
  const trimmedEmail = email.trim().toLowerCase();
  
  // Check if empty
  if (!trimmedEmail) {
    return { isValid: false, error: 'Email is required' };
  }

  // Check length (max 254 characters as per RFC 5321)
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email must not exceed 254 characters' };
  }

  // Check email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): { isValid: boolean; error?: string; strength?: number } => {
  // Check if empty
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  // Check length (8-128 characters)
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  if (password.length > 128) {
    return { isValid: false, error: 'Password must not exceed 128 characters' };
  }

  // Check for required character types
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Calculate password strength (0-4)
  let strength = 0;
  if (hasUpperCase) strength++;
  if (hasLowerCase) strength++;
  if (hasNumbers) strength++;
  if (hasSpecialChar) strength++;

  // Check for common passwords
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'welcome',
    'letmein', 'monkey', 'dragon', 'baseball', 'football'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'Please choose a stronger password' };
  }

  // Check for keyboard patterns
  const keyboardPatterns = [
    'qwerty', 'asdfgh', 'zxcvbn', '123456', '654321',
    'qazwsx', '1qaz2wsx', '!qaz@wsx'
  ];
  if (keyboardPatterns.includes(password.toLowerCase())) {
    return { isValid: false, error: 'Please avoid keyboard patterns in your password' };
  }

  // Check for minimum requirements
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      strength
    };
  }

  return { isValid: true, strength };
};

export function validateRegistration(data: {
  fullName: string;
  email: string;
  password: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate full name
  if (!data.fullName?.trim()) {
    errors.fullName = 'Full name is required';
  } else if (data.fullName.trim().length > 100) {
    errors.fullName = 'Full name must be less than 100 characters';
  } else if (!/^[a-zA-Z\s-']+$/.test(data.fullName.trim())) {
    errors.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes';
  }

  // Validate email
  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (data.email.trim().length > 254) {
    errors.email = 'Email must be less than 254 characters';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate password
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  } else if (data.password.length > 128) {
    errors.password = 'Password must be less than 128 characters';
  } else if (!/(?=.*[a-z])/.test(data.password)) {
    errors.password = 'Password must contain at least one lowercase letter';
  } else if (!/(?=.*[A-Z])/.test(data.password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  } else if (!/(?=.*\d)/.test(data.password)) {
    errors.password = 'Password must contain at least one number';
  } else if (!/(?=.*[!@#$%^&*])/.test(data.password)) {
    errors.password = 'Password must contain at least one special character (!@#$%^&*)';
  }

  return errors;
} 
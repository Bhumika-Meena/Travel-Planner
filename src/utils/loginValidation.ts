export const validateLoginEmail = (email: string): { isValid: boolean; error?: string } => {
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

export const validateLoginPassword = (password: string): { isValid: boolean; error?: string } => {
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

  return { isValid: true };
}; 
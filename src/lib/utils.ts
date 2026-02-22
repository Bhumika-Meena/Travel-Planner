export function calculateLevel(points: number): number {
  // Level calculation formula: level = floor(sqrt(points / 100)) + 1
  // This means:
  // - 0-99 points = Level 1
  // - 100-399 points = Level 2
  // - 400-899 points = Level 3
  // - 900-1599 points = Level 4
  // And so on...
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatPoints(points: number): string {
  return points.toLocaleString();
}

export const sanitizeInput = (input: string): string => {
  // Remove HTML tags
  const sanitized = input.replace(/<[^>]*>/g, '');
  // Remove potentially dangerous characters
  return sanitized.replace(/[<>{}[\]\\]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateName = (name: string): boolean => {
  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 50;
};

export const validateBio = (bio: string): boolean => {
  // Allow letters, numbers, spaces, and common punctuation
  const bioRegex = /^[a-zA-Z0-9\s.,!?'"-]+$/;
  return bio.length <= 500; // Limit bio length to 500 characters
}; 
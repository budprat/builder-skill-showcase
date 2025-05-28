
// Security utilities for client-side validation and sanitization

export const sanitizeInput = (input: string, maxLength: number = 255): string => {
  if (!input) return '';
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, ''); // Remove data: protocol
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100);
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let attempts = this.attempts.get(key) || [];
    attempts = attempts.filter(time => time > windowStart);
    
    if (attempts.length >= maxAttempts) {
      return false;
    }
    
    attempts.push(now);
    this.attempts.set(key, attempts);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// CSRF token management
export const generateCSRFToken = (): string => {
  return crypto.getRandomValues(new Uint32Array(4)).join('-');
};

export const validateCSRFToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken;
};

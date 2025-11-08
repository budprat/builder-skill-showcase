/**
 * Input validation utilities
 * Centralized validation logic for forms and user inputs
 */

/**
 * Validate URL format and optionally check if it's from allowed domains
 *
 * @param url - URL string to validate
 * @param allowedDomains - Optional array of allowed domains (e.g., ['github.com', 'gitlab.com'])
 * @returns Object with isValid flag and error message if invalid
 */
export const validateURL = (
  url: string,
  allowedDomains?: string[]
): { isValid: boolean; error?: string } => {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    // Check allowed domains if specified
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = urlObj.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(domain =>
        hostname === domain.toLowerCase() || hostname.endsWith(`.${domain.toLowerCase()}`)
      );

      if (!isAllowed) {
        return {
          isValid: false,
          error: `URL must be from one of: ${allowedDomains.join(', ')}`
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validate repository URL (GitHub, GitLab, Bitbucket)
 *
 * @param url - Repository URL
 * @returns Validation result
 */
export const validateRepositoryURL = (url: string) => {
  return validateURL(url, ['github.com', 'gitlab.com', 'bitbucket.org']);
};

/**
 * Validate video URL (YouTube, Vimeo, Loom)
 *
 * @param url - Video URL
 * @returns Validation result
 */
export const validateVideoURL = (url: string) => {
  return validateURL(url, ['youtube.com', 'youtu.be', 'vimeo.com', 'loom.com']);
};

/**
 * Validate file size
 *
 * @param fileSize - File size in bytes
 * @param maxSizeMB - Maximum allowed size in MB
 * @returns Validation result
 */
export const validateFileSize = (
  fileSize: number,
  maxSizeMB: number
): { isValid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (fileSize > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB (current: ${(fileSize / 1024 / 1024).toFixed(2)}MB)`
    };
  }

  return { isValid: true };
};

/**
 * Validate file type based on MIME type or extension
 *
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file
 * @param allowedTypes - Allowed MIME types or extensions (e.g., ['application/pdf', '.pdf', '.doc'])
 * @returns Validation result
 */
export const validateFileType = (
  fileName: string,
  mimeType: string,
  allowedTypes: string[]
): { isValid: boolean; error?: string } => {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase();

  const isAllowed = allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return extension === type.toLowerCase();
    }
    return mimeType.toLowerCase() === type.toLowerCase();
  });

  if (!isAllowed) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { isValid: true };
};

/**
 * File upload configuration constants
 */
export const FILE_UPLOAD_LIMITS = {
  CV: {
    maxSizeMB: 10,
    allowedTypes: ['application/pdf', '.pdf', '.doc', '.docx'],
    description: 'PDF or DOC files up to 10MB'
  },
  DOCUMENT: {
    maxSizeMB: 50,
    allowedTypes: [
      'application/pdf', '.pdf',
      'application/msword', '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx',
      'image/jpeg', '.jpg', '.jpeg',
      'image/png', '.png'
    ],
    description: 'PDF, DOC, DOCX, JPG, or PNG files up to 50MB'
  },
  IMAGE: {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', '.jpg', '.jpeg', 'image/png', '.png', 'image/webp', '.webp'],
    description: 'JPG, PNG, or WebP images up to 5MB'
  }
} as const;

/**
 * Validate complete file for upload
 *
 * @param file - File object to validate
 * @param fileType - Type of file (CV, DOCUMENT, IMAGE)
 * @returns Validation result
 */
export const validateFileUpload = (
  file: File,
  fileType: keyof typeof FILE_UPLOAD_LIMITS
): { isValid: boolean; error?: string } => {
  const limits = FILE_UPLOAD_LIMITS[fileType];

  // Validate size
  const sizeValidation = validateFileSize(file.size, limits.maxSizeMB);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate type
  const typeValidation = validateFileType(file.name, file.type, limits.allowedTypes);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  return { isValid: true };
};

/**
 * Sanitize text input to prevent XSS
 * Note: React already escapes by default, but this provides extra safety for special cases
 *
 * @param input - User input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 *
 * @param email - Email address
 * @returns Validation result
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
};

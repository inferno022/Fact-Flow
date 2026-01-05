// Security utilities for Fact Flow

// Rate limiting for API calls
const rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

export const checkRateLimit = (key: string, maxRequests: number = 30, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const limit = rateLimits.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false; // Rate limited
  }
  
  limit.count++;
  return true;
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 500); // Limit length
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate username
export const isValidUsername = (username: string): boolean => {
  // 2-30 chars, alphanumeric, underscores, spaces allowed
  const usernameRegex = /^[a-zA-Z0-9_ ]{2,30}$/;
  return usernameRegex.test(username);
};

// Generate secure random ID
export const generateSecureId = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

// Hash content for deduplication (not for passwords)
export const hashContent = async (content: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(content.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
};

// Detect suspicious activity patterns
export const detectSuspiciousActivity = (actions: { type: string; timestamp: number }[]): boolean => {
  if (actions.length < 10) return false;
  
  // Check for rapid-fire actions (bot behavior)
  const recentActions = actions.filter(a => Date.now() - a.timestamp < 5000);
  if (recentActions.length > 20) return true; // More than 20 actions in 5 seconds
  
  // Check for repetitive patterns
  const lastFive = actions.slice(-5).map(a => a.type);
  if (new Set(lastFive).size === 1) return true; // Same action 5 times in a row
  
  return false;
};

// Obfuscate sensitive data for logging
export const obfuscate = (value: string): string => {
  if (!value || value.length < 4) return '***';
  return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
};

// Content Security Policy headers (for web)
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://cdn.tailwindcss.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://pagead2.googlesyndication.com",
    "frame-src https://googleads.g.doubleclick.net",
    "media-src 'self' blob:",
  ].join('; ')
};

// Validate fact content (prevent injection)
export const validateFactContent = (fact: any): boolean => {
  if (!fact || typeof fact !== 'object') return false;
  if (!fact.content || typeof fact.content !== 'string') return false;
  if (fact.content.length > 500) return false;
  if (/<script|javascript:|on\w+=/i.test(fact.content)) return false;
  return true;
};

// Session fingerprint for detecting session hijacking
export const getSessionFingerprint = (): string => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
  ];
  return btoa(components.join('|')).slice(0, 32);
};

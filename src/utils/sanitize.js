import DOMPurify from 'dompurify';

/**
 * Sanitize user-generated content to prevent XSS attacks
 */

// Configure DOMPurify with strict settings
const config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'blockquote',
    'ul', 'ol', 'li', 'a', 'code', 'pre', 'h3', 'h4', 'h5', 'h6'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  ADD_ATTR: ['target', 'rel'],
  ADD_TAGS: [],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
};

// Additional hooks for extra safety
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Set target="_blank" and rel="noopener noreferrer" for all links
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Sanitize HTML content
 * @param {string} dirty - The HTML string to sanitize
 * @param {object} customConfig - Optional custom configuration
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHTML = (dirty, customConfig = {}) => {
  if (!dirty) return '';
  
  const mergedConfig = { ...config, ...customConfig };
  return DOMPurify.sanitize(dirty, mergedConfig);
};

/**
 * Sanitize plain text (removes all HTML)
 * @param {string} dirty - The text to sanitize
 * @returns {string} - Plain text without HTML
 */
export const sanitizeText = (dirty) => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
};

/**
 * Sanitize and truncate text for previews
 * @param {string} text - The text to process
 * @param {number} maxLength - Maximum length
 * @returns {string} - Sanitized and truncated text
 */
export const sanitizePreview = (text, maxLength = 200) => {
  if (!text) return '';
  
  const clean = sanitizeText(text);
  if (clean.length <= maxLength) return clean;
  
  return clean.substring(0, maxLength).trim() + '...';
};

/**
 * Sanitize user input for database storage
 * @param {object} data - Object containing user input
 * @returns {object} - Sanitized object
 */
export const sanitizeUserInput = (data) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // For content fields, allow some HTML
      if (key === 'content' || key === 'body' || key === 'description') {
        sanitized[key] = sanitizeHTML(value);
      } else {
        // For other fields, strip all HTML
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeUserInput(value);
    } else {
      // Keep other types as-is
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export const sanitizeURL = (url) => {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    // Try adding protocol if missing
    try {
      const withProtocol = `https://${url}`;
      const parsed = new URL(withProtocol);
      return parsed.href;
    } catch {
      return null;
    }
  }
};

/**
 * Escape HTML entities for display in code blocks
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export const escapeHTML = (str) => {
  if (!str) return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Remove scripts from HTML string (extra precaution)
 * @param {string} html - HTML string
 * @returns {string} - HTML without scripts
 */
export const removeScripts = (html) => {
  if (!html) return '';
  
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return 'file';
  
  // Remove path traversal attempts and special characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (!email) return null;
  
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(cleaned) ? cleaned : null;
};

/**
 * Create safe excerpt from HTML content
 * @param {string} html - HTML content
 * @param {number} length - Maximum length
 * @returns {string} - Plain text excerpt
 */
export const createExcerpt = (html, length = 150) => {
  if (!html) return '';
  
  // Strip HTML and create excerpt
  const text = sanitizeText(html);
  const words = text.split(/\s+/);
  
  if (words.length <= length) return text;
  
  return words.slice(0, length).join(' ') + '...';
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizePreview,
  sanitizeUserInput,
  sanitizeURL,
  escapeHTML,
  removeScripts,
  sanitizeFilename,
  sanitizeEmail,
  createExcerpt
};

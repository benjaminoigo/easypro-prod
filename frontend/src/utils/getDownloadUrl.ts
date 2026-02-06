export const getDownloadUrl = (filePath?: string): string => {
  if (!filePath) return '';

  const apiBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
  const normalized = filePath.replace(/\\/g, '/');

  if (/^https?:\/\//i.test(normalized)) return normalized;

  // Strip any leading ./uploads or uploads/ segments
  const trimmed = normalized.replace(/^[./]*uploads\//, '').replace(/^\/+/, '');

  // Encode individual path segments to keep spaces/special chars safe
  const encoded = trimmed
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  return `${apiBaseUrl}/uploads/${encoded}`;
};

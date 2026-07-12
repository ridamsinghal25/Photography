export const ACCEPTED_MIME_TYPES = new Set([
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export const ACCEPT_ATTR = [...ACCEPTED_MIME_TYPES].join(",");

export const MAX_BYTES = 10 * 1024 * 1024;

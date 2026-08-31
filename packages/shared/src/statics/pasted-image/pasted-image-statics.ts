/**
 * PURPOSE: Single home for the numeric ceilings, accepted formats, and text patterns every layer of
 * the paste-an-image path agrees on — the browser's downscale ladder, the server's accept/reject
 * checks, and the prompt trailer that tells the model images are attached. Reach for this whenever
 * code needs to decide whether a pasted image is acceptable, or needs to recognize the placeholder
 * or token shape a message uses to reference one.
 *
 * USAGE:
 * pastedImageStatics.maxBytesPerImage;
 * // Returns 5242880, the decoded byte ceiling one image may not exceed
 */

export const pastedImageStatics = {
  maxImagesPerMessage: 5,
  maxBytesPerImage: 5242880,
  maxLongestEdgePx: 2000,
  minLongestEdgePx: 512,
  jpegQuality: 0.85,
  allowedMediaTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  allowedExtensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
  placeholderPattern: '\\[Pasted Image (\\d+)\\]',
  imageTokenPattern: '!\\[Pasted Image (\\d+)\\]\\(([^)]+)\\)',
  promptSentinel: '<!-- dungeonmaster:images -->',
  promptInstruction: 'Read every image referenced above before answering.',
} as const;

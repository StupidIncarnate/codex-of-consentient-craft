/**
 * PURPOSE: One source read by three independent places — the browser's paste handler, the server's
 * image-serve route, and the orchestrator's prompt builder — so a clipboard image is capped,
 * downscaled, referenced and announced to the agent the same way regardless of which of the three
 * reads it.
 *
 * USAGE:
 * pastedImageStatics.maxImagesPerMessage;
 * // Returns the per-message image cap the browser and server both enforce
 *
 * Five images at the per-image byte ceiling puts roughly 35 MB of base64 in one request body; the
 * server re-checks the same count and answers 400 on a sixth rather than trusting the browser alone.
 *
 * The byte ceiling matches what the Anthropic API itself enforces per image, so a paste that clears
 * this static never fails again downstream on size.
 *
 * Oversized pastes run a downscale ladder: first attempt caps the longest edge at
 * `maxLongestEdgePx`, then halves toward `minLongestEdgePx`. Still over the byte ceiling at the
 * floor means the paste is refused rather than mangled into something illegible. `jpegQuality` is
 * the re-encode quality the ladder switches to once PNG alone cannot get under the ceiling.
 *
 * `allowedMediaTypes` is the one list `pastedImageMediaTypeContract` builds its zod enum from, so the
 * browser's paste-time check and the server's body validation parse against the same set instead of
 * two lists that can drift. `allowedExtensions` is narrower and serves a different boundary: the
 * image-serve route reads a path only when its extension is on this list, so the route can never be
 * pointed at an arbitrary file (a private key, a `.env`) by extension alone.
 *
 * `placeholderPattern` is the token the browser drops in at a thumbnail's position before the image
 * has a path; the server's rewrite step finds it by this pattern and replaces it with
 * `imageTokenPattern` once the file is saved, where group 1 is the same one-based-per-message ordinal
 * and group 2 is the resolved path or URL. The normaliser that later compares message text reduces a
 * rewritten `imageTokenPattern` match back down to its `placeholderPattern` form, so a message is
 * recognized as unchanged across the rewrite.
 *
 * `promptSentinel` opens a trailer appended only to messages carrying image tokens; the user-message
 * renderer drops the sentinel line and everything after it before showing the bubble, and the same
 * normaliser cuts the identical span before its duplicate check, so the trailer is invisible in the
 * UI and inert against that comparison. `promptInstruction` is the one line that trailer carries,
 * telling the agent to read the images before it answers.
 */

export const pastedImageStatics = {
  maxImagesPerMessage: 5,
  maxBytesPerImage: 5_242_880,
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

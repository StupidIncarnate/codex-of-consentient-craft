/**
 * PURPOSE: Static definitions for the `paste` step verb, including supported mime types
 * and reading format templates. Reach for this over inline strings so formatting patterns
 * and mime mappings stay in one place across the codebase.
 *
 * USAGE:
 * pasteStatics.mimeTypes.png;
 * // Returns 'image/png'
 *
 * pasteStatics.templates.text.ref;
 * // Returns 'pasted "{value}" into ref {ref}'
 */

export const pasteStatics = {
  mimeTypes: {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    txt: 'text/plain',
    html: 'text/html',
    json: 'application/json',
    default: 'application/octet-stream',
  },
  templates: {
    text: {
      ref: 'pasted "{value}" into ref {ref}',
      target: 'pasted "{value}" into {target}',
      within: 'pasted "{value}" into {target} within {within}',
    },
    file: {
      ref: 'pasted file "{filePath}" into ref {ref}',
      target: 'pasted file "{filePath}" into {target}',
      within: 'pasted file "{filePath}" into {target} within {within}',
    },
  },
} as const;

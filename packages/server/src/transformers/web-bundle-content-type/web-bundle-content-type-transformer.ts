/**
 * PURPOSE: Maps a web-bundle file path to its HTTP Content-Type so the single-port server can serve
 *   the built @dungeonmaster/web assets with the correct MIME type.
 *
 * USAGE:
 * webBundleContentTypeTransformer({ filePath: FilePathStub({ value: '/assets/index-abc.js' }) });
 * // → 'text/javascript; charset=utf-8'
 */
import type { FilePath } from '../../contracts/file-path/file-path-contract';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
} as const;

const FALLBACK = 'application/octet-stream';

export type WebBundleContentType =
  | (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES]
  | typeof FALLBACK;

export const webBundleContentTypeTransformer = ({
  filePath,
}: {
  filePath: FilePath;
}): WebBundleContentType => {
  const dotIndex = filePath.lastIndexOf('.');
  const slashIndex = filePath.lastIndexOf('/');

  if (dotIndex <= slashIndex) {
    return FALLBACK;
  }

  const extension = filePath.slice(dotIndex).toLowerCase();

  if (extension in CONTENT_TYPES) {
    return CONTENT_TYPES[extension as keyof typeof CONTENT_TYPES];
  }

  return FALLBACK;
};

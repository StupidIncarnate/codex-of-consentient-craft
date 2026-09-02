/**
 * PURPOSE: The image-serve route answers pasted-image requests with png/jpeg/gif/webp bytes, and
 * the existing web-bundle MIME map (webBundleContentTypeTransformer) covers none of these — it
 * only knows the built @dungeonmaster/web asset extensions. So this mapping is its own thing:
 * reach for it at that route instead of extending the web-bundle one.
 *
 * USAGE:
 * imageContentTypeTransformer({ filePath: AbsoluteFilePathStub({ value: '/tmp/a.png' }) });
 * // → 'image/png'
 */
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
} as const;

export type ImageContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

export const imageContentTypeTransformer = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): ImageContentType | null => {
  const dotIndex = filePath.lastIndexOf('.');
  const slashIndex = filePath.lastIndexOf('/');

  if (dotIndex <= slashIndex) {
    return null;
  }

  const extension = filePath.slice(dotIndex).toLowerCase();

  if (extension in CONTENT_TYPES) {
    return CONTENT_TYPES[extension as keyof typeof CONTENT_TYPES];
  }

  return null;
};

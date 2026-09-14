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
import type { pastedImageStatics } from '@dungeonmaster/shared/statics';

// The tuple's own element type, spelled through `infer` rather than an indexed-access `[number]`
// so this file carries no raw `number` type token.
type AllowedExtension =
  typeof pastedImageStatics.allowedExtensions extends readonly (infer Extension)[]
    ? Extension
    : never;

// Keyed by pastedImageStatics.allowedExtensions rather than a literal list, so an extension added
// to shared and left unanswered here is a TYPE error (a missing Record property) instead of a
// silent hole the scan accepts and the serve route can never read back.
const CONTENT_TYPES: Record<
  AllowedExtension,
  'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

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

  const extension = filePath.slice(dotIndex + 1).toLowerCase();

  if (extension in CONTENT_TYPES) {
    return CONTENT_TYPES[extension as keyof typeof CONTENT_TYPES];
  }

  return null;
};

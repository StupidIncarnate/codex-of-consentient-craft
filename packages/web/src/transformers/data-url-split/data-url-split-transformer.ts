/**
 * PURPOSE: Reach for this over `dataUrlBuildTransformer` when a pasted image is currently an `img`
 * src and needs to become the shape that persists — an IndexedDB draft record, or a chat-send
 * request body. The output parses through the SHARED `pastedImageUploadContract` rather than a
 * web-local shape because that is the exact contract the server re-validates the send body
 * against: splitting through anything looser would let an over-size or disallowed payload survive
 * locally only to fail with no local signal once it reaches the server.
 *
 * USAGE:
 * dataUrlSplitTransformer({ dataUrl: 'data:image/png;base64,iVBORw0KGgo=' });
 * // Returns { mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' }
 */

import { pastedImageUploadContract } from '@dungeonmaster/shared/contracts';
import type { PastedImageUpload } from '@dungeonmaster/shared/contracts';

import type { ImageDataUrl } from '../../contracts/image-data-url/image-data-url-contract';

const DATA_URL_PREFIX = 'data:';
const BASE64_MARKER = ';base64,';

export const dataUrlSplitTransformer = ({
  dataUrl,
}: {
  dataUrl: ImageDataUrl;
}): PastedImageUpload => {
  const markerIndex = dataUrl.indexOf(BASE64_MARKER);
  const mediaType = dataUrl.slice(DATA_URL_PREFIX.length, markerIndex);
  const dataBase64 = dataUrl.slice(markerIndex + BASE64_MARKER.length);

  return pastedImageUploadContract.parse({ mediaType, dataBase64 });
};

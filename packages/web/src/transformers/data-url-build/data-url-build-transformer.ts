/**
 * PURPOSE: Rebuilds a thumbnail's `img` src after a page reload, from the two fields an IndexedDB
 * draft record keeps. Reach for this over `dataUrlSplitTransformer` when the composer is READING a
 * stored draft back onto the screen, rather than writing one out to storage or a send body.
 *
 * USAGE:
 * dataUrlBuildTransformer({ mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' });
 * // Returns 'data:image/png;base64,iVBORw0KGgo='
 */

import type { PastedImageMediaType, Base64ImageData } from '@dungeonmaster/shared/contracts';

import { imageDataUrlContract } from '../../contracts/image-data-url/image-data-url-contract';
import type { ImageDataUrl } from '../../contracts/image-data-url/image-data-url-contract';

export const dataUrlBuildTransformer = ({
  mediaType,
  dataBase64,
}: {
  mediaType: PastedImageMediaType;
  dataBase64: Base64ImageData;
}): ImageDataUrl => imageDataUrlContract.parse(`data:${mediaType};base64,${dataBase64}`);

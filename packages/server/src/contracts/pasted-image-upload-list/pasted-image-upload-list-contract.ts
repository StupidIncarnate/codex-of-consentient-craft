/**
 * PURPOSE: The server validates the WHOLE `images` array from an untrusted chat request body in one
 * shot — reach for this over parsing entries through `pastedImageUploadContract` one at a time, since
 * only a single top-level array parse can reject a sixth image before any file for it gets written.
 *
 * USAGE:
 * pastedImageUploadListContract.parse([{ mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' }]);
 * // Returns: PastedImageUploadList with each entry validated by pastedImageUploadContract
 */
import { z } from 'zod';

import { pastedImageUploadContract } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

export const pastedImageUploadListContract = z
  .array(pastedImageUploadContract)
  .max(pastedImageStatics.maxImagesPerMessage);

export type PastedImageUploadList = z.infer<typeof pastedImageUploadListContract>;

/**
 * PURPOSE: Transforms folder type into human-readable purpose description
 *
 * USAGE:
 * const purpose = folderPurposeTransformer({ folderType: FolderTypeStub({ value: 'brokers' }) });
 * // Returns 'Business logic orchestration. Compose adapters, guards, transformers...'
 */

import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import type { FolderType } from '@dungeonmaster/shared/contracts';
import { isKeyOfGuard } from '@dungeonmaster/shared/guards';

export const folderPurposeTransformer = ({ folderType }: { folderType: FolderType }): string => {
  // Look up purpose from folder config metadata
  if (!isKeyOfGuard(folderType, folderConfigStatics)) {
    return 'No purpose description available.';
  }

  const config = folderConfigStatics[folderType];

  return config.meta.purpose;
};

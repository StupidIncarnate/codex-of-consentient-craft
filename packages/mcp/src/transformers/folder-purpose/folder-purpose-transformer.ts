/**
 * PURPOSE: Transforms folder type into human-readable purpose description
 *
 * USAGE:
 * const purpose = folderPurposeTransformer({ folderType: FolderTypeStub({ value: 'brokers' }) });
 * // Returns 'Business logic orchestration. Compose adapters, guards, transformers...'
 */

import { folderConfigStatics } from '@questmaestro/shared/statics';
import type { FolderType } from '@questmaestro/shared/contracts';
import { isKeyOfGuard } from '@questmaestro/shared/guards';
import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

export const folderPurposeTransformer = ({
  folderType,
}: {
  folderType: FolderType;
}): ContentText => {
  // Look up purpose from folder config metadata
  if (!isKeyOfGuard(folderType, folderConfigStatics)) {
    return contentTextContract.parse('No purpose description available.');
  }

  const config = folderConfigStatics[folderType as keyof typeof folderConfigStatics];

  return contentTextContract.parse(config.meta.purpose);
};

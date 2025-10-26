import { identifierContract } from '@questmaestro/shared/contracts';
import type { Identifier } from '@questmaestro/shared/contracts';

export const singularizeFolderTypeTransformer = ({
  folderType,
}: {
  folderType: string;
}): Identifier => {
  const singular = folderType.replace(/s$/u, '');

  return identifierContract.parse(singular);
};

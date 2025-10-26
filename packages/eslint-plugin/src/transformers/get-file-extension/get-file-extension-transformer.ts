import { identifierContract } from '@questmaestro/shared/contracts';
import type { Identifier } from '@questmaestro/shared/contracts';

export const getFileExtensionTransformer = ({
  filename,
  includesDot = true,
}: {
  filename: string;
  includesDot?: boolean;
}): Identifier => {
  const isTsx = filename.endsWith('.tsx');
  const extension = isTsx ? 'tsx' : 'ts';

  return identifierContract.parse(includesDot ? `.${extension}` : extension);
};

import { identifierContract } from '@questmaestro/shared/contracts';
import type { Identifier } from '@questmaestro/shared/contracts';

export const removeTrailingSlashTransformer = ({ str }: { str: string }): Identifier => {
  const withoutSlash = str.replace(/\/$/u, '');

  return identifierContract.parse(withoutSlash);
};

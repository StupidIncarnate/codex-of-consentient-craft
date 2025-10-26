import { identifierContract } from '@questmaestro/shared/contracts';
import type { Identifier } from '@questmaestro/shared/contracts';

export const extractFirstSegmentTransformer = ({ str }: { str: string }): Identifier => {
  const match = /^([^-]+)/u.exec(str);
  const segment = match ? match[1] : '';

  return identifierContract.parse(segment);
};

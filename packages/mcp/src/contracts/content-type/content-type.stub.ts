import { contentTypeContract } from './content-type-contract';
import type { ContentType } from './content-type-contract';

export const ContentTypeStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'text',
  },
): ContentType => contentTypeContract.parse(value);

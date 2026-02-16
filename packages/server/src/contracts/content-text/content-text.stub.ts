import { contentTextContract } from './content-text-contract';
import type { ContentText } from './content-text-contract';

export const ContentTextStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'Sample content text',
  },
): ContentText => contentTextContract.parse(value);

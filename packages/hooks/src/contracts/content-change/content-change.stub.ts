import type { ContentChange } from './content-change-contract';
import { contentChangeContract } from './content-change-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const ContentChangeStub = ({ ...props }: StubArgument<ContentChange> = {}): ContentChange =>
  contentChangeContract.parse({
    oldContent: '',
    newContent: '',
    ...props,
  });

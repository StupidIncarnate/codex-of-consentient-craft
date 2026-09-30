import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questMergeResponseDataContract } from './quest-merge-response-data-contract';
import type { QuestMergeResponseData } from './quest-merge-response-data-contract';

export const QuestMergeResponseDataStub = ({
  ...props
}: StubArgument<QuestMergeResponseData> = {}): QuestMergeResponseData =>
  questMergeResponseDataContract.parse({
    merging: true,
    ...props,
  });

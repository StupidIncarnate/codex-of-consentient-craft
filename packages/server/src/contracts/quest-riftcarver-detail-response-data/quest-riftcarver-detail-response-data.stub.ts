import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questRiftcarverDetailResponseDataContract } from './quest-riftcarver-detail-response-data-contract';
import type { QuestRiftcarverDetailResponseData } from './quest-riftcarver-detail-response-data-contract';

export const QuestRiftcarverDetailResponseDataStub = ({
  ...props
}: StubArgument<QuestRiftcarverDetailResponseData> = {}): QuestRiftcarverDetailResponseData =>
  questRiftcarverDetailResponseDataContract.parse({
    log: 'carving worktree\n',
    ...props,
  });

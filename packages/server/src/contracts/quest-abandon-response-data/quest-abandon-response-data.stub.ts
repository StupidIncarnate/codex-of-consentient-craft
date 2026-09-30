import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questAbandonResponseDataContract } from './quest-abandon-response-data-contract';
import type { QuestAbandonResponseData } from './quest-abandon-response-data-contract';

export const QuestAbandonResponseDataStub = ({
  ...props
}: StubArgument<QuestAbandonResponseData> = {}): QuestAbandonResponseData =>
  questAbandonResponseDataContract.parse({
    abandoned: true,
    ...props,
  });

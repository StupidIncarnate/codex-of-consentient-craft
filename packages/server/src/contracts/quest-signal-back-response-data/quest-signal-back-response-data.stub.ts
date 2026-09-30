import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questSignalBackResponseDataContract } from './quest-signal-back-response-data-contract';
import type { QuestSignalBackResponseData } from './quest-signal-back-response-data-contract';

export const QuestSignalBackResponseDataStub = ({
  ...props
}: StubArgument<QuestSignalBackResponseData> = {}): QuestSignalBackResponseData =>
  questSignalBackResponseDataContract.parse({
    ok: true,
    ...props,
  });

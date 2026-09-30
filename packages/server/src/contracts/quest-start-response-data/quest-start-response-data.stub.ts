import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questStartResponseDataContract } from './quest-start-response-data-contract';
import type { QuestStartResponseData } from './quest-start-response-data-contract';

export const QuestStartResponseDataStub = ({
  ...props
}: StubArgument<QuestStartResponseData> = {}): QuestStartResponseData =>
  questStartResponseDataContract.parse({
    processId: 'proc-12345',
    dispatch: { started: true },
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questDeleteResponseDataContract } from './quest-delete-response-data-contract';
import type { QuestDeleteResponseData } from './quest-delete-response-data-contract';

export const QuestDeleteResponseDataStub = ({
  ...props
}: StubArgument<QuestDeleteResponseData> = {}): QuestDeleteResponseData =>
  questDeleteResponseDataContract.parse({
    deleted: true,
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { WardDetailStub } from '@dungeonmaster/shared/contracts/ward-detail/ward-detail.stub';
import { questWardDetailResponseDataContract } from './quest-ward-detail-response-data-contract';
import type { QuestWardDetailResponseData } from './quest-ward-detail-response-data-contract';

export const QuestWardDetailResponseDataStub = ({
  ...props
}: StubArgument<QuestWardDetailResponseData> = {}): QuestWardDetailResponseData =>
  questWardDetailResponseDataContract.parse({
    detail: WardDetailStub(),
    ...props,
  });

import type { WardQueueResponse } from '../ward-queue-response/ward-queue-response-contract';
import { wardQueueResponseContract } from '../ward-queue-response/ward-queue-response-contract';

export const WardRunIdStub = (
  { value }: { value: string } = { value: '1773805659495-stub' },
): WardQueueResponse['runId'] => wardQueueResponseContract.shape.runId.parse(value);

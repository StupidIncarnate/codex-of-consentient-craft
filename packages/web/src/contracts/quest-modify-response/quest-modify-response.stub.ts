import { questModifyResponseContract } from './quest-modify-response-contract';
import type { QuestModifyResponse } from './quest-modify-response-contract';

export const QuestModifyResponseStub = (
  { value }: { value: QuestModifyResponse } = { value: { success: true } },
): QuestModifyResponse => questModifyResponseContract.parse(value);

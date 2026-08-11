import { questResumeTriggerContract } from './quest-resume-trigger-contract';

type QuestResumeTrigger = ReturnType<typeof questResumeTriggerContract.parse>;

export const QuestResumeTriggerStub = (
  { value }: { value: QuestResumeTrigger } = { value: 'dispatch-scan' },
): QuestResumeTrigger => questResumeTriggerContract.parse(value);

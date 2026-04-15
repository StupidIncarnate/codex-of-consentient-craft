import { questStageContract } from './quest-stage-contract';
import type { QuestStage } from './quest-stage-contract';

export const QuestStageStub = ({ value }: { value: string } = { value: 'spec' }): QuestStage =>
  questStageContract.parse(value);

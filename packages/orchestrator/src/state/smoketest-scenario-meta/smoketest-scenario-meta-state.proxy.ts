import type { QuestIdStub } from '@dungeonmaster/shared/contracts';

import type { SmoketestScenarioMetaStub } from '../../contracts/smoketest-scenario-meta/smoketest-scenario-meta.stub';
import { smoketestScenarioMetaState } from './smoketest-scenario-meta-state';

type QuestId = ReturnType<typeof QuestIdStub>;
type ScenarioMeta = ReturnType<typeof SmoketestScenarioMetaStub>;

export const smoketestScenarioMetaStateProxy = (): {
  setupEmpty: () => void;
  getRegisteredMeta: (params: { questId: QuestId }) => ScenarioMeta | undefined;
} => ({
  setupEmpty: (): void => {
    smoketestScenarioMetaState.clear();
  },
  getRegisteredMeta: ({ questId }: { questId: QuestId }): ScenarioMeta | undefined =>
    smoketestScenarioMetaState.get({ questId }),
});

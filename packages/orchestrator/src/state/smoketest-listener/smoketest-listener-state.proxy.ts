import type { QuestIdStub } from '@dungeonmaster/shared/contracts';

import type { SmoketestListenerEntryStub } from '../../contracts/smoketest-listener-entry/smoketest-listener-entry.stub';
import { smoketestListenerState } from './smoketest-listener-state';

type QuestId = ReturnType<typeof QuestIdStub>;
type ListenerEntry = ReturnType<typeof SmoketestListenerEntryStub>;

export const smoketestListenerStateProxy = (): {
  setupEmpty: () => void;
  getRegisteredEntry: (params: { questId: QuestId }) => ListenerEntry | undefined;
  getAllRegisteredQuestIds: () => readonly QuestId[];
} => ({
  setupEmpty: (): void => {
    smoketestListenerState.clear();
  },
  getRegisteredEntry: ({ questId }: { questId: QuestId }): ListenerEntry | undefined =>
    smoketestListenerState.get({ questId }),
  getAllRegisteredQuestIds: (): readonly QuestId[] => smoketestListenerState.getAllQuestIds(),
});

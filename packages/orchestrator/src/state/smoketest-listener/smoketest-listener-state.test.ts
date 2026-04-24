import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SmoketestListenerEntryStub } from '../../contracts/smoketest-listener-entry/smoketest-listener-entry.stub';
import { smoketestListenerState } from './smoketest-listener-state';

describe('smoketestListenerState', () => {
  it('EMPTY: {fresh state} => get returns undefined for unknown questId', () => {
    smoketestListenerState.clear();

    const result = smoketestListenerState.get({ questId: QuestIdStub() });

    expect(result).toBe(undefined);
  });

  it('VALID: {register then get} => returns the registered entry', () => {
    smoketestListenerState.clear();
    const questId = QuestIdStub({ value: 'smoke-1' });
    const entry = SmoketestListenerEntryStub();

    smoketestListenerState.register({ questId, entry });

    expect(smoketestListenerState.get({ questId })).toStrictEqual(entry);
  });

  it('VALID: {register then unregister} => get returns undefined', () => {
    smoketestListenerState.clear();
    const questId = QuestIdStub({ value: 'smoke-1' });
    smoketestListenerState.register({ questId, entry: SmoketestListenerEntryStub() });

    smoketestListenerState.unregister({ questId });

    expect(smoketestListenerState.get({ questId })).toBe(undefined);
  });

  it('VALID: {register three quests} => getAllQuestIds returns all three', () => {
    smoketestListenerState.clear();
    const a = QuestIdStub({ value: 'smoke-a' });
    const b = QuestIdStub({ value: 'smoke-b' });
    const c = QuestIdStub({ value: 'smoke-c' });

    smoketestListenerState.register({ questId: a, entry: SmoketestListenerEntryStub() });
    smoketestListenerState.register({ questId: b, entry: SmoketestListenerEntryStub() });
    smoketestListenerState.register({ questId: c, entry: SmoketestListenerEntryStub() });

    expect(smoketestListenerState.getAllQuestIds()).toStrictEqual([a, b, c]);
  });

  it('VALID: {clear} => getAllQuestIds returns empty', () => {
    smoketestListenerState.clear();
    smoketestListenerState.register({
      questId: QuestIdStub({ value: 'smoke-a' }),
      entry: SmoketestListenerEntryStub(),
    });

    smoketestListenerState.clear();

    expect(smoketestListenerState.getAllQuestIds()).toStrictEqual([]);
  });
});

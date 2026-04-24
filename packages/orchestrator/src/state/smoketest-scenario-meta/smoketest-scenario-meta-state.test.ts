import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SmoketestScenarioMetaStub } from '../../contracts/smoketest-scenario-meta/smoketest-scenario-meta.stub';
import { smoketestScenarioMetaState } from './smoketest-scenario-meta-state';

describe('smoketestScenarioMetaState', () => {
  it('EMPTY: {fresh state} => get returns undefined', () => {
    smoketestScenarioMetaState.clear();

    expect(smoketestScenarioMetaState.get({ questId: QuestIdStub() })).toBe(undefined);
  });

  it('VALID: {register then get} => returns the registered meta', () => {
    smoketestScenarioMetaState.clear();
    const questId = QuestIdStub({ value: 'smoke-1' });
    const meta = SmoketestScenarioMetaStub();

    smoketestScenarioMetaState.register({ questId, meta });

    expect(smoketestScenarioMetaState.get({ questId })).toStrictEqual(meta);
  });

  it('VALID: {register then unregister} => get returns undefined', () => {
    smoketestScenarioMetaState.clear();
    const questId = QuestIdStub({ value: 'smoke-1' });
    smoketestScenarioMetaState.register({ questId, meta: SmoketestScenarioMetaStub() });

    smoketestScenarioMetaState.unregister({ questId });

    expect(smoketestScenarioMetaState.get({ questId })).toBe(undefined);
  });
});

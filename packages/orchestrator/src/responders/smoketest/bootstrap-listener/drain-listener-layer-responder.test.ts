import {
  QuestIdStub,
  SmoketestRunIdStub,
  SmoketestSuiteStub,
} from '@dungeonmaster/shared/contracts';

import { SmoketestListenerEntryStub } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry.stub';
import { SmoketestScenarioMetaStub } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta.stub';
import { smoketestListenerState } from '../../../state/smoketest-listener/smoketest-listener-state';
import { smoketestRunState } from '../../../state/smoketest-run/smoketest-run-state';
import { smoketestScenarioMetaState } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state';
import { DrainListenerLayerResponder } from './drain-listener-layer-responder';
import { DrainListenerLayerResponderProxy } from './drain-listener-layer-responder.proxy';

describe('DrainListenerLayerResponder', () => {
  describe('last quest drains — clears active-run flag', () => {
    it('VALID: {single registered listener, active run started, drain last one} => run state ends, registries empty, returns success', () => {
      DrainListenerLayerResponderProxy();
      const questId = QuestIdStub({ value: 'q-drain-last' });
      smoketestListenerState.register({ questId, entry: SmoketestListenerEntryStub() });
      smoketestScenarioMetaState.register({ questId, meta: SmoketestScenarioMetaStub() });
      smoketestRunState.start({
        runId: SmoketestRunIdStub(),
        suite: SmoketestSuiteStub({ value: 'mcp' }),
      });

      const result = DrainListenerLayerResponder({ questId });

      expect({
        result,
        active: smoketestRunState.isActive(),
        listenerIds: smoketestListenerState.getAllQuestIds(),
        scenarioEntry: smoketestScenarioMetaState.get({ questId }),
      }).toStrictEqual({
        result: { success: true },
        active: false,
        listenerIds: [],
        scenarioEntry: undefined,
      });
    });
  });

  describe('not the last quest — active flag stays set', () => {
    it('VALID: {two registered listeners, drain first only} => active flag stays set, second listener still registered', () => {
      DrainListenerLayerResponderProxy();
      const questIdA = QuestIdStub({ value: 'q-first' });
      const questIdB = QuestIdStub({ value: 'q-second' });
      smoketestListenerState.register({ questId: questIdA, entry: SmoketestListenerEntryStub() });
      smoketestListenerState.register({ questId: questIdB, entry: SmoketestListenerEntryStub() });
      smoketestScenarioMetaState.register({ questId: questIdA, meta: SmoketestScenarioMetaStub() });
      smoketestScenarioMetaState.register({ questId: questIdB, meta: SmoketestScenarioMetaStub() });
      smoketestRunState.start({
        runId: SmoketestRunIdStub(),
        suite: SmoketestSuiteStub({ value: 'orchestration' }),
      });

      DrainListenerLayerResponder({ questId: questIdA });

      expect({
        active: smoketestRunState.isActive(),
        listenerIds: smoketestListenerState.getAllQuestIds(),
        scenarioAStillRegistered: smoketestScenarioMetaState.get({ questId: questIdA }),
        scenarioBStillRegistered:
          smoketestScenarioMetaState.get({ questId: questIdB }) !== undefined,
      }).toStrictEqual({
        active: true,
        listenerIds: [questIdB],
        scenarioAStillRegistered: undefined,
        scenarioBStillRegistered: true,
      });

      DrainListenerLayerResponder({ questId: questIdB });

      expect({
        active: smoketestRunState.isActive(),
        listenerIds: smoketestListenerState.getAllQuestIds(),
      }).toStrictEqual({ active: false, listenerIds: [] });
    });
  });

  describe('draining when registry already empty', () => {
    it('VALID: {no listeners registered, no active run} => no-op, returns success', () => {
      DrainListenerLayerResponderProxy();
      const questId = QuestIdStub({ value: 'q-nothing-registered' });

      const result = DrainListenerLayerResponder({ questId });

      expect({
        result,
        active: smoketestRunState.isActive(),
        listenerIds: smoketestListenerState.getAllQuestIds(),
      }).toStrictEqual({ result: { success: true }, active: false, listenerIds: [] });
    });
  });
});

import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SmoketestScenarioStub } from '../../../contracts/smoketest-scenario/smoketest-scenario.stub';
import { DispatchCountStub } from '../../../contracts/dispatch-count/dispatch-count.stub';
import { smoketestInProcessDriverBroker } from './smoketest-in-process-driver-broker';
import { smoketestInProcessDriverBrokerProxy } from './smoketest-in-process-driver-broker.proxy';

describe('smoketestInProcessDriverBroker', () => {
  describe('dispatch cap', () => {
    it('ERROR: {maxDispatches: 0, dispatchCount: 0} => throws cap-reached error on first iteration', async () => {
      smoketestInProcessDriverBrokerProxy();
      const scenario = SmoketestScenarioStub();
      const questId = QuestIdStub({ value: 'driver-cap-quest' });

      await expect(
        smoketestInProcessDriverBroker({
          questId,
          scenario,
          maxDispatches: DispatchCountStub({ value: 0 }),
          dispatchCount: DispatchCountStub({ value: 0 }),
        }),
      ).rejects.toThrow(/^smoketestInProcessDriverBroker: dispatch cap reached \(0\)$/u);
    });
  });

  describe('signature export', () => {
    it('VALID: smoketestInProcessDriverBroker => is callable', () => {
      expect(smoketestInProcessDriverBroker).toStrictEqual(expect.any(Function));
    });
  });
});

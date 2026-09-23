import { QuestIdStub, QuestProjectionStub } from '@dungeonmaster/shared/contracts';

import { questProjectionBroker } from './quest-projection-broker';
import { questProjectionBrokerProxy } from './quest-projection-broker.proxy';

describe('questProjectionBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {questId} => returns the parsed quest projection', async () => {
      const proxy = questProjectionBrokerProxy();
      const projection = QuestProjectionStub({
        questId: 'test-quest',
        scopes: [
          {
            operationId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'in_progress',
            steps: [
              {
                step: 'plan',
                kind: 'actual',
                workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                status: 'complete',
              },
              { step: 'work', kind: 'planned' },
            ],
          },
        ],
        totalPlannedSteps: 2,
        completedSteps: 1,
      });
      proxy.setupProjection({ projection });

      const result = await questProjectionBroker({ questId: QuestIdStub({ value: 'test-quest' }) });

      expect(result).toStrictEqual(projection);
    });

    it('VALID: {questId} => interpolates the questId into the path and issues exactly one GET', async () => {
      const proxy = questProjectionBrokerProxy();
      proxy.setupProjection({ projection: QuestProjectionStub({ questId: 'path-param-quest' }) });

      const result = await questProjectionBroker({
        questId: QuestIdStub({ value: 'path-param-quest' }),
      });

      expect(proxy.getRequestCount()).toBe(1);
      expect(result.questId).toBe('path-param-quest');
    });
  });

  describe('failed fetch', () => {
    it('ERROR: {server returns 404} => throws naming the URL and status', async () => {
      const proxy = questProjectionBrokerProxy();
      proxy.setupNotFound();

      await expect(
        questProjectionBroker({ questId: QuestIdStub({ value: 'q-missing' }) }),
      ).rejects.toThrow(/^GET \/api\/quests\/q-missing\/projection failed with status 404$/u);
    });
  });
});

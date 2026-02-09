import { FilePathStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { handleSignalLayerBroker } from './handle-signal-layer-broker';
import { handleSignalLayerBrokerProxy } from './handle-signal-layer-broker.proxy';

describe('handleSignalLayerBroker', () => {
  describe('complete signal', () => {
    it('VALID: {signal: complete} => updates step to complete and returns continue action', async () => {
      const proxy = handleSignalLayerBrokerProxy();
      const stepId = StepIdStub();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const signal = StreamSignalStub({ signal: 'complete', stepId });

      proxy.setupQuestUpdateSuccess({
        questJson: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            {
              id: stepId,
              name: 'Test',
              description: 'Test step',
              observablesSatisfied: [],
              dependsOn: [],
              filesToCreate: [],
              filesToModify: [],
              status: 'in_progress',
            },
          ],
          toolingRequirements: [],
        }),
      });

      const result = await handleSignalLayerBroker({ signal, stepId, questFilePath });

      expect(result).toStrictEqual({ action: 'continue' });
    });
  });

  describe('partially-complete signal', () => {
    it('VALID: {signal: partially-complete, continuationPoint: defined} => returns respawn action with continuationPoint', async () => {
      const proxy = handleSignalLayerBrokerProxy();
      const stepId = StepIdStub();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const signal = StreamSignalStub({
        signal: 'partially-complete',
        stepId,
        continuationPoint: 'Continue from step 2' as never,
      });

      proxy.setupQuestUpdateSuccess({
        questJson: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            {
              id: stepId,
              name: 'Test',
              description: 'Test step',
              observablesSatisfied: [],
              dependsOn: [],
              filesToCreate: [],
              filesToModify: [],
              status: 'in_progress',
            },
          ],
          toolingRequirements: [],
        }),
      });

      const result = await handleSignalLayerBroker({ signal, stepId, questFilePath });

      expect(result).toStrictEqual({
        action: 'respawn',
        continuationPoint: 'Continue from step 2',
      });
    });
  });

  describe('needs-role-followup signal', () => {
    it('VALID: {signal: needs-role-followup, all fields defined} => returns spawn_role action with all fields', async () => {
      const proxy = handleSignalLayerBrokerProxy();
      const stepId = StepIdStub();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const signal = StreamSignalStub({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'reviewer' as never,
        reason: 'Need code review' as never,
        context: 'Review context' as never,
      });

      proxy.setupQuestUpdateSuccess({
        questJson: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            {
              id: stepId,
              name: 'Test',
              description: 'Test step',
              observablesSatisfied: [],
              dependsOn: [],
              filesToCreate: [],
              filesToModify: [],
              status: 'in_progress',
            },
          ],
          toolingRequirements: [],
        }),
      });

      const result = await handleSignalLayerBroker({ signal, stepId, questFilePath });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'reviewer',
        reason: 'Need code review',
        context: 'Review context',
      });
    });
  });
});

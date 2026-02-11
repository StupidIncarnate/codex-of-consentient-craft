import { ExitCodeStub, FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { siegemasterPhaseLayerBroker } from './siegemaster-phase-layer-broker';
import { siegemasterPhaseLayerBrokerProxy } from './siegemaster-phase-layer-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

describe('siegemasterPhaseLayerBroker', () => {
  describe('all observables verified successfully', () => {
    it('VALID: {quest with 2 observables, all succeed} => completes without error', async () => {
      const proxy = siegemasterPhaseLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'add-auth',
          folder: '001-add-auth',
          title: 'Add Authentication',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          requirements: [],
          designDecisions: [],
          contexts: [
            {
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              name: 'Login Page',
              description: 'Login page context',
              locator: {},
            },
            {
              id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
              name: 'Dashboard',
              description: 'Dashboard context',
              locator: {},
            },
          ],
          observables: [
            {
              id: 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
              contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              trigger: 'Submit login form',
              dependsOn: [],
              outcomes: [],
            },
            {
              id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
              contextId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
              trigger: 'View dashboard',
              dependsOn: [],
              outcomes: [],
            },
          ],
          steps: [],
          toolingRequirements: [],
          contracts: [],
        }),
      });
      proxy.setupAllSpawnsSucceed({ exitCode: ExitCodeStub({ value: 0 }) });

      await siegemasterPhaseLayerBroker({ questId, questFilePath, onPhaseChange });

      expect(phases).toStrictEqual(['siegemaster']);
    });
  });

  describe('observable fails all retries', () => {
    it('VALID: {observable fails all retries} => skips after max retries without error', async () => {
      const proxy = siegemasterPhaseLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'add-auth',
          folder: '001-add-auth',
          title: 'Add Authentication',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          requirements: [],
          designDecisions: [],
          contexts: [
            {
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              name: 'Login Page',
              description: 'Login page context',
              locator: {},
            },
          ],
          observables: [
            {
              id: 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
              contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              trigger: 'Submit login form',
              dependsOn: [],
              outcomes: [],
            },
          ],
          steps: [],
          toolingRequirements: [],
          contracts: [],
        }),
      });
      proxy.setupSpawnFailure();

      await siegemasterPhaseLayerBroker({ questId, questFilePath, onPhaseChange });

      expect(phases).toStrictEqual(['siegemaster']);
    });
  });

  describe('max retries exceeded', () => {
    it('VALID: {observable keeps failing beyond max retries} => skipped without throwing', async () => {
      const proxy = siegemasterPhaseLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'add-auth',
          folder: '001-add-auth',
          title: 'Add Authentication',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          requirements: [],
          designDecisions: [],
          contexts: [
            {
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              name: 'Login Page',
              description: 'Login page context',
              locator: {},
            },
          ],
          observables: [
            {
              id: 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
              contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              trigger: 'Submit login form',
              dependsOn: [],
              outcomes: [],
            },
          ],
          steps: [],
          toolingRequirements: [],
          contracts: [],
        }),
      });
      proxy.setupSpawnFailure();

      await siegemasterPhaseLayerBroker({ questId, questFilePath, onPhaseChange });

      expect(phases).toStrictEqual(['siegemaster']);
    });
  });

  describe('no observables in quest', () => {
    it('EMPTY: {quest with no observables} => returns immediately', async () => {
      const proxy = siegemasterPhaseLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'add-auth',
          folder: '001-add-auth',
          title: 'Add Authentication',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          requirements: [],
          designDecisions: [],
          contexts: [],
          observables: [],
          steps: [],
          toolingRequirements: [],
          contracts: [],
        }),
      });

      await siegemasterPhaseLayerBroker({ questId, questFilePath, onPhaseChange });

      expect(phases).toStrictEqual(['siegemaster']);
    });
  });
});

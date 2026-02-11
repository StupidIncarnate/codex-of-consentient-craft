import { ExitCodeStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { lawbringerPhaseLayerBroker } from './lawbringer-phase-layer-broker';
import { lawbringerPhaseLayerBrokerProxy } from './lawbringer-phase-layer-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

describe('lawbringerPhaseLayerBroker', () => {
  describe('all file pairs reviewed successfully', () => {
    it('VALID: {quest with completed steps having files} => completes without error', async () => {
      const proxy = lawbringerPhaseLayerBrokerProxy();
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
          steps: [
            {
              id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
              name: 'Create auth broker',
              description: 'Create the auth broker',
              observablesSatisfied: [],
              dependsOn: [],
              filesToCreate: [
                '/src/brokers/auth/login/auth-login-broker.ts',
                '/src/brokers/auth/login/auth-login-broker.test.ts',
              ],
              filesToModify: [],
              status: 'complete',
              inputContracts: [],
              outputContracts: [],
            },
          ],
          toolingRequirements: [],
          contracts: [],
        }),
      });
      proxy.setupAllSpawnsSucceed({ exitCode: ExitCodeStub({ value: 0 }) });

      await lawbringerPhaseLayerBroker({ questFilePath, onPhaseChange });

      expect(phases).toStrictEqual(['lawbringer']);
    });
  });

  describe('file pair fails all retries', () => {
    it('VALID: {file pair fails all retries} => skips after max retries without error', async () => {
      const proxy = lawbringerPhaseLayerBrokerProxy();
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
          steps: [
            {
              id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
              name: 'Create auth broker',
              description: 'Create the auth broker',
              observablesSatisfied: [],
              dependsOn: [],
              filesToCreate: ['/src/brokers/auth/login/auth-login-broker.ts'],
              filesToModify: [],
              status: 'complete',
              inputContracts: [],
              outputContracts: [],
            },
          ],
          toolingRequirements: [],
          contracts: [],
        }),
      });
      proxy.setupSpawnFailure();

      await lawbringerPhaseLayerBroker({ questFilePath, onPhaseChange });

      expect(phases).toStrictEqual(['lawbringer']);
    });
  });

  describe('no completed steps', () => {
    it('EMPTY: {quest with no completed steps} => returns immediately', async () => {
      const proxy = lawbringerPhaseLayerBrokerProxy();
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
          steps: [
            {
              id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
              name: 'Pending step',
              description: 'Still pending',
              observablesSatisfied: [],
              dependsOn: [],
              filesToCreate: ['/src/brokers/auth/login/auth-login-broker.ts'],
              filesToModify: [],
              status: 'pending',
              inputContracts: [],
              outputContracts: [],
            },
          ],
          toolingRequirements: [],
          contracts: [],
        }),
      });

      await lawbringerPhaseLayerBroker({ questFilePath, onPhaseChange });

      expect(phases).toStrictEqual(['lawbringer']);
    });
  });

  describe('max retries exceeded', () => {
    it('VALID: {file pair keeps failing beyond max retries} => skipped without throwing', async () => {
      const proxy = lawbringerPhaseLayerBrokerProxy();
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
          steps: [
            {
              id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
              name: 'Create auth broker',
              description: 'Create the auth broker',
              observablesSatisfied: [],
              dependsOn: [],
              filesToCreate: ['/src/brokers/auth/login/auth-login-broker.ts'],
              filesToModify: [],
              status: 'complete',
              inputContracts: [],
              outputContracts: [],
            },
          ],
          toolingRequirements: [],
          contracts: [],
        }),
      });
      proxy.setupSpawnFailure();

      await lawbringerPhaseLayerBroker({ questFilePath, onPhaseChange });

      expect(phases).toStrictEqual(['lawbringer']);
    });
  });
});

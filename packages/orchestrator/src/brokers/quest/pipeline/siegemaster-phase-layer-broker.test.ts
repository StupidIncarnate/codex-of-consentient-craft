import { ExitCodeStub, FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { siegemasterPhaseLayerBroker } from './siegemaster-phase-layer-broker';
import { siegemasterPhaseLayerBrokerProxy } from './siegemaster-phase-layer-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

describe('siegemasterPhaseLayerBroker', () => {
  describe('all observables verified successfully', () => {
    it('VALID: {quest with 2 observables in flow nodes, all succeed} => returns empty failedObservableIds', async () => {
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
          designDecisions: [],
          steps: [],
          toolingRequirements: [],
          contracts: [],
          flows: [
            {
              id: 'login-flow',
              name: 'Login Flow',
              entryPoint: '/login',
              exitPoints: ['/dashboard'],
              nodes: [
                {
                  id: 'login-page',
                  label: 'Login Page',
                  type: 'state',
                  observables: [
                    {
                      id: 'redirects-to-dashboard',
                      type: 'ui-state',
                      description: 'redirects to dashboard',
                    },
                  ],
                },
                {
                  id: 'dashboard',
                  label: 'Dashboard',
                  type: 'state',
                  observables: [
                    {
                      id: 'shows-user-data',
                      type: 'ui-state',
                      description: 'shows user data',
                    },
                  ],
                },
              ],
              edges: [],
            },
          ],
        }),
      });
      proxy.setupAllSpawnsComplete({ exitCode: ExitCodeStub({ value: 0 }) });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await siegemasterPhaseLayerBroker({
        questId,
        questFilePath,
        startPath,
        onPhaseChange,
      });

      expect(result).toStrictEqual({ failedObservableIds: [] });
      expect(phases).toStrictEqual(['siegemaster']);
    });
  });

  describe('observable fails all retries', () => {
    it('ERROR: {observable fails all retries} => throws with failed observable count in message', async () => {
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
          designDecisions: [],
          steps: [],
          toolingRequirements: [],
          contracts: [],
          flows: [
            {
              id: 'login-flow',
              name: 'Login Flow',
              entryPoint: '/login',
              exitPoints: ['/dashboard'],
              nodes: [
                {
                  id: 'login-page',
                  label: 'Login Page',
                  type: 'state',
                  observables: [
                    {
                      id: 'redirects-to-dashboard',
                      type: 'ui-state',
                      description: 'redirects to dashboard',
                    },
                  ],
                },
              ],
              edges: [],
            },
          ],
        }),
      });
      proxy.setupSpawnFailure();

      const startPath = FilePathStub({ value: '/project/src' });

      await expect(
        siegemasterPhaseLayerBroker({ questId, questFilePath, startPath, onPhaseChange }),
      ).rejects.toThrow(/Siegemaster phase failed after 2 retries with 1 failed observables/u);

      expect(phases).toStrictEqual(['siegemaster']);
    });
  });

  describe('max retries exceeded with error cause', () => {
    it('ERROR: {observable keeps failing beyond max retries} => error cause contains failedObservableIds', async () => {
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
          designDecisions: [],
          steps: [],
          toolingRequirements: [],
          contracts: [],
          flows: [
            {
              id: 'login-flow',
              name: 'Login Flow',
              entryPoint: '/login',
              exitPoints: ['/dashboard'],
              nodes: [
                {
                  id: 'login-page',
                  label: 'Login Page',
                  type: 'state',
                  observables: [
                    {
                      id: 'redirects-to-dashboard',
                      type: 'ui-state',
                      description: 'redirects to dashboard',
                    },
                  ],
                },
              ],
              edges: [],
            },
          ],
        }),
      });
      proxy.setupSpawnFailure();

      const startPath = FilePathStub({ value: '/project/src' });

      const caughtError = await siegemasterPhaseLayerBroker({
        questId,
        questFilePath,
        startPath,
        onPhaseChange,
      }).catch((error: unknown) => error);

      expect(caughtError).toBeInstanceOf(Error);

      const { cause } = caughtError as Error;

      expect(Reflect.get(cause as object, 'failedObservableIds')).toStrictEqual([
        'redirects-to-dashboard',
      ]);
      expect(phases).toStrictEqual(['siegemaster']);
    });
  });

  describe('no observables in quest', () => {
    it('EMPTY: {quest with no observables in flow nodes} => returns empty failedObservableIds', async () => {
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
          designDecisions: [],
          steps: [],
          toolingRequirements: [],
          contracts: [],
          flows: [
            {
              id: 'login-flow',
              name: 'Login Flow',
              entryPoint: '/login',
              exitPoints: ['/dashboard'],
              nodes: [],
              edges: [],
            },
          ],
        }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await siegemasterPhaseLayerBroker({
        questId,
        questFilePath,
        startPath,
        onPhaseChange,
      });

      expect(result).toStrictEqual({ failedObservableIds: [] });
      expect(phases).toStrictEqual(['siegemaster']);
    });

    it('EMPTY: {quest with no flows} => returns empty failedObservableIds', async () => {
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
          designDecisions: [],
          steps: [],
          toolingRequirements: [],
          contracts: [],
          flows: [],
        }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await siegemasterPhaseLayerBroker({
        questId,
        questFilePath,
        startPath,
        onPhaseChange,
      });

      expect(result).toStrictEqual({ failedObservableIds: [] });
      expect(phases).toStrictEqual(['siegemaster']);
    });
  });
});

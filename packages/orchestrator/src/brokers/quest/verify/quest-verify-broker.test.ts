import { QuestStub } from '@dungeonmaster/shared/contracts';

import { VerifyQuestInputStub } from '../../../contracts/verify-quest-input/verify-quest-input.stub';
import { questVerifyBroker } from './quest-verify-broker';
import { questVerifyBrokerProxy } from './quest-verify-broker.proxy';

describe('questVerifyBroker', () => {
  describe('successful verification', () => {
    it('VALID: {quest with all checks passing} => returns success true with checks', async () => {
      const proxy = questVerifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
        contexts: [
          {
            id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginPage',
            description: 'Login page',
            locator: { page: '/login', section: 'main' },
          },
        ],
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            requirementId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits login form',
            dependsOn: [],
            outcomes: [],
          },
        ],
        steps: [
          {
            id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Create login broker',
            description: 'Create login broker',
            observablesSatisfied: ['b47ac10b-58cc-4372-a567-0e02b2c3d479'],
            dependsOn: [],
            filesToCreate: [
              'packages/api/src/guards/has-auth/has-auth-guard.ts',
              'packages/api/src/guards/has-auth/has-auth-guard.test.ts',
            ],
            filesToModify: [],
            status: 'pending',
            exportName: 'hasAuthGuard',
          },
        ],
        flows: [
          {
            id: 'd47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Login Flow',
            requirementIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
            diagram: 'graph TD; A[Start] --> B[Login] --> C[Dashboard]',
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
          },
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = VerifyQuestInputStub({ questId: 'add-auth' });
      const result = await questVerifyBroker({ input });

      expect(result.success).toBe(true);
      expect(result.checks).toHaveLength(13);
      expect(result.checks.every((check) => check.passed)).toBe(true);
    });

    it('VALID: {quest with failing checks} => returns success false with checks', async () => {
      const proxy = questVerifyBrokerProxy();
      const quest = QuestStub({
        id: 'fix-bug',
        folder: '002-fix-bug',
        title: 'Fix Bug',
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User triggers bug',
            dependsOn: [],
            outcomes: [],
          },
        ],
        steps: [
          {
            id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Fix the bug',
            description: 'Fix the bug',
            observablesSatisfied: [],
            dependsOn: [],
            filesToCreate: [],
            filesToModify: [],
            status: 'pending',
          },
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = VerifyQuestInputStub({ questId: 'fix-bug' });
      const result = await questVerifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.checks).toHaveLength(13);
      expect(result.checks.some((check) => !check.passed)).toBe(true);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => returns not found error', async () => {
      const proxy = questVerifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest });

      const input = VerifyQuestInputStub({ questId: 'nonexistent' });
      const result = await questVerifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.checks).toStrictEqual([]);
      expect(result.error).toMatch(/not found/u);
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questVerifyBrokerProxy();

      proxy.setupEmptyFolder();

      const input = VerifyQuestInputStub({ questId: 'any-quest' });
      const result = await questVerifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.checks).toStrictEqual([]);
      expect(result.error).toMatch(/not found/u);
    });
  });
});

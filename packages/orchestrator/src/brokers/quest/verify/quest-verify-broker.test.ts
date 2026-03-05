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
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
            nodes: [
              {
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  {
                    id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
                    given: 'user is on the login page',
                    when: 'user submits login form',
                    then: [{ type: 'ui-state', description: 'redirects to dashboard' }],
                  },
                ],
              },
            ],
            edges: [],
          },
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = VerifyQuestInputStub({ questId: 'add-auth' });
      const result = await questVerifyBroker({ input });

      expect(result.success).toBe(true);
      expect(result.checks).toHaveLength(11);
      expect(result.checks.every((check) => check.passed)).toBe(true);
    });

    it('VALID: {quest with failing checks} => returns success false with checks', async () => {
      const proxy = questVerifyBrokerProxy();
      const quest = QuestStub({
        id: 'fix-bug',
        folder: '002-fix-bug',
        title: 'Fix Bug',
        flows: [
          {
            id: 'd47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Bug Flow',
            entryPoint: '/bug',
            exitPoints: ['/fixed'],
            nodes: [
              {
                id: 'bug-page',
                label: 'Bug Page',
                type: 'state',
                observables: [
                  {
                    id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
                    given: 'user is on the page',
                    when: 'user triggers bug',
                    then: [{ type: 'ui-state', description: 'bug is triggered' }],
                  },
                ],
              },
            ],
            edges: [],
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
      expect(result.checks).toHaveLength(11);
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

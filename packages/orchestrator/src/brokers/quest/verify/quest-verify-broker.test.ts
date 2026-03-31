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
            id: 'create-login-broker',
            name: 'Create login broker',
            assertions: [
              { prefix: 'VALID', input: '{valid credentials}', expected: 'returns auth token' },
            ],
            observablesSatisfied: ['redirects-to-dashboard'],
            dependsOn: [],
            focusFile: {
              path: 'packages/api/src/guards/has-auth/has-auth-guard.ts',
            },
            accompanyingFiles: [
              { path: 'packages/api/src/guards/has-auth/has-auth-guard.test.ts' },
            ],
            exportName: 'hasAuthGuard',
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
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
                observables: [],
              },
            ],
            edges: [{ id: 'login-to-dashboard', from: 'login-page', to: 'dashboard' }],
          },
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = VerifyQuestInputStub({ questId: 'add-auth' });
      const result = await questVerifyBroker({ input });

      expect(result.success).toBe(true);
      expect(result.checks.map((c) => c.name)).toStrictEqual([
        'Observable Coverage',
        'Dependency Integrity',
        'No Circular Dependencies',
        'File Companion Completeness',
        'No Raw Primitives in Contracts',
        'Step Contract Declarations',
        'Valid Contract References',
        'Step Export Names',
        'Valid Flow References',
        'No Orphan Flow Nodes',
        'Node Observable Coverage',
        'No Duplicate Focus Files',
        'Valid Focus Files',
      ]);
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
            id: 'bug-flow',
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
                    id: 'bug-is-triggered',
                    type: 'ui-state',
                    description: 'bug is triggered',
                  },
                ],
              },
            ],
            edges: [],
          },
        ],
        steps: [
          {
            id: 'fix-the-bug',
            name: 'Fix the bug',
            assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'bug is fixed' }],
            observablesSatisfied: [],
            dependsOn: [],
            focusFile: { path: 'src/brokers/bug/fix/bug-fix-broker.ts' },
            accompanyingFiles: [],
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = VerifyQuestInputStub({ questId: 'fix-bug' });
      const result = await questVerifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.checks.map((c) => c.name)).toStrictEqual([
        'Observable Coverage',
        'Dependency Integrity',
        'No Circular Dependencies',
        'File Companion Completeness',
        'No Raw Primitives in Contracts',
        'Step Contract Declarations',
        'Valid Contract References',
        'Step Export Names',
        'Valid Flow References',
        'No Orphan Flow Nodes',
        'Node Observable Coverage',
        'No Duplicate Focus Files',
        'Valid Focus Files',
      ]);
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

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error: 'Quest with id "nonexistent" not found in any guild',
      });
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questVerifyBrokerProxy();

      proxy.setupEmptyFolder();

      const input = VerifyQuestInputStub({ questId: 'any-quest' });
      const result = await questVerifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error: 'Quest with id "any-quest" not found in any guild',
      });
    });
  });
});

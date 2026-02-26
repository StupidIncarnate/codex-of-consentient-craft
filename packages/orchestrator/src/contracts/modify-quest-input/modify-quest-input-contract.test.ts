import { FlowStub } from '@dungeonmaster/shared/contracts';

import { modifyQuestInputContract } from './modify-quest-input-contract';
import { ModifyQuestInputStub } from './modify-quest-input.stub';

describe('modifyQuestInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId only} => parses successfully', () => {
      const input = ModifyQuestInputStub({ questId: 'add-auth' });

      const result = modifyQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId, contexts} => parses with contexts array', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contexts: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Admin Page',
            description: 'User admin section',
            locator: { page: '/admin' },
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.questId).toBe('add-auth');
      expect(result.contexts).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Admin Page',
          description: 'User admin section',
          locator: { page: '/admin' },
        },
      ]);
    });

    it('VALID: {questId, contracts} => parses with contracts array', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contracts: [
          {
            id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginCredentials',
            kind: 'data',
            status: 'new',
            properties: [
              {
                name: 'email',
                type: 'EmailAddress',
                description: 'User email for authentication',
              },
            ],
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.questId).toBe('add-auth');
      expect(result.contracts).toStrictEqual([
        {
          id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
          name: 'LoginCredentials',
          kind: 'data',
          status: 'new',
          properties: [
            {
              name: 'email',
              type: 'EmailAddress',
              description: 'User email for authentication',
            },
          ],
        },
      ]);
    });

    it('VALID: {questId, flows} => parses with flows array', () => {
      const flow = FlowStub();
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [flow],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.questId).toBe('add-auth');
      expect(result.flows).toStrictEqual([flow]);
    });

    it('VALID: {questId, clarifications} => parses with clarifications array', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        clarifications: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            questions: [
              {
                question: 'Which framework?',
                header: 'Framework Choice',
                options: [
                  { label: 'React', description: 'Component-based UI' },
                  { label: 'Vue', description: 'Progressive framework' },
                ],
                multiSelect: false,
              },
            ],
            answer: 'React',
            timestamp: '2024-01-15T10:00:00.000Z',
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.questId).toBe('add-auth');
      expect(result.clarifications).toHaveLength(1);
    });

    it('VALID: {questId, status} => parses with status field', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'requirements_approved',
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.questId).toBe('add-auth');
      expect(result.status).toBe('requirements_approved');
    });

    it('VALID: {questId, steps} => parses with steps array', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        steps: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Create API',
            description: 'Create authentication API',
            observablesSatisfied: [],
            dependsOn: [],
            filesToCreate: [],
            filesToModify: [],
            status: 'pending',
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.questId).toBe('add-auth');
      expect(result.steps).toHaveLength(1);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_QUEST_ID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return modifyQuestInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID_QUEST_ID: {missing questId} => throws validation error', () => {
      expect(() => {
        return modifyQuestInputContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});

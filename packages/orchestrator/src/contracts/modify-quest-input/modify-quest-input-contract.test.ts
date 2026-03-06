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

    it('VALID: {questId, status} => parses with status field', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'approved',
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.questId).toBe('add-auth');
      expect(result.status).toBe('approved');
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
      expect(result.steps).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Create API',
          description: 'Create authentication API',
          observablesSatisfied: [],
          dependsOn: [],
          filesToCreate: [],
          filesToModify: [],
          status: 'pending',
          inputContracts: [],
          outputContracts: [],
        },
      ]);
    });

    it('VALID: {questId, designDecisions} => parses with design decisions array', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        designDecisions: [
          {
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
            relatedNodeIds: [],
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.questId).toBe('add-auth');
      expect(result.designDecisions).toStrictEqual([
        {
          id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
          title: 'Use JWT for auth',
          rationale: 'Stateless authentication',
          relatedNodeIds: [],
        },
      ]);
    });
  });

  describe('optional flow sub-arrays', () => {
    it('VALID: {flow with nodes but no edges} => edges is undefined', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'flow-a',
            name: 'Auth Flow',
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
            nodes: [{ id: 'n1', label: 'Login', type: 'state', observables: [] }],
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.flows![0]!.nodes).toStrictEqual([
        { id: 'n1', label: 'Login', type: 'state', observables: [] },
      ]);
      expect(result.flows![0]!.edges).toBeUndefined();
    });

    it('VALID: {flow with edges but no nodes} => nodes is undefined', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'flow-a',
            name: 'Auth Flow',
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
            edges: [{ id: 'e1', from: 'n1', to: 'n2' }],
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.flows![0]!.edges).toStrictEqual([{ id: 'e1', from: 'n1', to: 'n2' }]);
      expect(result.flows![0]!.nodes).toBeUndefined();
    });

    it('VALID: {node with no observables} => observables is undefined', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'flow-a',
            name: 'Auth Flow',
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
            nodes: [{ id: 'n1', label: 'Login', type: 'state' }],
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.flows![0]!.nodes![0]!.observables).toBeUndefined();
    });

    it('VALID: {node with observable with _delete: true} => _delete preserved', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'flow-a',
            name: 'Auth Flow',
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
            nodes: [
              {
                id: 'n1',
                label: 'Login',
                type: 'state',
                observables: [
                  {
                    id: 'obs-1',
                    type: 'ui-state',
                    description: 'shows login',
                    _delete: true,
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.flows![0]!.nodes![0]!.observables![0]!._delete).toBe(true);
    });

    it('VALID: {edge with _delete: true} => _delete preserved', () => {
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'flow-a',
            name: 'Auth Flow',
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
            edges: [{ id: 'e1', from: 'n1', to: 'n2', _delete: true }],
          },
        ],
      });

      const result = modifyQuestInputContract.parse(input);

      expect(result.flows![0]!.edges![0]!._delete).toBe(true);
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

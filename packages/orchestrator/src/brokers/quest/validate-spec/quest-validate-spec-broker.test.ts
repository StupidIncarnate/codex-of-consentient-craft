import { FlowStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { ValidateSpecInputStub } from '../../../contracts/validate-spec-input/validate-spec-input.stub';
import { questValidateSpecBroker } from './quest-validate-spec-broker';
import { questValidateSpecBrokerProxy } from './quest-validate-spec-broker.proxy';

describe('questValidateSpecBroker', () => {
  describe('successful validation', () => {
    it('VALID: {default quest} => returns success true with all 18 checks', async () => {
      const proxy = questValidateSpecBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest });

      const input = ValidateSpecInputStub({ questId: 'add-auth' });
      const result = await questValidateSpecBroker({ input });

      expect(result.success).toBe(true);
      expect(result.checks.map((c) => String(c.name))).toStrictEqual([
        'Flow Required Fields',
        'Flow ID Uniqueness',
        'Flow Node ID Uniqueness',
        'No Orphan Flow Nodes',
        'No Dead-End Non-Terminal Nodes',
        'Decision Node Branching',
        'Decision Edge Labels',
        'Terminal Node Observable Coverage',
        'Flow Edge ID Uniqueness',
        'Valid Flow References',
        'Observable Descriptions',
        'Observable ID Uniqueness Within Node',
        'Contract Node Anchoring',
        'Contract Name Uniqueness',
        'No Raw Primitives in Contracts',
        'Design Decision ID Uniqueness',
        'Design Decision Rationale',
        'Step Focus Target',
      ]);
      expect(result.checks.every((check) => check.passed)).toBe(true);
    });
  });

  describe('failing validation', () => {
    it('VALID: {quest with flow missing exitPoints} => returns success false with failing check', async () => {
      const proxy = questValidateSpecBrokerProxy();
      const quest = QuestStub({
        id: 'fail-exits',
        folder: '001-fail-exits',
        flows: [FlowStub({ exitPoints: [] })],
      });

      proxy.setupQuestFound({ quest });

      const input = ValidateSpecInputStub({ questId: 'fail-exits' });
      const result = await questValidateSpecBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        checks: [
          {
            name: 'Flow Required Fields',
            passed: false,
            details:
              'One or more flows are missing a required field (id, name, flowType, entryPoint, or exitPoints)',
          },
          {
            name: 'Flow ID Uniqueness',
            passed: true,
            details: 'All flow IDs are unique within the quest',
          },
          {
            name: 'Flow Node ID Uniqueness',
            passed: true,
            details: 'All node IDs are unique within each flow',
          },
          {
            name: 'No Orphan Flow Nodes',
            passed: true,
            details: 'All flow nodes are connected to at least one edge',
          },
          {
            name: 'No Dead-End Non-Terminal Nodes',
            passed: true,
            details: 'All non-terminal nodes have at least one outgoing edge',
          },
          {
            name: 'Decision Node Branching',
            passed: true,
            details: 'All decision nodes have at least 2 outgoing edges',
          },
          {
            name: 'Decision Edge Labels',
            passed: true,
            details: 'All edges leaving decision nodes have labels',
          },
          {
            name: 'Terminal Node Observable Coverage',
            passed: true,
            details: 'All terminal nodes have at least one observable',
          },
          {
            name: 'Flow Edge ID Uniqueness',
            passed: true,
            details: 'All edge IDs are unique within each flow',
          },
          {
            name: 'Valid Flow References',
            passed: true,
            details:
              'All edge from/to references resolve to existing nodes (including cross-flow refs)',
          },
          {
            name: 'Observable Descriptions',
            passed: true,
            details: 'All observables have non-empty descriptions',
          },
          {
            name: 'Observable ID Uniqueness Within Node',
            passed: true,
            details: 'All observable IDs are unique within each node',
          },
          {
            name: 'Contract Node Anchoring',
            passed: true,
            details: 'All contracts are anchored to existing flow nodes',
          },
          {
            name: 'Contract Name Uniqueness',
            passed: true,
            details: 'All contract names are unique within the quest',
          },
          {
            name: 'No Raw Primitives in Contracts',
            passed: true,
            details: 'All contract properties use branded or non-primitive types',
          },
          {
            name: 'Design Decision ID Uniqueness',
            passed: true,
            details: 'All design decision IDs are unique within the quest',
          },
          {
            name: 'Design Decision Rationale',
            passed: true,
            details: 'All design decisions have a non-empty rationale',
          },
          {
            name: 'Step Focus Target',
            passed: true,
            details: 'All steps have exactly one of focusFile or focusAction',
          },
        ],
      });
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId: nonexistent} => returns not found error', async () => {
      const proxy = questValidateSpecBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest });

      const input = ValidateSpecInputStub({ questId: 'nonexistent' });
      const result = await questValidateSpecBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error: 'Quest with id "nonexistent" not found in any guild',
      });
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questValidateSpecBrokerProxy();

      proxy.setupEmptyFolder();

      const input = ValidateSpecInputStub({ questId: 'any-quest' });
      const result = await questValidateSpecBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error: 'Quest with id "any-quest" not found in any guild',
      });
    });
  });

  describe('load failure', () => {
    it('ERROR: {questLoadBroker throws} => returns success false with error message', async () => {
      const proxy = questValidateSpecBrokerProxy();
      const quest = QuestStub({ id: 'load-fail', folder: '001-load-fail' });

      proxy.setupLoadFailure({
        quest,
        error: new Error('simulated load failure'),
      });

      const input = ValidateSpecInputStub({ questId: 'load-fail' });
      const result = await questValidateSpecBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error:
          'Failed to read file at /home/testuser/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests/001-load-fail/quest.json',
      });
    });
  });
});

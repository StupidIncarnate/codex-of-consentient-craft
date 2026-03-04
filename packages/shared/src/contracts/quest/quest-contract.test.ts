import { ContextStub } from '../context/context.stub';
import { DependencyStepStub } from '../dependency-step/dependency-step.stub';
import { FlowStub } from '../flow/flow.stub';
import { ObservableStub } from '../observable/observable.stub';
import { QuestContractEntryStub } from '../quest-contract-entry/quest-contract-entry.stub';
import { ToolingRequirementStub } from '../tooling-requirement/tooling-requirement.stub';
import { questContract } from './quest-contract';
import { QuestStub } from './quest.stub';

describe('questContract', () => {
  describe('valid quests', () => {
    it('VALID: minimal quest => parses successfully', () => {
      const quest = QuestStub();

      const result = questContract.parse(quest);

      expect(result).toStrictEqual({
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
        flows: [],
      });
    });

    it('VALID: completed quest => parses successfully', () => {
      const quest = QuestStub({
        status: 'complete',
        completedAt: '2024-01-16T10:00:00.000Z',
      });

      const result = questContract.parse(quest);

      expect(result.status).toBe('complete');
      expect(result.completedAt).toBe('2024-01-16T10:00:00.000Z');
    });

    it('VALID: abandoned quest with reason => parses successfully', () => {
      const quest = QuestStub({
        status: 'abandoned',
        abandonReason: 'Requirements changed',
      });

      const result = questContract.parse(quest);

      expect(result.status).toBe('abandoned');
      expect(result.abandonReason).toBe('Requirements changed');
    });

    it('VALID: quest with contexts => parses successfully', () => {
      const context = ContextStub();
      const quest = QuestStub({
        contexts: [context],
      });

      const result = questContract.parse(quest);

      expect(result.contexts).toStrictEqual([context]);
    });

    it('VALID: quest with observables => parses successfully', () => {
      const observable = ObservableStub();
      const quest = QuestStub({
        observables: [observable],
      });

      const result = questContract.parse(quest);

      expect(result.observables).toStrictEqual([observable]);
    });

    it('VALID: quest with steps => parses successfully', () => {
      const step = DependencyStepStub();
      const quest = QuestStub({
        steps: [step],
      });

      const result = questContract.parse(quest);

      expect(result.steps).toStrictEqual([step]);
    });

    it('VALID: quest with toolingRequirements => parses successfully', () => {
      const toolingRequirement = ToolingRequirementStub();
      const quest = QuestStub({
        toolingRequirements: [toolingRequirement],
      });

      const result = questContract.parse(quest);

      expect(result.toolingRequirements).toStrictEqual([toolingRequirement]);
    });

    it('VALID: quest with contracts array => parses successfully', () => {
      const contractEntry = QuestContractEntryStub();
      const quest = QuestStub({
        contracts: [contractEntry],
      });

      const result = questContract.parse(quest);

      expect(result.contracts).toStrictEqual([contractEntry]);
    });

    it('VALID: quest with flows => parses successfully', () => {
      const flow = FlowStub();
      const quest = QuestStub({
        flows: [flow],
      });

      const result = questContract.parse(quest);

      expect(result.flows).toStrictEqual([flow]);
    });

    it('VALID: quest without flows field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [],
        toolingRequirements: [],
      });

      expect(result.flows).toStrictEqual([]);
    });

    it('VALID: quest without contracts field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [],
        toolingRequirements: [],
      });

      expect(result.contracts).toStrictEqual([]);
    });
  });

  describe('invalid quests', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        questContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: empty id => throws validation error', () => {
      const baseQuest = QuestStub();

      expect(() => {
        questContract.parse({
          ...baseQuest,
          id: '',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: invalid status => throws validation error', () => {
      const baseQuest = QuestStub();

      expect(() => {
        questContract.parse({
          ...baseQuest,
          status: 'invalid',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: invalid timestamp => throws validation error', () => {
      const baseQuest = QuestStub();

      expect(() => {
        questContract.parse({
          ...baseQuest,
          createdAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});

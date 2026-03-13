import { DependencyStepStub } from '../dependency-step/dependency-step.stub';
import { FlowStub } from '../flow/flow.stub';
import { PathseekerRunStub } from '../pathseeker-run/pathseeker-run.stub';
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
        designDecisions: [],
        steps: [],
        toolingRequirements: [],
        contracts: [],
        flows: [],
        pathseekerRuns: [],
        needsDesign: false,
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

    it('VALID: needsDesign defaults to false => parses successfully', () => {
      const quest = QuestStub();

      const result = questContract.parse(quest);

      expect(result.needsDesign).toBe(false);
    });

    it('VALID: designPort is optional => parses without it', () => {
      const quest = QuestStub();

      const result = questContract.parse(quest);

      expect(result.designPort).toBeUndefined();
    });

    it('VALID: designSessionBy is optional => parses without it', () => {
      const quest = QuestStub();

      const result = questContract.parse(quest);

      expect(result.designSessionBy).toBeUndefined();
    });

    it('VALID: quest with design fields => parses successfully', () => {
      const quest = QuestStub({
        needsDesign: true,
        designPort: 5173,
        designSessionBy: 'session-123',
      });

      const result = questContract.parse(quest);

      expect(result.needsDesign).toBe(true);
      expect(result.designPort).toBe(5173);
      expect(result.designSessionBy).toBe('session-123');
    });

    it('VALID: quest without flows field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        steps: [],
        toolingRequirements: [],
      });

      expect(result.flows).toStrictEqual([]);
    });

    it('VALID: quest with pathseekerRuns => parses successfully', () => {
      const run = PathseekerRunStub({
        sessionId: 'session-abc',
        attempt: 1,
        status: 'complete',
        completedAt: '2024-01-15T11:00:00.000Z',
      });
      const quest = QuestStub({
        pathseekerRuns: [run],
      });

      const result = questContract.parse(quest);

      expect(result.pathseekerRuns).toStrictEqual([run]);
    });

    it('VALID: quest without pathseekerRuns field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        steps: [],
        toolingRequirements: [],
      });

      expect(result.pathseekerRuns).toStrictEqual([]);
    });

    it('VALID: quest without contracts field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
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

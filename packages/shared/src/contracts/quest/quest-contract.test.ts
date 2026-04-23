import { DependencyStepStub } from '../dependency-step/dependency-step.stub';
import { FlowStub } from '../flow/flow.stub';
import { PlanningBlightReportStub } from '../planning-blight-report/planning-blight-report.stub';
import { QuestContractEntryStub } from '../quest-contract-entry/quest-contract-entry.stub';
import { SmoketestCaseResultStub } from '../smoketest-case-result/smoketest-case-result.stub';
import { ToolingRequirementStub } from '../tooling-requirement/tooling-requirement.stub';
import { WardResultStub } from '../ward-result/ward-result.stub';
import { WorkItemStub } from '../work-item/work-item.stub';
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
        designDecisions: [],
        steps: [],
        toolingRequirements: [],
        contracts: [],
        flows: [],
        needsDesign: false,
        userRequest: 'Add authentication to the application',
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [], blightReports: [] },
      });
    });

    it('VALID: completed quest => parses successfully', () => {
      const quest = QuestStub({
        status: 'complete',
        completedAt: '2024-01-16T10:00:00.000Z',
      });

      const result = questContract.parse(quest);

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'complete',
        createdAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-16T10:00:00.000Z',
        designDecisions: [],
        steps: [],
        toolingRequirements: [],
        contracts: [],
        flows: [],
        needsDesign: false,
        userRequest: 'Add authentication to the application',
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [], blightReports: [] },
      });
    });

    it('VALID: abandoned quest with reason => parses successfully', () => {
      const quest = QuestStub({
        status: 'abandoned',
        abandonReason: 'Requirements changed',
      });

      const result = questContract.parse(quest);

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'abandoned',
        createdAt: '2024-01-15T10:00:00.000Z',
        abandonReason: 'Requirements changed',
        designDecisions: [],
        steps: [],
        toolingRequirements: [],
        contracts: [],
        flows: [],
        needsDesign: false,
        userRequest: 'Add authentication to the application',
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [], blightReports: [] },
      });
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

      expect(result.designPort).toBe(undefined);
    });

    it('VALID: quest with design fields => parses successfully', () => {
      const quest = QuestStub({
        needsDesign: true,
        designPort: 5173,
      });

      const result = questContract.parse(quest);

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        designDecisions: [],
        steps: [],
        toolingRequirements: [],
        contracts: [],
        flows: [],
        needsDesign: true,
        designPort: 5173,
        userRequest: 'Add authentication to the application',
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [], blightReports: [] },
      });
    });

    it('VALID: quest without flows field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
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
        userRequest: 'Add authentication to the application',
        steps: [],
        toolingRequirements: [],
      });

      expect(result.contracts).toStrictEqual([]);
    });

    it('VALID: quest with workItems => parses successfully', () => {
      const workItem = WorkItemStub();
      const quest = QuestStub({
        workItems: [workItem],
      });

      const result = questContract.parse(quest);

      expect(result.workItems).toStrictEqual([workItem]);
    });

    it('VALID: quest with wardResults => parses successfully', () => {
      const wardResult = WardResultStub();
      const quest = QuestStub({
        wardResults: [wardResult],
      });

      const result = questContract.parse(quest);

      expect(result.wardResults).toStrictEqual([wardResult]);
    });

    it('VALID: quest without workItems field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        steps: [],
        toolingRequirements: [],
      });

      expect(result.workItems).toStrictEqual([]);
    });

    it('VALID: quest without wardResults field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        steps: [],
        toolingRequirements: [],
      });

      expect(result.wardResults).toStrictEqual([]);
    });

    it('VALID: quest with populated blightReports => parses successfully', () => {
      const firstReport = PlanningBlightReportStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        minion: 'security',
        status: 'active',
      });
      const secondReport = PlanningBlightReportStub({
        id: 'aabbccdd-58cc-4372-a567-0e02b2c3d479',
        minion: 'dedup',
        status: 'resolved',
      });
      const quest = QuestStub({
        planningNotes: { surfaceReports: [], blightReports: [firstReport, secondReport] },
      });

      const result = questContract.parse(quest);

      expect(result.planningNotes).toStrictEqual({
        surfaceReports: [],
        blightReports: [firstReport, secondReport],
      });
    });

    it('VALID: quest without planningNotes field => backward compat defaults to {surfaceReports: [], blightReports: []}', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        steps: [],
        toolingRequirements: [],
      });

      expect(result.planningNotes).toStrictEqual({ surfaceReports: [], blightReports: [] });
    });

    it('VALID: quest with pausedAtStatus => parses successfully', () => {
      const quest = QuestStub({
        status: 'paused',
        pausedAtStatus: 'seek_scope',
      });

      const result = questContract.parse(quest);

      expect(result.pausedAtStatus).toBe('seek_scope');
    });

    it('VALID: quest without pausedAtStatus field => backward compat leaves it undefined', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        steps: [],
        toolingRequirements: [],
      });

      expect(result.pausedAtStatus).toBe(undefined);
    });

    it('VALID: {pausedAtStatus: null} => parses with pausedAtStatus as null (clear marker)', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        steps: [],
        toolingRequirements: [],
        pausedAtStatus: null,
      });

      expect(result.pausedAtStatus).toBe(null);
    });

    it('VALID: quest with questSource => parses successfully', () => {
      const quest = QuestStub({ questSource: 'smoketest-mcp' });

      const result = questContract.parse(quest);

      expect(result.questSource).toBe('smoketest-mcp');
    });

    it('VALID: quest without questSource field => leaves it undefined', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        steps: [],
        toolingRequirements: [],
      });

      expect(result.questSource).toBe(undefined);
    });

    it('VALID: quest with smoketestResults => parses successfully', () => {
      const caseResult = SmoketestCaseResultStub();
      const quest = QuestStub({ smoketestResults: [caseResult] });

      const result = questContract.parse(quest);

      expect(result.smoketestResults).toStrictEqual([caseResult]);
    });

    it('VALID: quest without smoketestResults field => leaves it undefined', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        steps: [],
        toolingRequirements: [],
      });

      expect(result.smoketestResults).toBe(undefined);
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

    it('INVALID: questSource with invalid enum value => throws validation error', () => {
      const baseQuest = QuestStub();

      expect(() => {
        questContract.parse({
          ...baseQuest,
          questSource: 'not-a-source',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});

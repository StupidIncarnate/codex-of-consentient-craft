import { FlowStub } from '../flow/flow.stub';
import { FlowNodeStub } from '../flow-node/flow-node.stub';
import { OperationItemStub } from '../operation-item/operation-item.stub';
import { PackageGraphEntryStub } from '../package-graph-entry/package-graph-entry.stub';
import { PlanningBlightReportStub } from '../planning-blight-report/planning-blight-report.stub';
import { QuestBlightLedgerEntryStub } from '../quest-blight-ledger-entry/quest-blight-ledger-entry.stub';
import { QuestCommentStub } from '../quest-comment/quest-comment.stub';
import { QuestContractEntryStub } from '../quest-contract-entry/quest-contract-entry.stub';
import { QuestNoteStub } from '../quest-note/quest-note.stub';
import { QuestPackageEntryStub } from '../quest-package-entry/quest-package-entry.stub';
import { RiftcarverResultStub } from '../riftcarver-result/riftcarver-result.stub';
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
        questType: 'feature',
        createdAt: '2024-01-15T10:00:00.000Z',
        designDecisions: [],
        operations: [],
        toolingRequirements: [],
        packagesAffected: [],
        packageGraph: [],
        contracts: [],
        flows: [FlowStub()],
        comments: [],
        needsDesign: false,
        userRequest: 'Add authentication to the application',
        workItems: [],
        wardResults: [],
        riftcarverResults: [],
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [], questNotes: [] },
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
        questType: 'feature',
        createdAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-16T10:00:00.000Z',
        designDecisions: [],
        operations: [],
        toolingRequirements: [],
        packagesAffected: [],
        packageGraph: [],
        contracts: [],
        flows: [FlowStub()],
        comments: [],
        needsDesign: false,
        userRequest: 'Add authentication to the application',
        workItems: [],
        wardResults: [],
        riftcarverResults: [],
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [], questNotes: [] },
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
        questType: 'feature',
        createdAt: '2024-01-15T10:00:00.000Z',
        abandonReason: 'Requirements changed',
        designDecisions: [],
        operations: [],
        toolingRequirements: [],
        packagesAffected: [],
        packageGraph: [],
        contracts: [],
        flows: [FlowStub()],
        comments: [],
        needsDesign: false,
        userRequest: 'Add authentication to the application',
        workItems: [],
        wardResults: [],
        riftcarverResults: [],
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [], questNotes: [] },
      });
    });

    it('VALID: quest with operations => parses successfully', () => {
      const operation = OperationItemStub();
      const quest = QuestStub({
        operations: [operation],
      });

      const result = questContract.parse(quest);

      expect(result.operations).toStrictEqual([operation]);
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

    it('VALID: quest with comments => parses successfully', () => {
      const quest = QuestStub({
        comments: [QuestCommentStub()],
      });

      const result = questContract.parse(quest);

      expect(result.comments).toStrictEqual([QuestCommentStub()]);
    });

    it('VALID: quest without comments field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.comments).toStrictEqual([]);
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
        operations: [],
        toolingRequirements: [],
        packagesAffected: [],
        packageGraph: [],
        contracts: [],
        flows: [FlowStub()],
        comments: [],
        needsDesign: true,
        designPort: 5173,
        questType: 'feature',
        userRequest: 'Add authentication to the application',
        workItems: [],
        wardResults: [],
        riftcarverResults: [],
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [], questNotes: [] },
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
        operations: [],
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
        operations: [],
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

    it('VALID: quest with riftcarverResults => parses successfully', () => {
      const riftcarverResult = RiftcarverResultStub();
      const quest = QuestStub({
        riftcarverResults: [riftcarverResult],
      });

      const result = questContract.parse(quest);

      expect(result.riftcarverResults).toStrictEqual([riftcarverResult]);
    });

    it('VALID: quest with two riftcarverResults => keeps both attempts rather than the last one', () => {
      const failedAttempt = RiftcarverResultStub({
        id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        exitCode: 1,
        failedStep: 'build',
        outcome: 'repairable',
      });
      const repairedAttempt = RiftcarverResultStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        exitCode: 0,
        outcome: 'green',
      });
      const quest = QuestStub({
        riftcarverResults: [failedAttempt, repairedAttempt],
      });

      const result = questContract.parse(quest);

      expect(result.riftcarverResults).toStrictEqual([failedAttempt, repairedAttempt]);
    });

    it('VALID: quest without riftcarverResults field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.riftcarverResults).toStrictEqual([]);
    });

    it('VALID: quest without workItems field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
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
        operations: [],
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
        planningNotes: {
          blightReports: [firstReport, secondReport],
        },
      });

      const result = questContract.parse(quest);

      expect(result.planningNotes).toStrictEqual({
        blightReports: [firstReport, secondReport],
        qaLedger: [],
        blightLedger: [],
        questNotes: [],
      });
    });

    it('VALID: quest with populated blightLedger => parses successfully', () => {
      const firstEntry = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
      });
      const secondEntry = QuestBlightLedgerEntryStub({
        itemId: 'packages/shared/src/index.ts:integrity',
        disposition: 'gap',
        evidence: 'no browser bridge is reachable from this session',
      });
      const quest = QuestStub({
        planningNotes: {
          blightReports: [],
          qaLedger: [],
          blightLedger: [firstEntry, secondEntry],
        },
      });

      const result = questContract.parse(quest);

      expect(result.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [],
        blightLedger: [firstEntry, secondEntry],
        questNotes: [],
      });
    });

    it('VALID: quest with two questNotes => round-trips both entries', () => {
      const openQuestion = QuestNoteStub({
        id: 'open-question-comment-anchor-scope',
        kind: 'open-question',
      });
      const toolingError = QuestNoteStub({
        id: 'tooling-error-browser-bridge',
        kind: 'tooling-error',
        role: 'flowrider',
        summary: 'The browser bridge never attached on this host.',
        detail: 'Chrome launched but the extension port stayed closed, so no walk could be driven.',
      });
      const quest = QuestStub({
        planningNotes: {
          blightReports: [],
          qaLedger: [],
          blightLedger: [],
          questNotes: [openQuestion, toolingError],
        },
      });

      const result = questContract.parse(quest);

      expect(result.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [],
        blightLedger: [],
        questNotes: [openQuestion, toolingError],
      });
    });

    it('VALID: quest without planningNotes field => backward compat defaults to empty blightReports, qaLedger, blightLedger, and questNotes', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [],
        blightLedger: [],
        questNotes: [],
      });
    });

    it('VALID: quest with baseRef => parses successfully', () => {
      const quest = QuestStub({ baseRef: 'a1b2c3d4e5f6' });

      const result = questContract.parse(quest);

      expect(result.baseRef).toBe('a1b2c3d4e5f6');
    });

    it('VALID: quest without baseRef field => leaves it undefined', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.baseRef).toBe(undefined);
    });

    it('VALID: quest with branchName, baseBranch and worktreePath => parses successfully', () => {
      const quest = QuestStub({
        branchName: 'quest/add-auth-7bc217a1',
        baseBranch: 'main',
        worktreePath: '/repo/worktrees/add-auth-7bc217a1',
      });

      const result = questContract.parse(quest);

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        questType: 'feature',
        createdAt: '2024-01-15T10:00:00.000Z',
        designDecisions: [],
        operations: [],
        toolingRequirements: [],
        packagesAffected: [],
        packageGraph: [],
        contracts: [],
        flows: [FlowStub()],
        comments: [],
        needsDesign: false,
        userRequest: 'Add authentication to the application',
        workItems: [],
        wardResults: [],
        riftcarverResults: [],
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [], questNotes: [] },
        branchName: 'quest/add-auth-7bc217a1',
        baseBranch: 'main',
        worktreePath: '/repo/worktrees/add-auth-7bc217a1',
      });
    });

    it('VALID: quest without branchName field => leaves it undefined', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.branchName).toBe(undefined);
    });

    it('VALID: quest without baseBranch field => leaves it undefined', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.baseBranch).toBe(undefined);
    });

    it('VALID: quest without worktreePath field => leaves it undefined', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.worktreePath).toBe(undefined);
    });

    it('VALID: quest with pausedAtStatus => parses successfully', () => {
      const quest = QuestStub({
        status: 'paused',
        pausedAtStatus: 'in_progress',
      });

      const result = questContract.parse(quest);

      expect(result.pausedAtStatus).toBe('in_progress');
    });

    it('VALID: quest without pausedAtStatus field => backward compat leaves it undefined', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
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
        operations: [],
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
        operations: [],
        toolingRequirements: [],
      });

      expect(result.questSource).toBe(undefined);
    });

    it('VALID: quest with packagesAffected => parses each declared package as a full entry', () => {
      const editEntry = QuestPackageEntryStub();
      const newEntry = QuestPackageEntryStub({
        name: 'token-store',
        location: './packages/token-store',
        changeType: 'new',
        packageType: 'programmatic-service',
        usedBy: ['auth-service'],
      });
      const quest = QuestStub({
        packagesAffected: [editEntry, newEntry],
      });

      const result = questContract.parse(quest);

      expect(result.packagesAffected).toStrictEqual([editEntry, newEntry]);
    });

    it('VALID: quest without packagesAffected field => backward compat defaults to empty array', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.packagesAffected).toStrictEqual([]);
    });

    it('INVALID: quest with a bare package name in packagesAffected => throws, the list carries entries and not strings', () => {
      const quest = QuestStub();

      expect(() => {
        questContract.parse({
          ...quest,
          packagesAffected: ['auth-service'],
        });
      }).toThrow(/Expected object, received string/u);
    });

    it('VALID: quest with packageGraph => round-trips the derived post-quest dependency layers', () => {
      const leaf = PackageGraphEntryStub();
      const dependent = PackageGraphEntryStub({
        id: 'gateway',
        dependsOn: ['auth-service'],
        depth: 1,
        packageType: 'http-backend',
      });
      const quest = QuestStub({ packageGraph: [leaf, dependent] });

      const result = questContract.parse(quest);

      expect(result.packageGraph).toStrictEqual([leaf, dependent]);
    });

    it('VALID: quest without packageGraph field => defaults to empty, the shape before Start stamps it', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.packageGraph).toStrictEqual([]);
    });

    it('INVALID: quest whose flow carries a node with no packages => throws Required, so an untagged node cannot reach disk', () => {
      const quest = QuestStub();

      expect(() => {
        questContract.parse({
          ...quest,
          flows: [
            {
              id: 'login-flow',
              name: 'Login Flow',
              flowType: 'runtime',
              entryPoint: '/login',
              exitPoints: ['/dashboard'],
              nodes: [{ id: 'login-page', label: 'Login Page', type: 'state' }],
              edges: [],
            },
          ],
        });
      }).toThrow(/Required/u);
    });

    it('VALID: quest whose flow carries a tagged node => parses, the same shape with the tag present', () => {
      const node = FlowNodeStub({ packages: ['auth-service'] });
      const quest = QuestStub({ flows: [FlowStub({ nodes: [node] })] });

      const result = questContract.parse(quest);

      expect(result.flows[0]?.nodes).toStrictEqual([node]);
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
        operations: [],
        toolingRequirements: [],
      });

      expect(result.smoketestResults).toBe(undefined);
    });

    it('VALID: quest with questType bug-hunt => parses successfully', () => {
      const quest = QuestStub({ questType: 'bug-hunt' });

      const result = questContract.parse(quest);

      expect(result.questType).toBe('bug-hunt');
    });

    it('VALID: quest without questType field => backward compat defaults to feature', () => {
      const result = questContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        operations: [],
        toolingRequirements: [],
      });

      expect(result.questType).toBe('feature');
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

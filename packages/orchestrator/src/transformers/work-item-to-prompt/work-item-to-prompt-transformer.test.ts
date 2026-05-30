import {
  DependencyStepStub,
  FlowStub,
  PackageNameStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  SliceNameStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { blightwardenSecurityMinionStatics } from '../../statics/blightwarden-security-minion/blightwarden-security-minion-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { lawbringerPromptStatics } from '../../statics/lawbringer-prompt/lawbringer-prompt-statics';
import { pathseekerDedupStatics } from '../../statics/pathseeker-dedup/pathseeker-dedup-statics';
import { pathseekerSurfaceStatics } from '../../statics/pathseeker-surface/pathseeker-surface-statics';
import { pathseekerWalkStatics } from '../../statics/pathseeker-walk/pathseeker-walk-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { workItemToPromptTransformer } from './work-item-to-prompt-transformer';

describe('workItemToPromptTransformer', () => {
  describe('pathseeker-surface with slice', () => {
    it('VALID: {agent: pathseeker-surface, workItem.sliceName matches slice on quest} => substitutes slice details', () => {
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker-surface',
        sliceName: SliceNameStub({ value: 'orchestrator' }),
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        workItems: [workItem],
        planningNotes: {
          surfaceReports: [],
          blightReports: [],
          scopeClassification: {
            size: 'small',
            slicing: 'one slice per affected package',
            slices: [
              {
                name: SliceNameStub({ value: 'orchestrator' }),
                packages: [PackageNameStub({ value: 'orchestrator' })],
                flowIds: [],
              },
            ],
            rationale: 'small monorepo touch',
            classifiedAt: '2024-01-15T10:00:00.000Z',
          },
        },
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'pathseeker-surface' }),
      });

      const expectedArgs =
        'Quest ID: my-quest\nSlice: orchestrator\nPackages: orchestrator\nFlow IDs: ';

      expect(result.prompt).toBe(
        pathseekerSurfaceStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('pathseeker-surface without slice', () => {
    it('EDGE: {agent: pathseeker-surface, no sliceName on workItem} => substitutes Quest ID only', () => {
      const workItem = WorkItemStub({ role: 'pathseeker-surface' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'pathseeker-surface' }),
      });

      expect(result.prompt).toBe(
        pathseekerSurfaceStatics.prompt.template.replace('$ARGUMENTS', 'Quest ID: my-quest'),
      );
    });
  });

  describe('pathseeker-dedup', () => {
    it('VALID: {agent: pathseeker-dedup} => substitutes Quest ID', () => {
      const workItem = WorkItemStub({ role: 'pathseeker-dedup' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'pathseeker-dedup' }),
      });

      expect(result.prompt).toBe(
        pathseekerDedupStatics.prompt.template.replace('$ARGUMENTS', 'Quest ID: my-quest'),
      );
    });
  });

  describe('pathseeker-walk', () => {
    it('VALID: {agent: pathseeker-walk} => substitutes Quest ID', () => {
      const workItem = WorkItemStub({ role: 'pathseeker-walk' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'pathseeker-walk' }),
      });

      expect(result.prompt).toBe(
        pathseekerWalkStatics.prompt.template.replace('$ARGUMENTS', 'Quest ID: my-quest'),
      );
    });
  });

  describe('codeweaver', () => {
    it('VALID: {agent: codeweaver, workItem with one step} => substitutes step + Quest ID', () => {
      const step = DependencyStepStub({
        id: 'orchestrator-create-broker',
        name: 'Create Broker',
        focusFile: { path: 'src/brokers/auth/auth-broker.ts' },
        accompanyingFiles: [],
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
      });
      const workItem = WorkItemStub({
        role: 'codeweaver',
        relatedDataItems: [RelatedDataItemStub({ value: 'steps/orchestrator-create-broker' })],
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        steps: [step],
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'codeweaver' }),
      });

      const expectedArgs =
        'Step: Create Broker\nFocus File: src/brokers/auth/auth-broker.ts\nAssertions:\n  - VALID: returns expected result\nQuest ID: my-quest';

      expect(result.prompt).toBe(
        codeweaverPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('lawbringer', () => {
    it('VALID: {agent: lawbringer, workItem with one step} => substitutes files list', () => {
      const step = DependencyStepStub({
        id: 'orchestrator-broker',
        focusFile: { path: 'src/broker.ts' },
        accompanyingFiles: [{ path: 'src/broker.test.ts' }],
      });
      const workItem = WorkItemStub({
        role: 'lawbringer',
        relatedDataItems: [RelatedDataItemStub({ value: 'steps/orchestrator-broker' })],
      });
      const quest = QuestStub({ steps: [step], workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'lawbringer' }),
      });

      const expectedArgs = 'Files to Review:\n  - src/broker.ts\n  - src/broker.test.ts';

      expect(result.prompt).toBe(
        lawbringerPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {agent: lawbringer, empty relatedDataItems} => whole-diff mode (bug-hunt)', () => {
      const workItem = WorkItemStub({ role: 'lawbringer', relatedDataItems: [] });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        questType: 'bug-hunt',
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'lawbringer' }),
      });

      const expectedArgs =
        'Review Mode: whole-diff\nReview the entire branch diff: run `git diff main...HEAD --name-only`, then read and review every changed non-test file alongside its test.\nQuest ID: my-quest';

      expect(result.prompt).toBe(
        lawbringerPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('spiritmender', () => {
    it('VALID: {agent: spiritmender, workItem with one step} => substitutes files', () => {
      const step = DependencyStepStub({
        id: 'orchestrator-broker',
        focusFile: { path: 'src/broker.ts' },
        accompanyingFiles: [],
      });
      const workItem = WorkItemStub({
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: 'steps/orchestrator-broker' })],
      });
      const quest = QuestStub({ steps: [step], workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'spiritmender' }),
      });

      const expectedArgs =
        'Files:\n  - src/broker.ts\nRun npm run ward on the files to verify fixes.';

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('siegemaster', () => {
    it('VALID: {agent: siegemaster, workItem with one flow} => substitutes $ARGUMENTS (no literal placeholder remains)', () => {
      const flow = FlowStub();
      const workItem = WorkItemStub({
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        flows: [flow],
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'siegemaster' }),
      });

      // Siegemaster argument shape is large (flow nodes, edges, observable type glossary).
      // Confirm the placeholder was substituted — detailed Quest ID / Flow name lines
      // are exercised by work-unit-to-arguments-transformer.test.ts.
      expect(result.prompt.endsWith('$ARGUMENTS')).toBe(false);
    });
  });

  describe('blightwarden', () => {
    it('VALID: {agent: blightwarden} => substitutes Quest ID, no $ARGUMENTS literal remains', () => {
      const workItem = WorkItemStub({ role: 'blightwarden' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'blightwarden' }),
      });

      // Blightwarden's argument shape is just "Quest ID: my-quest" when no scopeSize
      // and no designDecisions. The template substitution must not leave $ARGUMENTS.
      // Detailed lines are exercised by work-unit-to-arguments-transformer.test.ts.
      expect(result.prompt.endsWith('$ARGUMENTS')).toBe(false);
    });
  });

  describe('chaoswhisperer-gap-minion', () => {
    it('VALID: {agent: chaoswhisperer-gap-minion} => substitutes Quest ID + Work Item ID', () => {
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' }),
      });

      const expectedArgs = 'Quest ID: my-quest\nWork Item ID: aaaaaaaa-1111-4222-9333-444444444444';

      expect(result.prompt).toBe(
        chaoswhispererGapMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('blightwarden-security-minion', () => {
    it('VALID: {agent: blightwarden-security-minion} => substitutes Quest ID + Work Item ID', () => {
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'blightwarden' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'blightwarden-security-minion' }),
      });

      const expectedArgs = 'Quest ID: my-quest\nWork Item ID: bbbbbbbb-1111-4222-9333-444444444444';

      expect(result.prompt).toBe(
        blightwardenSecurityMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('pesteater', () => {
    it('VALID: {agent: pesteater} => substitutes Quest ID + Work Item ID (reads quest itself, no steps)', () => {
      const workItemId = QuestWorkItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'pesteater', relatedDataItems: [] });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        questType: 'bug-hunt',
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'pesteater' }),
      });

      const expectedArgs = 'Quest ID: my-quest\nWork Item ID: cccccccc-1111-4222-9333-444444444444';

      expect(result.prompt).toBe(
        pesteaterPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('errors', () => {
    it('ERROR: {agent: unknown name} => throws ZodError', () => {
      const workItem = WorkItemStub();
      const quest = QuestStub({ workItems: [workItem] });

      expect(() =>
        workItemToPromptTransformer({
          quest,
          workItem,
          agentName: 'unknown-agent',
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('ERROR: {agent: codeweaver, workItem with no relatedDataItems} => throws', () => {
      const workItem = WorkItemStub({ role: 'codeweaver', relatedDataItems: [] });
      const quest = QuestStub({ workItems: [workItem] });

      expect(() =>
        workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        }),
      ).toThrow(/has no relatedDataItems/u);
    });
  });
});

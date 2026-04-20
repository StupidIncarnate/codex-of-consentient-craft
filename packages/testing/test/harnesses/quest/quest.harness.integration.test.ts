import { readFileSync } from 'fs';
import { join } from 'path';

import {
  PlanningReviewReportStub,
  PlanningScopeClassificationStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
} from '@dungeonmaster/shared/contracts';

import { BaseNameStub, installTestbedCreateBroker } from '@dungeonmaster/testing';

import { questHarness } from './quest.harness';

describe('questHarness writeQuestFile gate-content seeding', () => {
  const harness = questHarness({ request: {} as never });

  describe('seek_synth', () => {
    it('VALID: {seed with status: seek_synth, no overrides} => planningNotes has scopeClassification stub, other seek fields undefined', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-seek-synth' }),
      });
      const questFilePath = join(testbed.guildPath, 'quest.json');

      harness.writeQuestFile({
        questId: 'q1',
        questFolder: 'qf1',
        questFilePath,
        status: 'seek_synth',
        workItems: [],
      });

      const parsed = JSON.parse(readFileSync(questFilePath, 'utf8'));
      testbed.cleanup();

      expect(parsed.planningNotes).toStrictEqual({
        scopeClassification: PlanningScopeClassificationStub(),
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('seek_walk', () => {
    it('VALID: {seed with status: seek_walk, no overrides} => planningNotes has scopeClassification + synthesis stubs', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-seek-walk' }),
      });
      const questFilePath = join(testbed.guildPath, 'quest.json');

      harness.writeQuestFile({
        questId: 'q2',
        questFolder: 'qf2',
        questFilePath,
        status: 'seek_walk',
        workItems: [],
      });

      const parsed = JSON.parse(readFileSync(questFilePath, 'utf8'));
      testbed.cleanup();

      expect(parsed.planningNotes).toStrictEqual({
        scopeClassification: PlanningScopeClassificationStub(),
        synthesis: PlanningSynthesisStub(),
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('seek_plan', () => {
    it('VALID: {seed with status: seek_plan, no overrides} => planningNotes has scopeClassification + synthesis + walkFindings stubs', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-seek-plan' }),
      });
      const questFilePath = join(testbed.guildPath, 'quest.json');

      harness.writeQuestFile({
        questId: 'q3',
        questFolder: 'qf3',
        questFilePath,
        status: 'seek_plan',
        workItems: [],
      });

      const parsed = JSON.parse(readFileSync(questFilePath, 'utf8'));
      testbed.cleanup();

      expect(parsed.planningNotes).toStrictEqual({
        scopeClassification: PlanningScopeClassificationStub(),
        synthesis: PlanningSynthesisStub(),
        walkFindings: PlanningWalkFindingsStub(),
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('in_progress', () => {
    it('VALID: {seed with status: in_progress, no overrides} => planningNotes has scopeClassification + synthesis + walkFindings + reviewReport stubs', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-in-progress' }),
      });
      const questFilePath = join(testbed.guildPath, 'quest.json');

      harness.writeQuestFile({
        questId: 'q4',
        questFolder: 'qf4',
        questFilePath,
        status: 'in_progress',
        workItems: [],
      });

      const parsed = JSON.parse(readFileSync(questFilePath, 'utf8'));
      testbed.cleanup();

      expect(parsed.planningNotes).toStrictEqual({
        scopeClassification: PlanningScopeClassificationStub(),
        synthesis: PlanningSynthesisStub(),
        walkFindings: PlanningWalkFindingsStub(),
        reviewReport: PlanningReviewReportStub(),
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('caller overrides', () => {
    it('VALID: {seed with status: seek_synth, scopeClassification override} => override kept (not overwritten by stub)', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-override-scope' }),
      });
      const questFilePath = join(testbed.guildPath, 'quest.json');
      const customScope = PlanningScopeClassificationStub({
        size: 'large',
        slicing: 'Custom slicing from caller' as never,
        rationale: 'Caller-provided rationale' as never,
      });

      harness.writeQuestFile({
        questId: 'q5',
        questFolder: 'qf5',
        questFilePath,
        status: 'seek_synth',
        workItems: [],
        planningNotes: { scopeClassification: customScope },
      });

      const parsed = JSON.parse(readFileSync(questFilePath, 'utf8'));
      testbed.cleanup();

      expect(parsed.planningNotes).toStrictEqual({
        scopeClassification: JSON.parse(JSON.stringify(customScope)),
        surfaceReports: [],
        blightReports: [],
      });
    });

    it('VALID: {seed with status: seek_walk, scopeClassification override only} => override kept AND synthesis stub added', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-override-partial' }),
      });
      const questFilePath = join(testbed.guildPath, 'quest.json');
      const customScope = PlanningScopeClassificationStub({
        size: 'small',
        slicing: 'User slicing' as never,
        rationale: 'User rationale' as never,
      });

      harness.writeQuestFile({
        questId: 'q6',
        questFolder: 'qf6',
        questFilePath,
        status: 'seek_walk',
        workItems: [],
        planningNotes: { scopeClassification: customScope },
      });

      const parsed = JSON.parse(readFileSync(questFilePath, 'utf8'));
      testbed.cleanup();

      expect(parsed.planningNotes).toStrictEqual({
        scopeClassification: JSON.parse(JSON.stringify(customScope)),
        synthesis: PlanningSynthesisStub(),
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('review_observables', () => {
    it('VALID: {seed with status: review_observables, no overrides} => default flow terminal node has a seeded observable', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-review-obs' }),
      });
      const questFilePath = join(testbed.guildPath, 'quest.json');

      harness.writeQuestFile({
        questId: 'q7',
        questFolder: 'qf7',
        questFilePath,
        status: 'review_observables',
        workItems: [],
      });

      const parsed = JSON.parse(readFileSync(questFilePath, 'utf8'));
      testbed.cleanup();

      const { flows } = parsed;
      const terminalObservableListSizes = flows
        .flatMap((flow: { nodes: { type?: string; observables: unknown[] }[] }) => flow.nodes)
        .filter((node: { type?: string }) => node.type === 'terminal')
        .map((node: { observables: unknown[] }) => node.observables.length);

      expect(terminalObservableListSizes).toStrictEqual([1]);
    });
  });

  describe('non-gated statuses', () => {
    it('VALID: {seed with status: created, no overrides} => planningNotes has only empty report arrays', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-created' }),
      });
      const questFilePath = join(testbed.guildPath, 'quest.json');

      harness.writeQuestFile({
        questId: 'q8',
        questFolder: 'qf8',
        questFilePath,
        status: 'created',
        workItems: [],
      });

      const parsed = JSON.parse(readFileSync(questFilePath, 'utf8'));
      testbed.cleanup();

      expect(parsed.planningNotes).toStrictEqual({
        surfaceReports: [],
        blightReports: [],
      });
    });
  });
});

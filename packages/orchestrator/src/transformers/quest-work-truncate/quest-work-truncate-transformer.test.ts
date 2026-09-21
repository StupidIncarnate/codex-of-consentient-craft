import { qaCheckSurfaceStatics, questFlowSliceLimitsStatics } from '@dungeonmaster/shared/statics';

import { QuestWorkViewStub } from '../../contracts/quest-work-view/quest-work-view.stub';
import { questWorkLimitsStatics } from '../../statics/quest-work-limits/quest-work-limits-statics';
import { questWorkTruncateTransformer } from './quest-work-truncate-transformer';

// THE MEASURED WORST CASE, from `questFlowSliceLimitsStatics`' own header: the largest flow of a
// real quest is 18 nodes, 19 edges and 47 observables. Those become 47 observable rows, 19 labelled
// branch rows and 19 walk paths of 18 nodes each. Every third observable carries the mark, evidence
// and `toSettle` a settled unit really holds; the rest are outstanding, which is what a session
// fetching its work at START is mostly handed.
//
// MEASURED ON THIS FIXTURE, serialized at indent 2: the units alone are 37,016 characters, the walk
// paths 7,649, and the whole return 51,145 — 1,145 over the ceiling before a single flow is
// rendered. That is why this transformer exists, and why the cut order ends at `walkPaths`.
const OBSERVABLE_COUNT = 47;
const BRANCH_COUNT = 19;
const NODE_COUNT = 18;
const ASSIGNED_SLICE = 6;
const MARKED_EVERY = 3;

const OBSERVABLE_UNITS = Array.from({ length: OBSERVABLE_COUNT }, (_value, index) => ({
  unitId: `send-flow:observable:scan-finds-every-path-${String(index)}`,
  kind: 'observable',
  text: `the badge reads off the persisted list rather than the queue, case ${String(index)}`,
  surface: qaCheckSurfaceStatics.byOutcomeType['ui-state'],
  nodeId: 'compose',
  edgeId: null,
  observableType: 'ui-state',
  verifyByReading: false,
  mark: index % MARKED_EVERY === 0 ? 'cant-meet' : null,
  evidence:
    index % MARKED_EVERY === 0
      ? `packages/web/src/widgets/a-widget.test.tsx:${String(index)} — flips to red when the guard returns true`
      : null,
  toSettle:
    index % MARKED_EVERY === 0
      ? `drive a real send through a live quest and read the session JSONL, case ${String(index)}`
      : null,
  markedBy: index % MARKED_EVERY === 0 ? 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479' : null,
  markedAt: index % MARKED_EVERY === 0 ? '2026-01-01T00:00:00.000Z' : null,
}));

const BRANCH_UNITS = Array.from({ length: BRANCH_COUNT }, (_value, index) => ({
  unitId: `send-flow:branch:copy-failed-${String(index)}`,
  kind: 'branch',
  text: `compose —"copy failed ${String(index)}"→ forward-unchanged`,
  surface: qaCheckSurfaceStatics.byKind.branch,
  nodeId: null,
  edgeId: `copy-failed-${String(index)}`,
  observableType: null,
  verifyByReading: false,
  mark: null,
  evidence: null,
  toSettle: null,
  markedBy: null,
  markedAt: null,
}));

const IN_SCOPE_UNITS = [...OBSERVABLE_UNITS, ...BRANCH_UNITS];

const WALK_PATHS = Array.from({ length: BRANCH_COUNT }, (_value, index) => ({
  nodeIds: Array.from({ length: NODE_COUNT }, (_node, nodeIndex) => `node-${String(nodeIndex)}`),
  branchLabels: [`copy failed ${String(index)}`],
  exitsFlow: false,
}));

// A WORKER on that flow: the whole in-scope set as its denominator, one piece's slice as its
// assignment, and its flow rendered at the ceiling `questFlowSliceLimitsStatics` allows it.
const WORST_CASE_VIEW = QuestWorkViewStub({
  assignedUnits: OBSERVABLE_UNITS.slice(0, ASSIGNED_SLICE) as never,
  inScopeUnits: IN_SCOPE_UNITS as never,
  walkPaths: WALK_PATHS as never,
  flows: [
    {
      flowId: 'send-flow',
      rendered: 'x'.repeat(questFlowSliceLimitsStatics.maxRenderChars),
    },
  ] as never,
});

// An ordinary quest — a handful of units — whose ONLY oversize is its rendered flow.
const ORDINARY_OVER_BUDGET_VIEW = QuestWorkViewStub({
  assignedUnits: OBSERVABLE_UNITS.slice(0, ASSIGNED_SLICE) as never,
  inScopeUnits: OBSERVABLE_UNITS.slice(0, ASSIGNED_SLICE) as never,
  walkPaths: [],
  flows: [
    {
      flowId: 'send-flow',
      rendered: 'x'.repeat(questFlowSliceLimitsStatics.maxRenderChars),
    },
  ] as never,
});

describe('questWorkTruncateTransformer', () => {
  describe('a return that already fits', () => {
    it('VALID: {a small scope with no flow render} => comes back untouched with an empty truncated[]', () => {
      const view = QuestWorkViewStub({
        assignedUnits: OBSERVABLE_UNITS.slice(0, ASSIGNED_SLICE) as never,
        inScopeUnits: OBSERVABLE_UNITS.slice(0, ASSIGNED_SLICE) as never,
        walkPaths: WALK_PATHS as never,
        flows: [],
      });

      const result = questWorkTruncateTransformer({ view });

      expect({
        truncated: result.truncated,
        walkPathCount: result.walkPaths.length,
      }).toStrictEqual({ truncated: [], walkPathCount: BRANCH_COUNT });
    });
  });

  describe('an ordinary quest whose flow render is the only oversize', () => {
    it('VALID: {one full flow render} => flows is cut and nothing else, with the exact dropped count', () => {
      const result = questWorkTruncateTransformer({ view: ORDINARY_OVER_BUDGET_VIEW });

      expect({ truncated: result.truncated, flows: result.flows }).toStrictEqual({
        truncated: [{ section: 'flows', dropped: 1 }],
        flows: [],
      });
    });

    it('VALID: {after the cut} => the serialized string clears the ceiling', () => {
      const result = questWorkTruncateTransformer({ view: ORDINARY_OVER_BUDGET_VIEW });

      expect(
        JSON.stringify(result, null, questWorkLimitsStatics.budget.indentSpaces).length,
      ).toBeLessThanOrEqual(questWorkLimitsStatics.budget.maxSerializedChars);
    });
  });

  describe('the measured worst case — 18 nodes, 19 edges, 47 observables', () => {
    it('VALID: {before truncation} => it is OVER the ceiling, which is why this transformer exists', () => {
      expect(
        JSON.stringify(WORST_CASE_VIEW, null, questWorkLimitsStatics.budget.indentSpaces).length,
      ).toBeGreaterThan(questWorkLimitsStatics.budget.maxSerializedChars);
    });

    it('VALID: {after truncation} => the SERVED string is under 50,000 characters', () => {
      const result = questWorkTruncateTransformer({ view: WORST_CASE_VIEW });

      expect(
        JSON.stringify(result, null, questWorkLimitsStatics.budget.indentSpaces).length,
      ).toBeLessThanOrEqual(questWorkLimitsStatics.budget.maxSerializedChars);
    });

    it('VALID: {after truncation} => flows goes first and walkPaths second, each with its exact count', () => {
      const result = questWorkTruncateTransformer({ view: WORST_CASE_VIEW });

      expect(result.truncated).toStrictEqual([
        { section: 'flows', dropped: 1 },
        { section: 'walkPaths', dropped: BRANCH_COUNT },
      ]);
    });

    it('VALID: {after truncation} => the gate’s denominator is untouched and pathsTruncated is raised', () => {
      const result = questWorkTruncateTransformer({ view: WORST_CASE_VIEW });

      expect({
        assignedUnits: result.assignedUnits.length,
        inScopeUnits: result.inScopeUnits.length,
        pathsTruncated: result.pathsTruncated,
      }).toStrictEqual({
        assignedUnits: ASSIGNED_SLICE,
        inScopeUnits: OBSERVABLE_COUNT + BRANCH_COUNT,
        pathsTruncated: true,
      });
    });
  });

  describe('the cut order', () => {
    it('VALID: {flows already empty and still over budget} => the next cut is committedPaths, named exactly', () => {
      const view = QuestWorkViewStub({
        flows: [],
        committedPaths: Array.from({ length: 3 }, (_value, index) => ({
          sha: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b${String(index)}`,
          scope: null,
          subject: 'x'.repeat(questFlowSliceLimitsStatics.maxRenderChars),
          paths: [],
        })) as never,
      });

      const result = questWorkTruncateTransformer({ view });

      expect(result.truncated).toStrictEqual([{ section: 'committedPaths', dropped: 3 }]);
    });

    it('VALID: {only sessionNotes can be cut} => it is named with its exact count', () => {
      const view = QuestWorkViewStub({
        flows: [],
        committedPaths: [],
        walkPaths: [],
        sessionNotes: Array.from({ length: 2 }, (_value, index) => ({
          id: `open-question-${String(index)}`,
          kind: 'open-question',
          role: 'siegemaster',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          summary: 'a question',
          detail: 'x'.repeat(questFlowSliceLimitsStatics.maxRenderChars),
          at: '2026-01-01T00:00:00.000Z',
        })) as never,
      });

      const result = questWorkTruncateTransformer({ view });

      expect(result.truncated).toStrictEqual([{ section: 'sessionNotes', dropped: 2 }]);
    });

    it('VALID: {only walkPaths can be cut} => pathsTruncated is raised alongside the entry', () => {
      const view = QuestWorkViewStub({
        flows: [],
        committedPaths: [],
        sessionNotes: [],
        pathsTruncated: false,
        walkPaths: Array.from({ length: 2 }, (_value, index) => ({
          nodeIds: [`node-${String(index)}`],
          branchLabels: ['x'.repeat(questFlowSliceLimitsStatics.maxRenderChars)],
          exitsFlow: false,
        })) as never,
      });

      const result = questWorkTruncateTransformer({ view });

      expect({
        truncated: result.truncated,
        pathsTruncated: result.pathsTruncated,
      }).toStrictEqual({
        truncated: [{ section: 'walkPaths', dropped: 2 }],
        pathsTruncated: true,
      });
    });
  });
});

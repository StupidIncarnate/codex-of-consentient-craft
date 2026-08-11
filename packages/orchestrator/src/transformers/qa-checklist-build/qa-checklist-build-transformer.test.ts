import { FlowStub, QuestQaLedgerEntryStub } from '@dungeonmaster/shared/contracts';
import { qaCheckSurfaceStatics, qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { qaChecklistBuildTransformer } from './qa-checklist-build-transformer';

describe('qaChecklistBuildTransformer', () => {
  describe('observable units', () => {
    it('VALID: {node with two observables} => one unit each, with the description carried VERBATIM', () => {
      const flow = FlowStub({
        id: 'view-persisted-comments',
        name: 'View Persisted Comments',
        nodes: [
          {
            id: 'render-comment-badge',
            label: 'Box renders badge',
            type: 'action',
            packages: ['auth-service'],
            observables: [
              {
                id: 'check-badge-count-text',
                type: 'ui-state',
                package: 'auth-service',
                description: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
              },
              {
                id: 'check-observable-badge',
                type: 'ui-state',
                package: 'auth-service',
                description:
                  'a FLOW_OBSERVABLE_NODE carrying one comment renders a badge reading 1',
              },
            ],
          },
        ],
        edges: [],
      });

      expect(
        qaChecklistBuildTransformer({ flow }).items.filter((item) => item.kind === 'observable'),
      ).toStrictEqual([
        {
          id: 'view-persisted-comments:observable:check-badge-count-text',
          flowId: 'view-persisted-comments',
          kind: 'observable',
          nodeId: 'render-comment-badge',
          observableId: 'check-badge-count-text',
          observableType: 'ui-state',
          label: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
          checkSurface: qaCheckSurfaceStatics.byOutcomeType['ui-state'],
        },
        {
          id: 'view-persisted-comments:observable:check-observable-badge',
          flowId: 'view-persisted-comments',
          kind: 'observable',
          nodeId: 'render-comment-badge',
          observableId: 'check-observable-badge',
          observableType: 'ui-state',
          label: 'a FLOW_OBSERVABLE_NODE carrying one comment renders a badge reading 1',
          checkSurface: qaCheckSurfaceStatics.byOutcomeType['ui-state'],
        },
      ]);
    });

    it('VALID: {custom observable} => carries the behavioural-invariant surface, not an I/O channel', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          {
            id: 'a-node',
            label: 'A node',
            type: 'state',
            packages: ['auth-service'],
            observables: [
              {
                id: 'check-invariant',
                type: 'custom',
                package: 'auth-service',
                description: 'the count and order held',
              },
            ],
          },
        ],
        edges: [],
      });

      expect(
        qaChecklistBuildTransformer({ flow }).items.find((item) => item.kind === 'observable')
          ?.checkSurface,
      ).toBe(qaCheckSurfaceStatics.byOutcomeType.custom);
    });

    it('EMPTY: {observable with a blank description} => still emits a unit, flagged as a spec hole rather than dropped', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          {
            id: 'a-node',
            label: 'A node',
            type: 'state',
            packages: ['auth-service'],
            observables: [
              { id: 'check-nothing', type: 'ui-state', package: 'auth-service', description: '' },
            ],
          },
        ],
        edges: [],
      });

      expect(
        qaChecklistBuildTransformer({ flow }).items.find((item) => item.kind === 'observable')
          ?.label,
      ).toBe(
        "(observable check-nothing on node a-node carries no description — a spec hole. Walk the behaviour the node's own text implies, and report the hole.)",
      );
    });
  });

  describe('terminal units', () => {
    it('VALID: {nodes with and without outgoing edges} => only the edgeless ones are terminals', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          {
            id: 'start-here',
            label: 'Start',
            type: 'action',
            packages: ['auth-service'],
            observables: [],
          },
          {
            id: 'end-here',
            label: 'The end state',
            type: 'state',
            packages: ['auth-service'],
            observables: [],
          },
        ],
        edges: [{ id: 'start-to-end', from: 'start-here', to: 'end-here' }],
      });

      expect(
        qaChecklistBuildTransformer({ flow }).items.filter((item) => item.kind === 'terminal'),
      ).toStrictEqual([
        {
          id: 'a-flow:terminal:end-here',
          flowId: 'a-flow',
          kind: 'terminal',
          nodeId: 'end-here',
          label: 'The end state',
          checkSurface: qaCheckSurfaceStatics.byKind.terminal,
        },
      ]);
    });
  });

  describe('branch units', () => {
    it('VALID: {labelled and unlabelled edges} => only labelled edges become branch units', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          {
            id: 'decide-here',
            label: 'Valid?',
            type: 'decision',
            packages: ['auth-service'],
            observables: [],
          },
          {
            id: 'yes-end',
            label: 'Yes',
            type: 'state',
            packages: ['auth-service'],
            observables: [],
          },
          { id: 'no-end', label: 'No', type: 'state', packages: ['auth-service'], observables: [] },
        ],
        edges: [
          { id: 'decide-yes', from: 'decide-here', to: 'yes-end', label: 'valid' },
          { id: 'decide-plain', from: 'decide-here', to: 'no-end' },
        ],
      });

      expect(
        qaChecklistBuildTransformer({ flow }).items.filter((item) => item.kind === 'branch'),
      ).toStrictEqual([
        {
          id: 'a-flow:branch:decide-yes',
          flowId: 'a-flow',
          kind: 'branch',
          edgeId: 'decide-yes',
          label: 'decide-here —"valid"→ yes-end',
          checkSurface: qaCheckSurfaceStatics.byKind.branch,
        },
      ]);
    });
  });

  describe('off-map units', () => {
    it('VALID: {any flow} => emits all seven probe families unconditionally', () => {
      const flow = FlowStub({ id: 'a-flow', nodes: [], edges: [] });

      expect(
        qaChecklistBuildTransformer({ flow })
          .items.filter((item) => item.kind === 'off-map')
          .map((item) => item.offMapFamily),
      ).toStrictEqual([
        're-entry',
        'concurrency',
        'interruption',
        'staleness',
        'configuration',
        'hostile-input',
        'perf',
      ]);
    });

    it('VALID: {off-map unit} => carries the concrete probe text, not the family name', () => {
      const flow = FlowStub({ id: 'a-flow', nodes: [], edges: [] });

      expect(
        qaChecklistBuildTransformer({ flow }).items.find(
          (item) => item.offMapFamily === 'concurrency',
        )?.label,
      ).toBe(qaOffMapProbeStatics.byFamily.concurrency);
    });
  });

  describe('coverage against the ledger', () => {
    it('VALID: {empty ledger} => every unit is remaining', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          {
            id: 'a-node',
            label: 'A node',
            type: 'state',
            packages: ['auth-service'],
            observables: [],
          },
        ],
        edges: [],
      });
      const result = qaChecklistBuildTransformer({ flow });

      expect(result.remainingItemIds).toStrictEqual(result.items.map((item) => item.id));
    });

    it('VALID: {ledger covering one unit} => that unit drops out of remaining', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          {
            id: 'a-node',
            label: 'A node',
            type: 'state',
            packages: ['auth-service'],
            observables: [],
          },
        ],
        edges: [],
      });

      expect(
        qaChecklistBuildTransformer({
          flow,
          ledger: [QuestQaLedgerEntryStub({ itemId: 'a-flow:terminal:a-node' })],
        }).remainingItemIds,
      ).toStrictEqual([
        'a-flow:off-map:re-entry',
        'a-flow:off-map:concurrency',
        'a-flow:off-map:interruption',
        'a-flow:off-map:staleness',
        'a-flow:off-map:configuration',
        'a-flow:off-map:hostile-input',
        'a-flow:off-map:perf',
      ]);
    });

    it('VALID: {ledger entry for a different flow} => clears nothing here, because ids embed their own flow', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          {
            id: 'a-node',
            label: 'A node',
            type: 'state',
            packages: ['auth-service'],
            observables: [],
          },
        ],
        edges: [],
      });

      expect(
        qaChecklistBuildTransformer({
          flow,
          ledger: [QuestQaLedgerEntryStub({ itemId: 'other-flow:terminal:a-node' })],
        }).remainingItemIds,
      ).toStrictEqual([
        'a-flow:terminal:a-node',
        'a-flow:off-map:re-entry',
        'a-flow:off-map:concurrency',
        'a-flow:off-map:interruption',
        'a-flow:off-map:staleness',
        'a-flow:off-map:configuration',
        'a-flow:off-map:hostile-input',
        'a-flow:off-map:perf',
      ]);
    });

    it('VALID: {ledger covering every unit} => remaining is empty, the only gate-clearing state', () => {
      const flow = FlowStub({ id: 'a-flow', nodes: [], edges: [] });
      const allIds = qaChecklistBuildTransformer({ flow }).items.map((item) => item.id);

      expect(
        qaChecklistBuildTransformer({
          flow,
          ledger: allIds.map((itemId) => QuestQaLedgerEntryStub({ itemId })),
        }).remainingItemIds,
      ).toStrictEqual([]);
    });
  });

  describe('determinism', () => {
    it('VALID: {same flow enumerated twice} => produces identical unit ids', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          {
            id: 'a-node',
            label: 'A node',
            type: 'state',
            packages: ['auth-service'],
            observables: [
              {
                id: 'check-thing',
                type: 'db-query',
                package: 'auth-service',
                description: 'a row exists',
              },
            ],
          },
        ],
        edges: [],
      });

      expect(qaChecklistBuildTransformer({ flow }).items.map((item) => item.id)).toStrictEqual(
        qaChecklistBuildTransformer({ flow }).items.map((item) => item.id),
      );
    });
  });

  describe('flow-level fields', () => {
    it('VALID: {flow metadata} => is carried onto the checklist', () => {
      const flow = FlowStub({
        id: 'a-flow',
        name: 'A Flow Name',
        entryPoint: '/some/entry',
        nodes: [],
        edges: [],
      });
      const result = qaChecklistBuildTransformer({ flow });

      expect({
        flowId: result.flowId,
        flowName: result.flowName,
        entryPoint: result.entryPoint,
        pathsTruncated: result.pathsTruncated,
      }).toStrictEqual({
        flowId: 'a-flow',
        flowName: 'A Flow Name',
        entryPoint: '/some/entry',
        pathsTruncated: false,
      });
    });

    it('VALID: {branching flow} => paths are enumerated alongside the units', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          {
            id: 'decide-here',
            label: 'Valid?',
            type: 'decision',
            packages: ['auth-service'],
            observables: [],
          },
          {
            id: 'yes-end',
            label: 'Yes',
            type: 'state',
            packages: ['auth-service'],
            observables: [],
          },
          { id: 'no-end', label: 'No', type: 'state', packages: ['auth-service'], observables: [] },
        ],
        edges: [
          { id: 'decide-yes', from: 'decide-here', to: 'yes-end', label: 'valid' },
          { id: 'decide-no', from: 'decide-here', to: 'no-end', label: 'invalid' },
        ],
      });

      expect(qaChecklistBuildTransformer({ flow }).paths).toStrictEqual([
        { nodeIds: ['decide-here', 'yes-end'], branchLabels: ['valid'], exitsFlow: false },
        { nodeIds: ['decide-here', 'no-end'], branchLabels: ['invalid'], exitsFlow: false },
      ]);
    });
  });

  describe('empty flows', () => {
    it('EMPTY: {no nodes or edges} => emits only the seven off-map families', () => {
      expect(
        qaChecklistBuildTransformer({
          flow: FlowStub({ id: 'a-flow', nodes: [], edges: [] }),
        }).items.map((item) => item.id),
      ).toStrictEqual([
        'a-flow:off-map:re-entry',
        'a-flow:off-map:concurrency',
        'a-flow:off-map:interruption',
        'a-flow:off-map:staleness',
        'a-flow:off-map:configuration',
        'a-flow:off-map:hostile-input',
        'a-flow:off-map:perf',
      ]);
    });
  });
});

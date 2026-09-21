import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestPackageEntryStub,
  QuestStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { WorkPlanBatchStub } from '../../contracts/work-plan-batch/work-plan-batch.stub';
import { WorkPlanCodeweaverUnitStub } from '../../contracts/work-plan-codeweaver-unit/work-plan-codeweaver-unit.stub';
import { WorkPlanFileEntryStub } from '../../contracts/work-plan-file-entry/work-plan-file-entry.stub';
import { WorkPlanFlowriderUnitStub } from '../../contracts/work-plan-flowrider-unit/work-plan-flowrider-unit.stub';
import { WorkPlanPayloadCodeweaverStub } from '../../contracts/work-plan-payload-codeweaver/work-plan-payload-codeweaver.stub';
import { WorkPlanPayloadFlowriderStub } from '../../contracts/work-plan-payload-flowrider/work-plan-payload-flowrider.stub';
import { WorkPlanPayloadSiegemasterStub } from '../../contracts/work-plan-payload-siegemaster/work-plan-payload-siegemaster.stub';
import { WorkPlanPieceStub } from '../../contracts/work-plan-piece/work-plan-piece.stub';
import { WorkPlanStub } from '../../contracts/work-plan/work-plan.stub';

import { workPlanValidateTransformer } from './work-plan-validate-transformer';

// One flow, `send-flow`, shared by every test below: a terminal (`batch-sent`), a labelled branch
// into it (`render-to-sent`), an observable on the node before it (`check-badge-count-text`), and
// the seven off-map families every flow carries unconditionally. Every real unit id used across
// this file is one qaUnitEnumerateTransformer would mint from exactly this graph.
const sendFlow = FlowStub({
  id: 'send-flow',
  nodes: [
    FlowNodeStub({
      id: 'render-badge',
      label: 'Render badge',
      packages: ['@dungeonmaster/web'],
      observables: [
        FlowObservableStub({
          id: 'check-badge-count-text',
          type: 'ui-state',
          description: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
          package: '@dungeonmaster/web',
        }),
      ],
    }),
    FlowNodeStub({ id: 'batch-sent', label: 'Batch sent', packages: ['@dungeonmaster/web'] }),
  ],
  edges: [
    FlowEdgeStub({ id: 'render-to-sent', from: 'render-badge', to: 'batch-sent', label: 'sent' }),
  ],
});

const packagesAffected = [
  QuestPackageEntryStub({
    name: '@dungeonmaster/web',
    location: './packages/web',
    packageType: 'frontend-react',
  }),
];

const codeweaverOperationItem = OperationItemStub({
  role: 'codeweaver',
  flowIds: ['send-flow'],
  packageNames: ['@dungeonmaster/web'],
});
const flowriderOperationItem = OperationItemStub({
  role: 'flowrider',
  flowIds: ['send-flow'],
  packageNames: ['@dungeonmaster/web'],
});
const siegemasterOperationItem = OperationItemStub({
  role: 'siegemaster',
  flowIds: ['send-flow'],
  packageNames: ['@dungeonmaster/web'],
});

const codeweaverQuest = QuestStub({
  flows: [sendFlow],
  packagesAffected,
  operations: [codeweaverOperationItem],
});
const flowriderQuest = QuestStub({
  flows: [sendFlow],
  packagesAffected,
  operations: [flowriderOperationItem],
});
const siegemasterQuest = QuestStub({
  flows: [sendFlow],
  packagesAffected,
  operations: [siegemasterOperationItem],
});

// Every operation item above keeps OperationItemStub's default id, so ONE work item, pointing at
// that same id, submits against all three.
const workItem = WorkItemStub({
  relatedDataItems: ['operations/a1b2c3d4-58cc-4372-a567-0e02b2c3d479'],
});

// A SECOND flow, for check 5 alone: operationSignoffScopeTransformer + qaChecklistBuildTransformer's
// `.items` (the derivation check 5's own story section hands over) narrow by FLOW membership, via
// operationItem.flowIds — not by which package a unit's owning node tags. A unit real on a flow
// this operation item does not declare is the shape that derivation actually refuses.
const otherFlow = FlowStub({
  id: 'other-flow',
  nodes: [
    FlowNodeStub({
      id: 'other-flow-node',
      label: 'Other flow node',
      packages: ['@dungeonmaster/web'],
      observables: [
        FlowObservableStub({
          id: 'other-thing',
          type: 'ui-state',
          description: 'a thing that only lives on the other flow',
          package: '@dungeonmaster/web',
        }),
      ],
    }),
  ],
  edges: [],
});
const questWithOtherFlow = QuestStub({
  flows: [sendFlow, otherFlow],
  packagesAffected,
  operations: [codeweaverOperationItem],
});

describe('workPlanValidateTransformer', () => {
  describe('valid plans', () => {
    it('VALID: {codeweaver plan matching scope} => returns no failures', () => {
      const result = workPlanValidateTransformer({
        quest: codeweaverQuest,
        workItem,
        plan: WorkPlanStub(),
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {flowrider plan matching scope} => returns no failures', () => {
      const plan = WorkPlanStub({
        family: 'flowrider',
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({
                assignedUnitIds: ['send-flow:terminal:batch-sent'],
                payload: WorkPlanPayloadFlowriderStub(),
              }),
            ],
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: flowriderQuest, workItem, plan });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {siegemaster plan matching scope} => returns no failures', () => {
      const plan = WorkPlanStub({
        family: 'siegemaster',
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({
                step: 'happyWalk',
                assignedUnitIds: ['send-flow:off-map:hostile-input'],
                payload: WorkPlanPayloadSiegemasterStub(),
              }),
            ],
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: siegemasterQuest, workItem, plan });

      expect(result).toStrictEqual([]);
    });
  });

  describe('check 1 — operationItemId matches the submitting work item', () => {
    it('INVALID: {plan.operationItemId does not match the work item’s own ref} => refuses every piece with check 1', () => {
      const mismatchedWorkItem = WorkItemStub({
        relatedDataItems: ['operations/9e75438c-58cc-4372-a567-0e02b2c3d479'],
      });

      const result = workPlanValidateTransformer({
        quest: codeweaverQuest,
        workItem: mismatchedWorkItem,
        plan: WorkPlanStub(),
      });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 1,
          message:
            "operationItemId 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' does not match this work item's own operation item '9e75438c-58cc-4372-a567-0e02b2c3d479'",
        },
      ]);
    });
  });

  describe('check 2 — every piece.id is unique within the file', () => {
    it('INVALID: {two pieces share one id} => refuses both occurrences with check 2', () => {
      const pieceA = WorkPlanPieceStub({
        id: 'pc-scan',
        assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
        payload: WorkPlanPayloadCodeweaverStub({
          files: [WorkPlanFileEntryStub({ path: './packages/web/src/a.tsx' })],
          units: [
            WorkPlanCodeweaverUnitStub({ unitId: 'send-flow:observable:check-badge-count-text' }),
          ],
        }),
      });
      const pieceB = WorkPlanPieceStub({
        id: 'pc-scan',
        assignedUnitIds: ['send-flow:terminal:batch-sent'],
        payload: WorkPlanPayloadCodeweaverStub({
          files: [WorkPlanFileEntryStub({ path: './packages/web/src/b.tsx' })],
          units: [
            WorkPlanCodeweaverUnitStub({
              unitId: 'send-flow:terminal:batch-sent',
              kind: 'terminal',
            }),
          ],
        }),
      });
      const plan = WorkPlanStub({ batches: [WorkPlanBatchStub({ pieces: [pieceA, pieceB] })] });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-scan',
          check: 2,
          message:
            "piece id 'pc-scan' is used by two pieces in this plan — piece ids must be unique within the file",
        },
        {
          pieceId: 'pc-scan',
          check: 2,
          message:
            "piece id 'pc-scan' is used by two pieces in this plan — piece ids must be unique within the file",
        },
      ]);
    });
  });

  describe('check 3 — every piece.step exists in the family step graph', () => {
    it('INVALID: {piece.step names a step codeweaver does not have} => refuses with check 3', () => {
      const plan = WorkPlanStub({
        batches: [WorkPlanBatchStub({ pieces: [WorkPlanPieceStub({ step: 'nonexistent-step' })] })],
      });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 3,
          message: "pc-badge: step 'nonexistent-step' does not exist in the codeweaver step graph",
        },
      ]);
    });
  });

  describe('check 4 — assignedUnitIds and contextUnitIds resolve to a real unit on the quest', () => {
    it('INVALID: {contextUnitIds names an id off no flow} => refuses with check 4', () => {
      const plan = WorkPlanStub({
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({ contextUnitIds: ['send-flow:observable:does-not-exist'] }),
            ],
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 4,
          message:
            "pc-badge: contextUnitIds names 'send-flow:observable:does-not-exist', which is not a unit on flow 'send-flow'",
        },
      ]);
    });
  });

  describe('check 5 — every ASSIGNED unit is in scope; a CONTEXT unit is exempt', () => {
    it('INVALID: {assigned unit is real but sits on a flow this operation item does not declare} => refuses with check 5', () => {
      const plan = WorkPlanStub({
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({
                assignedUnitIds: ['other-flow:observable:other-thing'],
                payload: WorkPlanPayloadCodeweaverStub({
                  units: [
                    WorkPlanCodeweaverUnitStub({ unitId: 'other-flow:observable:other-thing' }),
                  ],
                }),
              }),
            ],
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: questWithOtherFlow, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 5,
          message:
            "pc-badge: assigned unit 'other-flow:observable:other-thing' is not in scope for operation item 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479'",
        },
      ]);
    });

    it('VALID: {the same unit named as CONTEXT instead of assigned} => is allowed, never checked against scope', () => {
      const plan = WorkPlanStub({
        batches: [
          WorkPlanBatchStub({
            pieces: [WorkPlanPieceStub({ contextUnitIds: ['other-flow:observable:other-thing'] })],
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: questWithOtherFlow, workItem, plan });

      expect(result).toStrictEqual([]);
    });

    it("INVALID: {assigned unit sits on the plan's own flow but a sibling package's node} => refuses with check 5", () => {
      // Both nodes tagged, one per package — an UNTAGGED node's units stay in scope for every cell
      // (qa-units-in-package-scope-transformer.ts:87), so a fixture leaving one bare would pass
      // without ever exercising the package filter this test targets.
      const cellFlow = FlowStub({
        id: 'cell-flow',
        nodes: [
          FlowNodeStub({
            id: 'web-cell-node',
            label: 'Web cell node',
            packages: ['@dungeonmaster/web'],
            observables: [
              FlowObservableStub({
                id: 'web-cell-thing',
                type: 'ui-state',
                description: 'a thing the web cell owns',
                package: '@dungeonmaster/web',
              }),
            ],
          }),
          FlowNodeStub({
            id: 'server-cell-node',
            label: 'Server cell node',
            packages: ['@dungeonmaster/server'],
            observables: [
              FlowObservableStub({
                id: 'server-cell-thing',
                type: 'api-call',
                description: 'a thing the server cell owns',
                package: '@dungeonmaster/server',
              }),
            ],
          }),
        ],
        edges: [],
      });
      const serverCellOperationItem = OperationItemStub({
        role: 'codeweaver',
        flowIds: ['cell-flow'],
        packageNames: ['@dungeonmaster/server'],
      });
      const quest = QuestStub({
        flows: [cellFlow],
        packagesAffected: [
          ...packagesAffected,
          QuestPackageEntryStub({
            name: '@dungeonmaster/server',
            location: './packages/server',
            packageType: 'http-backend',
          }),
        ],
        operations: [serverCellOperationItem],
      });
      const plan = WorkPlanStub({
        flowId: 'cell-flow',
        packageNames: ['@dungeonmaster/server'],
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({
                assignedUnitIds: ['cell-flow:observable:web-cell-thing'],
                contextUnitIds: [],
                payload: WorkPlanPayloadCodeweaverStub({
                  files: [WorkPlanFileEntryStub({ path: './packages/server/src/thing.ts' })],
                  units: [
                    WorkPlanCodeweaverUnitStub({ unitId: 'cell-flow:observable:web-cell-thing' }),
                  ],
                }),
              }),
            ],
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 5,
          message:
            "pc-badge: assigned unit 'cell-flow:observable:web-cell-thing' is not in scope for operation item 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479'",
        },
      ]);
    });
  });

  describe('check 6 — no unit is claimed by two pieces in the same batch', () => {
    it('INVALID: {two pieces in one batch assign the same unit} => refuses both with check 6', () => {
      const pieceA = WorkPlanPieceStub({
        id: 'pc-a',
        assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
        payload: WorkPlanPayloadCodeweaverStub({
          files: [WorkPlanFileEntryStub({ path: './packages/web/src/a.tsx' })],
          units: [
            WorkPlanCodeweaverUnitStub({ unitId: 'send-flow:observable:check-badge-count-text' }),
          ],
        }),
      });
      const pieceB = WorkPlanPieceStub({
        id: 'pc-b',
        assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
        payload: WorkPlanPayloadCodeweaverStub({
          files: [WorkPlanFileEntryStub({ path: './packages/web/src/b.tsx' })],
          units: [
            WorkPlanCodeweaverUnitStub({ unitId: 'send-flow:observable:check-badge-count-text' }),
          ],
        }),
      });
      const plan = WorkPlanStub({ batches: [WorkPlanBatchStub({ pieces: [pieceA, pieceB] })] });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-a',
          check: 6,
          message:
            "pc-a and pc-b both claim unit 'send-flow:observable:check-badge-count-text' in the same batch",
        },
        {
          pieceId: 'pc-b',
          check: 6,
          message:
            "pc-a and pc-b both claim unit 'send-flow:observable:check-badge-count-text' in the same batch",
        },
      ]);
    });
  });

  describe('check 7 — the plan’s flowId resolves in quest.flows[]', () => {
    it('INVALID: {flowId names a flow the quest does not have} => refuses every piece with check 7', () => {
      const plan = WorkPlanStub({ flowId: 'does-not-exist-flow' });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 7,
          message: "flowId 'does-not-exist-flow' does not resolve in quest.flows[]",
        },
      ]);
    });
  });

  describe('check 8 — every packageName resolves in quest.packagesAffected[]', () => {
    it('INVALID: {packageNames names a package the quest never declared} => refuses every piece with check 8', () => {
      const plan = WorkPlanStub({ packageNames: ['@dungeonmaster/web', '@dungeonmaster/ghost'] });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 8,
          message:
            "packageName '@dungeonmaster/ghost' does not resolve in quest.packagesAffected[]",
        },
      ]);
    });
  });

  describe('check 9 — codeweaver payload.files[].path sits under a package this scope owns', () => {
    it('INVALID: {a file path sits under a package this operation item does not own} => refuses with check 9', () => {
      const plan = WorkPlanStub({
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({
                payload: WorkPlanPayloadCodeweaverStub({
                  files: [WorkPlanFileEntryStub({ path: './packages/server/src/rogue-file.ts' })],
                }),
              }),
            ],
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 9,
          message:
            "pc-badge: payload.files[].path './packages/server/src/rogue-file.ts' is outside the packages this operation item owns (@dungeonmaster/web)",
        },
      ]);
    });

    it('VALID: {a siegemaster piece, carrying no units[] or files[] key at all} => is accepted', () => {
      const plan = WorkPlanStub({
        family: 'siegemaster',
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({
                step: 'happyWalk',
                assignedUnitIds: ['send-flow:off-map:hostile-input'],
                payload: WorkPlanPayloadSiegemasterStub(),
              }),
            ],
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: siegemasterQuest, workItem, plan });

      expect(result).toStrictEqual([]);
    });
  });

  describe('check 10 — no two pieces in one batch name the same file path', () => {
    it('INVALID: {two pieces in one batch write the same file} => refuses both with check 10', () => {
      const pieceA = WorkPlanPieceStub({
        id: 'pc-a',
        assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
        payload: WorkPlanPayloadCodeweaverStub({
          files: [WorkPlanFileEntryStub({ path: './packages/web/src/shared-file.tsx' })],
          units: [
            WorkPlanCodeweaverUnitStub({ unitId: 'send-flow:observable:check-badge-count-text' }),
          ],
        }),
      });
      const pieceB = WorkPlanPieceStub({
        id: 'pc-b',
        assignedUnitIds: ['send-flow:terminal:batch-sent'],
        payload: WorkPlanPayloadCodeweaverStub({
          files: [WorkPlanFileEntryStub({ path: './packages/web/src/shared-file.tsx' })],
          units: [
            WorkPlanCodeweaverUnitStub({
              unitId: 'send-flow:terminal:batch-sent',
              kind: 'terminal',
            }),
          ],
        }),
      });
      const plan = WorkPlanStub({ batches: [WorkPlanBatchStub({ pieces: [pieceA, pieceB] })] });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-a',
          check: 10,
          message:
            "pc-a and pc-b both name file path './packages/web/src/shared-file.tsx' in the same batch",
        },
        {
          pieceId: 'pc-b',
          check: 10,
          message:
            "pc-a and pc-b both name file path './packages/web/src/shared-file.tsx' in the same batch",
        },
      ]);
    });
  });

  describe('checks 11 and 17 (first half) — already refused by workPlanContract at parse time', () => {
    it('INVALID: {payload.units[] count mismatches assignedUnitIds} => the whole call throws before workPlanValidateTransformer’s own checks ever run', () => {
      expect(() => {
        const plan = WorkPlanStub({
          batches: [
            WorkPlanBatchStub({
              pieces: [
                WorkPlanPieceStub({
                  assignedUnitIds: [
                    'send-flow:observable:check-badge-count-text',
                    'send-flow:terminal:batch-sent',
                  ],
                  payload: WorkPlanPayloadCodeweaverStub({
                    units: [
                      WorkPlanCodeweaverUnitStub({
                        unitId: 'send-flow:observable:check-badge-count-text',
                      }),
                    ],
                  }),
                }),
              ],
            }),
          ],
        });

        workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });
      }).toThrow(/payload\.units\[\] holds 1 entries for 2 assignedUnitIds/u);
    });

    it("INVALID: {a plannerMarks entry claims a unit a piece also assigns} => the whole call throws, never reaching workPlanValidateTransformer's own checks", () => {
      expect(() => {
        const plan = WorkPlanStub({
          plannerMarks: [
            UnitObservationStub({
              unitId: 'send-flow:observable:check-badge-count-text',
              mark: 'cant-meet',
              toSettle: 'drive the flow by hand and read the result',
            }),
          ],
        });

        workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });
      }).toThrow(/is claimed by a piece in this same plan/u);
    });
  });

  describe('check 12 — observableTarget resolves to the node or edge that unit actually hangs on', () => {
    it('INVALID: {a terminal unit carries an edge target} => refuses with check 12', () => {
      const plan = WorkPlanStub({
        family: 'flowrider',
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({
                assignedUnitIds: ['send-flow:terminal:batch-sent'],
                payload: WorkPlanPayloadFlowriderStub({
                  units: [
                    WorkPlanFlowriderUnitStub({
                      unitId: 'send-flow:terminal:batch-sent',
                      observableTarget: { target: 'edge', edgeId: 'render-to-sent' },
                    }),
                  ],
                }),
              }),
            ],
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: flowriderQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 12,
          message:
            "pc-badge: observableTarget for unit 'send-flow:terminal:batch-sent' does not resolve to the node or edge that unit actually hangs on",
        },
      ]);
    });
  });

  describe('check 13 — a browser-layer piece count per batch is within the step’s maxConcurrent', () => {
    it('INVALID: {5 browser-layer pieces at one step, one batch} => refuses every one with check 13, over the limit of 4', () => {
      const families = ['re-entry', 'concurrency', 'interruption', 'staleness', 'configuration'];
      const pieces = families.map((family) =>
        WorkPlanPieceStub({
          id: `pc-${family}`,
          assignedUnitIds: [`send-flow:off-map:${family}`],
          payload: WorkPlanPayloadFlowriderStub({
            specPath: `./packages/web/src/flows/send/send-${family}.e2e.ts`,
            harnesses: [],
            units: [
              WorkPlanFlowriderUnitStub({ unitId: `send-flow:off-map:${family}`, kind: 'off-map' }),
            ],
          }),
        }),
      );
      const plan = WorkPlanStub({
        family: 'flowrider',
        batches: [WorkPlanBatchStub({ pieces })],
      });

      const result = workPlanValidateTransformer({ quest: flowriderQuest, workItem, plan });

      expect(result).toStrictEqual(
        families.map((family) => ({
          pieceId: `pc-${family}`,
          check: 13,
          message:
            "batch 1 names 5 browser-layer pieces at step 'work', over the maxConcurrent limit of 4",
        })),
      );
    });
  });

  describe('check 14 — every piece in one batch names the SAME step', () => {
    it('INVALID: {two pieces in one batch name different steps} => refuses both with check 14', () => {
      const pieceA = WorkPlanPieceStub({
        id: 'pc-a',
        step: 'work',
        assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
        payload: WorkPlanPayloadCodeweaverStub({
          files: [WorkPlanFileEntryStub({ path: './packages/web/src/a.tsx' })],
          units: [
            WorkPlanCodeweaverUnitStub({ unitId: 'send-flow:observable:check-badge-count-text' }),
          ],
        }),
      });
      const pieceB = WorkPlanPieceStub({
        id: 'pc-b',
        step: 'review',
        assignedUnitIds: ['send-flow:terminal:batch-sent'],
        payload: WorkPlanPayloadCodeweaverStub({
          files: [WorkPlanFileEntryStub({ path: './packages/web/src/b.tsx' })],
          units: [
            WorkPlanCodeweaverUnitStub({
              unitId: 'send-flow:terminal:batch-sent',
              kind: 'terminal',
            }),
          ],
        }),
      });
      const plan = WorkPlanStub({ batches: [WorkPlanBatchStub({ pieces: [pieceA, pieceB] })] });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-a',
          check: 14,
          message:
            "batch 1 mixes steps 'work' and 'review' — every piece in one batch must name the same step",
        },
        {
          pieceId: 'pc-b',
          check: 14,
          message:
            "batch 1 mixes steps 'work' and 'review' — every piece in one batch must name the same step",
        },
      ]);
    });
  });

  describe('check 15 — an adversarial piece’s baselineFor resolves to an EARLIER batch', () => {
    it('INVALID: {baselineFor names a piece in a LATER batch} => refuses with check 15', () => {
      const pieceWalk = WorkPlanPieceStub({
        id: 'pc-walk',
        step: 'happyWalk',
        assignedUnitIds: ['send-flow:off-map:re-entry'],
        payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: null }),
      });
      const pieceStress = WorkPlanPieceStub({
        id: 'pc-stress',
        step: 'adversarial',
        assignedUnitIds: ['send-flow:off-map:concurrency'],
        baselineFor: 'pc-walk',
        payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: null }),
      });
      const plan = WorkPlanStub({
        family: 'siegemaster',
        batches: [
          WorkPlanBatchStub({ pieces: [pieceStress] }),
          WorkPlanBatchStub({ pieces: [pieceWalk] }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: siegemasterQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-stress',
          check: 15,
          message:
            "pc-stress: baselineFor 'pc-walk' resolves to a piece in a LATER batch, not an earlier one",
        },
      ]);
    });
  });

  describe('check 16 — no offMapFamily is allocated to more than one piece', () => {
    it('INVALID: {two siegemaster pieces claim the same offMapFamily} => refuses both with check 16', () => {
      const pieceA = WorkPlanPieceStub({
        id: 'pc-a',
        step: 'happyWalk',
        assignedUnitIds: ['send-flow:off-map:hostile-input'],
        payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: 'hostile-input' }),
      });
      const pieceB = WorkPlanPieceStub({
        id: 'pc-b',
        step: 'happyWalk',
        assignedUnitIds: ['send-flow:terminal:batch-sent'],
        payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: 'hostile-input' }),
      });
      const plan = WorkPlanStub({
        family: 'siegemaster',
        batches: [WorkPlanBatchStub({ pieces: [pieceA, pieceB] })],
      });

      const result = workPlanValidateTransformer({ quest: siegemasterQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-a',
          check: 16,
          message:
            "offMapFamily 'hostile-input' is allocated to more than one piece in this plan (pc-a, pc-b)",
        },
        {
          pieceId: 'pc-b',
          check: 16,
          message:
            "offMapFamily 'hostile-input' is allocated to more than one piece in this plan (pc-b, pc-a)",
        },
      ]);
    });
  });

  describe('check 17 (second half) — a plannerMarks entry names a REAL unit on the quest', () => {
    it('INVALID: {plannerMarks names an id off no flow} => refuses every piece with check 17', () => {
      const plan = WorkPlanStub({
        plannerMarks: [
          UnitObservationStub({
            unitId: 'send-flow:observable:does-not-exist',
            mark: 'cant-meet',
            toSettle: 'drive the flow by hand and read the result',
          }),
        ],
      });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 17,
          message:
            "plannerMarks[0]: unit 'send-flow:observable:does-not-exist' is not a unit on this quest",
        },
      ]);
    });
  });

  describe('check 18 — a recipeId a piece names is recorded on the plan’s flow', () => {
    it('INVALID: {recipeId names a recipe flow.recipes[] does not have} => refuses with check 18', () => {
      const plan = WorkPlanStub({
        batches: [WorkPlanBatchStub({ pieces: [WorkPlanPieceStub({ recipeId: 'pc-walk-1' })] })],
      });

      const result = workPlanValidateTransformer({ quest: codeweaverQuest, workItem, plan });

      expect(result).toStrictEqual([
        {
          pieceId: 'pc-badge',
          check: 18,
          message: "pc-badge: recipeId 'pc-walk-1' is not recorded on flow 'send-flow'",
        },
      ]);
    });
  });
});

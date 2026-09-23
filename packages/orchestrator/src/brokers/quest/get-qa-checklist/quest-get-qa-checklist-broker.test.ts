import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestIdStub,
  QuestPackageEntryStub,
  QuestStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questGetQaChecklistBroker } from './quest-get-qa-checklist-broker';
import { questGetQaChecklistBrokerProxy } from './quest-get-qa-checklist-broker.proxy';

// A tagged quest: `ui-app` is a browser-reachable package kind (frontend-react) and `api-service` is
// not (http-backend). Every track now carries the full nine-member packageTypes list, so neither
// kind is excluded from any track's denominator — what narrows a checklist to one or the other is
// the operation item's own declared `packageNames`, never the track.
const UI_PACKAGE = 'ui-app';
const API_PACKAGE = 'api-service';

const TAGGED_PACKAGES = [
  QuestPackageEntryStub({
    name: UI_PACKAGE,
    location: `./packages/${UI_PACKAGE}`,
    changeType: 'edit',
    packageType: 'frontend-react',
  }),
  QuestPackageEntryStub({
    name: API_PACKAGE,
    location: `./packages/${API_PACKAGE}`,
    changeType: 'edit',
    packageType: 'http-backend',
  }),
];

// One runtime flow whose units split 3 backend / 2 frontend: terminal `n-done` and branch `e-ok`
// leave backend nodes, branch `e-submit` leaves the frontend one, and each node carries one
// observable. Nothing is signed, so every unit is outstanding on whichever denominator owns it.
const TAGGED_FLOW = FlowStub({
  id: 'checkout-flow',
  name: 'Checkout',
  flowType: 'runtime',
  nodes: [
    FlowNodeStub({
      id: 'n-ui',
      label: 'Cart',
      packages: [UI_PACKAGE],
      observables: [
        FlowObservableStub({
          id: 'obs-cart',
          type: 'ui-state',
          description: 'the cart lists every line item',
          package: UI_PACKAGE,
        }),
      ],
    }),
    FlowNodeStub({
      id: 'n-api',
      label: 'Charge',
      packages: [API_PACKAGE],
      observables: [
        FlowObservableStub({
          id: 'obs-charge',
          type: 'api-call',
          description: 'POST /api/charge returns 201',
          package: API_PACKAGE,
        }),
      ],
    }),
    FlowNodeStub({ id: 'n-done', label: 'Receipt', packages: [API_PACKAGE] }),
  ],
  edges: [
    FlowEdgeStub({ id: 'e-submit', from: 'n-ui', to: 'n-api', label: 'submit' }),
    FlowEdgeStub({ id: 'e-ok', from: 'n-api', to: 'n-done', label: 'ok' }),
  ],
});

const TAGGED_QUEST = QuestStub({ packagesAffected: TAGGED_PACKAGES, flows: [TAGGED_FLOW] });

const OP_ID = 'c1c1c1c1-1111-4222-9333-444444444444';

describe('questGetQaChecklistBroker', () => {
  describe('enumerating a quest', () => {
    it('VALID: {quest with two flows} => returns one checklist per flow, in quest order', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'first-flow', name: 'First Flow', nodes: [], edges: [] }),
          FlowStub({ id: 'second-flow', name: 'Second Flow', nodes: [], edges: [] }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result.checklists.map((checklist) => checklist.flowId)).toStrictEqual([
        'first-flow',
        'second-flow',
      ]);
    });

    it('VALID: {flowId given} => returns only that flow', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'first-flow', name: 'First Flow', nodes: [], edges: [] }),
          FlowStub({ id: 'second-flow', name: 'Second Flow', nodes: [], edges: [] }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        flowId: 'second-flow' as never,
      });

      expect(result.checklists.map((checklist) => checklist.flowId)).toStrictEqual(['second-flow']);
    });

    it('VALID: {unknown flowId} => returns an empty list rather than throwing', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [FlowStub({ id: 'first-flow', name: 'First Flow', nodes: [], edges: [] })],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        flowId: 'not-on-this-quest' as never,
      });

      expect(result.checklists).toStrictEqual([]);
    });

    it('EMPTY: {quest with no flows} => returns an empty list', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({ flows: [] });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result.checklists).toStrictEqual([]);
    });
  });

  describe('track scoping over a quest carrying both flow types', () => {
    it("VALID: {track: 'flowrider', no flowId} => returns the RUNTIME flows only, the set that track is measured over", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'flowrider',
        flowIds: ['walk-flow', 'rollout-flow', 'second-walk-flow'] as never,
      });
      const quest = QuestStub({
        operations: [scopeItem],
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
          }),
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [],
            edges: [],
          }),
          FlowStub({
            id: 'second-walk-flow',
            name: 'Second Walk Flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        operationItemId: OP_ID as never,
      });

      expect(result.checklists.map((checklist) => checklist.flowId)).toStrictEqual([
        'walk-flow',
        'second-walk-flow',
      ]);
    });

    it("VALID: {track: 'siegemaster', no flowId} => returns the RUNTIME flows only, narrowed the same as flowrider now that operational units moved to codeweaver's reviewer", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'siegemaster',
        flowIds: ['walk-flow', 'rollout-flow'] as never,
      });
      const quest = QuestStub({
        operations: [scopeItem],
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
          }),
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        operationItemId: OP_ID as never,
      });

      expect(result.checklists.map((checklist) => checklist.flowId)).toStrictEqual(['walk-flow']);
    });

    it('VALID: {no track} => returns every flow, unchanged by flow type', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
          }),
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result.checklists.map((checklist) => checklist.flowId)).toStrictEqual([
        'walk-flow',
        'rollout-flow',
      ]);
    });

    // A role with NO sign-off track resolves to no scope at all — `spiritmender` and `warpgate` are
    // measured on the scope block rendered into their Operation Context, not on the flow graph. It
    // is distinct from "this quest has no flows", and the responder says so in different words.
    it.each(['spiritmender', 'warpgate'] as const)(
      'EMPTY: {role: %s} => no checklists and no track, because that role has no denominator here',
      async (role) => {
        const proxy = questGetQaChecklistBrokerProxy();
        const scopeItem = OperationItemStub({ id: OP_ID as never, role });
        const quest = QuestStub({
          operations: [scopeItem],
          flows: [
            FlowStub({
              id: 'walk-flow',
              name: 'Walk Flow',
              flowType: 'runtime',
              nodes: [],
              edges: [],
            }),
          ],
        });
        proxy.setupQuestFound({ quest });

        const result = await questGetQaChecklistBroker({
          questId: QuestIdStub({ value: quest.id }),
          operationItemId: OP_ID as never,
        });

        expect(result).toStrictEqual({ checklists: [] });
      },
    );

    it("EMPTY: {track: 'flowrider', every flow operational} => returns an empty list, so 'nothing to walk' is a real answer", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'flowrider',
        flowIds: ['rollout-flow'] as never,
      });
      const quest = QuestStub({
        operations: [scopeItem],
        flows: [
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        operationItemId: OP_ID as never,
      });

      expect(result.checklists).toStrictEqual([]);
    });
  });

  // The number a session reads and the number its gate refuses on MUST be the same number. They are
  // computed by different call chains — this broker for the tool, `signoffOutstandingTransformer`
  // for signal-back — and a divergence is indistinguishable from a hallucinating gate.
  describe('the checklist number equals the completion gate number', () => {
    it('VALID: {a flowrider item scoped to browser-reachable packages} => the tool and the gate name the SAME units — every unit, unfiltered by packageNames', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      // ONE item, read by both surfaces. That is the whole claim now: the scope is not passed to
      // either of them, it is derived from this object by the transformer they share.
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'flowrider',
        status: 'in_progress',
        locked: true,
        flowIds: ['checkout-flow'] as never,
        packageNames: [UI_PACKAGE] as never,
      });
      const quest = QuestStub({ ...TAGGED_QUEST, operations: [scopeItem] });
      proxy.setupQuestFound({ quest });

      const { checklists } = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
        operationItemId: OP_ID as never,
      });

      expect(checklists[0]?.remainingItemIds).toStrictEqual([
        'checkout-flow:terminal:n-done',
        'checkout-flow:branch:e-submit',
        'checkout-flow:branch:e-ok',
        'checkout-flow:observable:obs-cart',
        'checkout-flow:observable:obs-charge',
        'checkout-flow:off-map:re-entry',
        'checkout-flow:off-map:concurrency',
        'checkout-flow:off-map:interruption',
        'checkout-flow:off-map:staleness',
        'checkout-flow:off-map:configuration',
        'checkout-flow:off-map:hostile-input',
        'checkout-flow:off-map:perf',
      ]);
    });

    it("VALID: {track: 'flowrider', its own packageNames} => tool and gate name the SAME units — identical to the UI-scoped case, since packageNames no longer partitions them", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'flowrider',
        flowIds: ['checkout-flow'] as never,
        packageNames: [API_PACKAGE] as never,
      });
      proxy.setupQuestFound({
        quest: QuestStub({ ...TAGGED_QUEST, operations: [scopeItem] }),
      });

      const checklists = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
        operationItemId: OP_ID as never,
      });

      expect(checklists.checklists[0]?.remainingItemIds).toStrictEqual([
        'checkout-flow:terminal:n-done',
        'checkout-flow:branch:e-submit',
        'checkout-flow:branch:e-ok',
        'checkout-flow:observable:obs-cart',
        'checkout-flow:observable:obs-charge',
        'checkout-flow:off-map:re-entry',
        'checkout-flow:off-map:concurrency',
        'checkout-flow:off-map:interruption',
        'checkout-flow:off-map:staleness',
        'checkout-flow:off-map:configuration',
        'checkout-flow:off-map:hostile-input',
        'checkout-flow:off-map:perf',
      ]);
    });
  });

  // The loaded quest carries the work items, and the work items carry the marks. A broker that
  // builds the checklist without handing the quest over reports the whole flow outstanding whatever
  // any session already settled, which is a work list that gates nothing.
  describe('what the asking track already settled', () => {
    it('VALID: {a flowrider item, one unit met by a flowrider work item and one by a codeweaver work item} => only the FLOWRIDER-settled unit leaves the list', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'flowrider',
        flowIds: ['checkout-flow'] as never,
      });
      const quest = QuestStub({
        ...TAGGED_QUEST,
        operations: [scopeItem],
        workItems: [
          WorkItemStub({
            id: 'b2b2b2b2-2222-4333-9444-555555555555',
            role: 'flowrider',
            observations: [
              UnitObservationStub({ unitId: 'checkout-flow:observable:obs-cart', mark: 'met' }),
            ],
          }),
          WorkItemStub({
            id: 'd4d4d4d4-4444-4555-9666-777777777777',
            role: 'codeweaver',
            observations: [
              UnitObservationStub({ unitId: 'checkout-flow:observable:obs-charge', mark: 'met' }),
            ],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const { checklists } = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
        operationItemId: OP_ID as never,
      });

      expect(checklists[0]?.remainingItemIds).toStrictEqual([
        'checkout-flow:terminal:n-done',
        'checkout-flow:branch:e-submit',
        'checkout-flow:branch:e-ok',
        'checkout-flow:observable:obs-charge',
        'checkout-flow:off-map:re-entry',
        'checkout-flow:off-map:concurrency',
        'checkout-flow:off-map:interruption',
        'checkout-flow:off-map:staleness',
        'checkout-flow:off-map:configuration',
        'checkout-flow:off-map:hostile-input',
        'checkout-flow:off-map:perf',
      ]);
    });

    it('VALID: {no operationItemId, the same settled quest} => every unit is listed, because the whole-quest read applies no track', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        ...TAGGED_QUEST,
        workItems: [
          WorkItemStub({
            id: 'b2b2b2b2-2222-4333-9444-555555555555',
            role: 'flowrider',
            observations: [
              UnitObservationStub({ unitId: 'checkout-flow:observable:obs-cart', mark: 'met' }),
            ],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const { checklists } = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
      });

      expect(checklists[0]?.remainingItemIds).toStrictEqual([
        'checkout-flow:terminal:n-done',
        'checkout-flow:branch:e-submit',
        'checkout-flow:branch:e-ok',
        'checkout-flow:observable:obs-cart',
        'checkout-flow:observable:obs-charge',
        'checkout-flow:off-map:re-entry',
        'checkout-flow:off-map:concurrency',
        'checkout-flow:off-map:interruption',
        'checkout-flow:off-map:staleness',
        'checkout-flow:off-map:configuration',
        'checkout-flow:off-map:hostile-input',
        'checkout-flow:off-map:perf',
      ]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => throws not found error', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questGetQaChecklistBroker({ questId: QuestIdStub({ value: 'nonexistent' }) }),
      ).rejects.toThrow(/Quest with id "nonexistent" not found/u);
    });
  });
});

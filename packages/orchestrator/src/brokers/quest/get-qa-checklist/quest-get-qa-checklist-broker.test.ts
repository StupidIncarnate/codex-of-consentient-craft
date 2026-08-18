import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestIdStub,
  QuestPackageEntryStub,
  QuestStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

import { signoffOutstandingTransformer } from '../../../transformers/signoff-outstanding/signoff-outstanding-transformer';
import { questGetQaChecklistBroker } from './quest-get-qa-checklist-broker';
import { questGetQaChecklistBrokerProxy } from './quest-get-qa-checklist-broker.proxy';

// A tagged quest: `ui-app` resolves to a browser-reachable kind and `api-service` does not, which is
// the axis that splits the two authoring denominators. Named nowhere in source — the rule is
// `packageType`, never a package name.
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
const OTHER_OP_ID = 'c2c2c2c2-1111-4222-9333-444444444444';

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

    it("VALID: {track: 'siegemaster', no flowId} => returns EVERY flow, because siegemaster verifies operational end states too", async () => {
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

      expect(result.checklists.map((checklist) => checklist.flowId)).toStrictEqual([
        'walk-flow',
        'rollout-flow',
      ]);
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

    // A role with NO sign-off track resolves to no scope at all — `codeweaver` and `pesteater` are
    // measured on the scope block rendered into their Operation Context, not on the flow graph. It
    // is distinct from "this quest has no flows", and the responder says so in different words.
    it.each(['codeweaver', 'pesteater'] as const)(
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

  describe('remainingItemIds is measured against the named track', () => {
    it("VALID: {track: 'flowrider', terminal carrying no flowriderSignoff} => still outstanding", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'flowrider',
        flowIds: ['walk-flow'] as never,
      });
      const quest = QuestStub({
        operations: [scopeItem],
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'a-node', label: 'A node' })],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        operationItemId: OP_ID as never,
      });

      expect(result.checklists[0]?.remainingItemIds).toStrictEqual(['walk-flow:terminal:a-node']);
    });

    it("VALID: {track: 'flowrider', terminal carries flowriderSignoff} => nothing remains, and off-map never counted", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'flowrider',
        flowIds: ['walk-flow'] as never,
      });
      const quest = QuestStub({
        operations: [scopeItem],
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'a-node', label: 'A node', flowriderSignoff: SignoffStub() }),
            ],
            edges: [],
          }),
        ],
        planningNotes: {},
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        operationItemId: OP_ID as never,
      });

      expect(result.checklists[0]?.remainingItemIds).toStrictEqual([]);
    });

    it("VALID: {track: 'siegemaster', terminal carries flowriderSignoff only} => the terminal AND every off-map family are still outstanding", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'siegemaster',
        flowIds: ['walk-flow'] as never,
      });
      const quest = QuestStub({
        operations: [scopeItem],
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'a-node', label: 'A node', flowriderSignoff: SignoffStub() }),
            ],
            edges: [],
          }),
        ],
        planningNotes: {},
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        operationItemId: OP_ID as never,
      });

      expect(result.checklists[0]?.remainingItemIds).toStrictEqual([
        'walk-flow:terminal:a-node',
        'walk-flow:off-map:re-entry',
        'walk-flow:off-map:concurrency',
        'walk-flow:off-map:interruption',
        'walk-flow:off-map:staleness',
        'walk-flow:off-map:configuration',
        'walk-flow:off-map:hostile-input',
        'walk-flow:off-map:perf',
      ]);
    });
  });

  // The number a session reads and the number its gate refuses on MUST be the same number. They are
  // computed by different call chains — this broker for the tool, `signoffOutstandingTransformer`
  // for signal-back — and a divergence is indistinguishable from a hallucinating gate. Groundstomper
  // is where it would show first: it writes `flowriderSignoff`, so a tool keyed on the sign-off
  // FIELD hands it Flowrider's package kinds, which are the exact complement of its own.
  describe('the checklist number equals the completion gate number', () => {
    it('VALID: {a groundstomper item} => the tool and the gate name the SAME browser-reachable units', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      // ONE item, read by both surfaces. That is the whole claim now: the scope is not passed to
      // either of them, it is derived from this object by the transformer they share.
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'groundstomper',
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

      const gateOutstanding = signoffOutstandingTransformer({
        quest,
        operationItem: scopeItem,
      });

      // The branch LEAVING the frontend node and the observable ON it — and nothing backend, and no
      // off-map family.
      expect([checklists[0]?.remainingItemIds, gateOutstanding]).toStrictEqual([
        ['checkout-flow:branch:e-submit', 'checkout-flow:observable:obs-cart'],
        ['checkout-flow:branch:e-submit', 'checkout-flow:observable:obs-cart'],
      ]);
    });

    it("VALID: {track: 'flowrider', its own packageNames} => tool and gate name the SAME units, and they are the complement", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const scopeItem = OperationItemStub({
        id: OP_ID as never,
        role: 'flowrider',
        packageNames: [API_PACKAGE] as never,
      });
      proxy.setupQuestFound({
        quest: QuestStub({ ...TAGGED_QUEST, operations: [scopeItem] }),
      });
      const flowriderItem = OperationItemStub({
        role: 'flowrider',
        status: 'in_progress',
        locked: true,
        flowIds: ['checkout-flow'],
        packageNames: [API_PACKAGE],
      });

      const checklists = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
        operationItemId: OP_ID as never,
      });

      const gateOutstanding = signoffOutstandingTransformer({
        quest: TAGGED_QUEST,
        operationItem: flowriderItem,
      });

      expect([checklists.checklists[0]?.remainingItemIds, gateOutstanding]).toStrictEqual([
        [
          'checkout-flow:terminal:n-done',
          'checkout-flow:branch:e-ok',
          'checkout-flow:observable:obs-charge',
        ],
        [
          'checkout-flow:terminal:n-done',
          'checkout-flow:branch:e-ok',
          'checkout-flow:observable:obs-charge',
        ],
      ]);
    });

    // The old failure this file guarded — a groundstomper session handed Flowrider's track name and
    // reading the exact complement of its own work — is no longer expressible. There is no `track`
    // argument to get wrong and no `packageNames` to omit: two items of DIFFERENT roles over the
    // same flow produce the two disjoint halves, and each matches its own gate.
    it('VALID: {a flowrider and a groundstomper item over one flow} => disjoint halves, each equal to its own gate', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const flowriderItem = OperationItemStub({
        id: OP_ID as never,
        role: 'flowrider',
        flowIds: ['checkout-flow'] as never,
        packageNames: [API_PACKAGE] as never,
      });
      const groundstomperItem = OperationItemStub({
        id: OTHER_OP_ID as never,
        role: 'groundstomper',
        flowIds: ['checkout-flow'] as never,
        packageNames: [UI_PACKAGE] as never,
      });
      const quest = QuestStub({
        ...TAGGED_QUEST,
        operations: [flowriderItem, groundstomperItem],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });

      const below = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
        operationItemId: OP_ID as never,
      });
      const browser = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
        operationItemId: OTHER_OP_ID as never,
      });

      expect({
        below: below.checklists[0]?.remainingItemIds,
        browser: browser.checklists[0]?.remainingItemIds,
        belowMatchesItsGate:
          below.checklists[0]?.remainingItemIds.join() ===
          signoffOutstandingTransformer({ quest, operationItem: flowriderItem }).join(),
        browserMatchesItsGate:
          browser.checklists[0]?.remainingItemIds.join() ===
          signoffOutstandingTransformer({ quest, operationItem: groundstomperItem }).join(),
      }).toStrictEqual({
        below: [
          'checkout-flow:terminal:n-done',
          'checkout-flow:branch:e-ok',
          'checkout-flow:observable:obs-charge',
        ],
        browser: ['checkout-flow:branch:e-submit', 'checkout-flow:observable:obs-cart'],
        belowMatchesItsGate: true,
        browserMatchesItsGate: true,
      });
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

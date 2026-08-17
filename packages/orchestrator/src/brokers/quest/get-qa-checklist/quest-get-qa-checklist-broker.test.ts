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

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual([
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

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual(['second-flow']);
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

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {quest with no flows} => returns an empty list', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({ flows: [] });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result).toStrictEqual([]);
    });
  });

  describe('track scoping over a quest carrying both flow types', () => {
    it("VALID: {track: 'flowrider', no flowId} => returns the RUNTIME flows only, the set that track is measured over", async () => {
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
        track: 'flowrider',
      });

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual([
        'walk-flow',
        'second-walk-flow',
      ]);
    });

    it("VALID: {track: 'siegemaster', no flowId} => returns EVERY flow, because siegemaster verifies operational end states too", async () => {
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

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        track: 'siegemaster',
      });

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual([
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

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual([
        'walk-flow',
        'rollout-flow',
      ]);
    });

    it("VALID: {track: 'flowrider', flowId of an OPERATIONAL flow} => the explicit flowId wins over the track filter", async () => {
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

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        flowId: 'rollout-flow' as never,
        track: 'flowrider',
      });

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual(['rollout-flow']);
    });

    it("EMPTY: {track: 'flowrider', every flow operational} => returns an empty list, so 'nothing to walk' is a real answer", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
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
        track: 'flowrider',
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('remainingItemIds is measured against the named track', () => {
    it("VALID: {track: 'flowrider', terminal carrying no flowriderSignoff} => still outstanding", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
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
        track: 'flowrider',
      });

      expect(result[0]?.remainingItemIds).toStrictEqual(['walk-flow:terminal:a-node']);
    });

    it("VALID: {track: 'flowrider', terminal carries flowriderSignoff} => nothing remains, and off-map never counted", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
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
        track: 'flowrider',
      });

      expect(result[0]?.remainingItemIds).toStrictEqual([]);
    });

    it("VALID: {track: 'siegemaster', terminal carries flowriderSignoff only} => the terminal AND every off-map family are still outstanding", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
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
        track: 'siegemaster',
      });

      expect(result[0]?.remainingItemIds).toStrictEqual([
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
    it("VALID: {track: 'groundstomper', its own packageNames} => tool and gate name the SAME browser-reachable units", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      proxy.setupQuestFound({ quest: TAGGED_QUEST });
      const groundstomperItem = OperationItemStub({
        role: 'groundstomper',
        status: 'in_progress',
        locked: true,
        flowIds: ['checkout-flow'],
        packageNames: [UI_PACKAGE],
      });

      const checklists = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
        track: 'groundstomper',
        packageNames: [UI_PACKAGE] as never,
      });

      const gateOutstanding = signoffOutstandingTransformer({
        quest: TAGGED_QUEST,
        operationItem: groundstomperItem,
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
      proxy.setupQuestFound({ quest: TAGGED_QUEST });
      const flowriderItem = OperationItemStub({
        role: 'flowrider',
        status: 'in_progress',
        locked: true,
        flowIds: ['checkout-flow'],
        packageNames: [API_PACKAGE],
      });

      const checklists = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
        track: 'flowrider',
        packageNames: [API_PACKAGE] as never,
      });

      const gateOutstanding = signoffOutstandingTransformer({
        quest: TAGGED_QUEST,
        operationItem: flowriderItem,
      });

      expect([checklists[0]?.remainingItemIds, gateOutstanding]).toStrictEqual([
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

    it("VALID: {track: 'groundstomper' handed FLOWRIDER's slice} => the tool answers the other role's set, which is why the name matters", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      proxy.setupQuestFound({ quest: TAGGED_QUEST });

      const checklists = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: TAGGED_QUEST.id }),
        track: 'flowrider',
        packageNames: [UI_PACKAGE] as never,
      });

      // `flowrider` sheds every frontend unit by KIND before the slice is applied, so naming the
      // wrong track leaves a groundstomper session reading zero and signalling `done` against a gate
      // that would refuse two.
      expect(checklists[0]?.remainingItemIds).toStrictEqual([]);
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

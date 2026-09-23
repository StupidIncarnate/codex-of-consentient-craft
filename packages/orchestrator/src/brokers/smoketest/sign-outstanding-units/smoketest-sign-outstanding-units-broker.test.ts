import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { smoketestSignOutstandingUnitsBroker } from './smoketest-sign-outstanding-units-broker';
import { smoketestSignOutstandingUnitsBrokerProxy } from './smoketest-sign-outstanding-units-broker.proxy';

type OffMapFamily = keyof typeof qaOffMapProbeStatics.byFamily;

const QUEST_ID = QuestIdStub({ value: 'sign-outstanding-quest' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'dddddddd-dddd-4ddd-addd-dddddddddd01' });
const OPERATION_ID = 'cccccccc-cccc-4ccc-accc-cccccccccc01';
const OPERATION_REF = `operations/${OPERATION_ID}`;
const FLOW_ID = 'smoketest-signal-flow';

const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily) as readonly OffMapFamily[];

// The minimal blueprint's shape: an action node pointing at a terminal node that carries one
// observable. `dispatch-agent` has an outgoing edge, so it is NOT a terminal and mints no unit.
const FLOW_NODES = [
  FlowNodeStub({ id: 'dispatch-agent', label: 'Dispatch agent', packages: ['orchestrator'] }),
  FlowNodeStub({
    id: 'emit-signal',
    label: 'Agent emits signal-back',
    packages: ['orchestrator'],
    observables: [
      FlowObservableStub({
        id: 'smoketest-signal-received',
        description: 'the scripted signal lands',
        package: 'orchestrator',
      }),
    ],
  }),
];
const FLOW_EDGES = [
  FlowEdgeStub({ id: 'dispatch-to-signal', from: 'dispatch-agent', to: 'emit-signal' }),
];

// Siegemaster measures BOTH flow types; Flowrider measures `runtime` alone. That asymmetry is why
// the same graph is needed at both types below.
const OPERATIONAL_FLOW = FlowStub({
  id: FLOW_ID,
  name: 'Smoketest Signal Flow',
  flowType: 'operational',
  entryPoint: 'orchestrator dispatches smoketest agent',
  exitPoints: ['agent signaled complete'],
  nodes: FLOW_NODES,
  edges: FLOW_EDGES,
});
const RUNTIME_FLOW = FlowStub({ ...OPERATIONAL_FLOW, flowType: 'runtime' });

const SIEGEMASTER_OPERATION = OperationItemStub({
  id: OPERATION_ID,
  role: 'siegemaster',
  text: 'Siegemaster: manual-QA this flow — flow: smoketest-signal-flow',
  status: 'in_progress',
  locked: true,
  flowIds: [FLOW_ID],
});
const SIEGEMASTER_WORK_ITEM = WorkItemStub({
  id: WORK_ITEM_ID,
  role: 'siegemaster',
  status: 'pending',
  relatedDataItems: [OPERATION_REF],
});

const questSiegemasterOperational = QuestStub({
  id: QUEST_ID,
  flows: [OPERATIONAL_FLOW],
  operations: [SIEGEMASTER_OPERATION],
  workItems: [SIEGEMASTER_WORK_ITEM],
});

const questFlowriderRuntime = QuestStub({
  id: QUEST_ID,
  flows: [RUNTIME_FLOW],
  operations: [
    OperationItemStub({
      id: OPERATION_ID,
      role: 'flowrider',
      text: 'Flowrider: author the flow-perspective test suites below the browser',
      status: 'in_progress',
      locked: true,
      flowIds: [FLOW_ID],
    }),
  ],
  workItems: [
    WorkItemStub({
      id: WORK_ITEM_ID,
      role: 'flowrider',
      status: 'pending',
      relatedDataItems: [OPERATION_REF],
    }),
  ],
});

const questFlowriderOperational = QuestStub({
  id: QUEST_ID,
  flows: [OPERATIONAL_FLOW],
  operations: [
    OperationItemStub({
      id: OPERATION_ID,
      role: 'flowrider',
      text: 'Flowrider: author the flow-perspective test suites below the browser',
      status: 'in_progress',
      locked: true,
      flowIds: [FLOW_ID],
    }),
  ],
  workItems: [
    WorkItemStub({
      id: WORK_ITEM_ID,
      role: 'flowrider',
      status: 'pending',
      relatedDataItems: [OPERATION_REF],
    }),
  ],
});

// `spiritmender` — like `warpgate` — carries no `byTrack` entry at all, so it is measured on
// nothing: the broker's eligibility lookup returns `undefined` for it regardless of what flows or
// packages the item declares. `codeweaver` no longer illustrates this case, since it is now one of
// the three verification tracks (alongside flowrider and siegemaster) that a work item marks
// through `workItem.observations[]`.
const questSpiritmender = QuestStub({
  id: QUEST_ID,
  flows: [OPERATIONAL_FLOW],
  operations: [
    OperationItemStub({
      id: OPERATION_ID,
      role: 'spiritmender',
      text: 'Spiritmender: repair the red ward run',
      status: 'in_progress',
    }),
  ],
  workItems: [
    WorkItemStub({
      id: WORK_ITEM_ID,
      role: 'spiritmender',
      status: 'pending',
      relatedDataItems: [OPERATION_REF],
    }),
  ],
});

const questAlreadySigned = QuestStub({
  id: QUEST_ID,
  flows: [
    FlowStub({
      ...OPERATIONAL_FLOW,
      nodes: [
        FlowNodeStub({ id: 'dispatch-agent', label: 'Dispatch agent', packages: ['orchestrator'] }),
        FlowNodeStub({
          id: 'emit-signal',
          label: 'Agent emits signal-back',
          packages: ['orchestrator'],
          observables: [
            FlowObservableStub({
              id: 'smoketest-signal-received',
              description: 'the scripted signal lands',
              package: 'orchestrator',
            }),
          ],
        }),
      ],
      offMapSignoffs: OFF_MAP_FAMILIES.map((family) => FlowOffMapSignoffStub({ id: family })),
    }),
  ],
  operations: [SIEGEMASTER_OPERATION],
  workItems: [SIEGEMASTER_WORK_ITEM],
});

const questWithoutTheWorkItem = QuestStub({
  id: QUEST_ID,
  flows: [OPERATIONAL_FLOW],
  operations: [SIEGEMASTER_OPERATION],
  workItems: [],
});

const questWithUnlinkedWorkItem = QuestStub({
  id: QUEST_ID,
  flows: [OPERATIONAL_FLOW],
  operations: [SIEGEMASTER_OPERATION],
  workItems: [WorkItemStub({ id: WORK_ITEM_ID, role: 'siegemaster', status: 'pending' })],
});

describe('smoketestSignOutstandingUnitsBroker', () => {
  describe('a gated role with outstanding units', () => {
    it('VALID: {siegemaster item on an operational flow} => records every off-map family in offMapSignoffs', async () => {
      const proxy = smoketestSignOutstandingUnitsBrokerProxy();
      proxy.setupQuestFound({ quest: questSiegemasterOperational });

      const result = await smoketestSignOutstandingUnitsBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      const flows = proxy.getPersistedQuests().flatMap((quest) => quest.flows);

      expect({
        result,
        offMapSignoffs: flows.flatMap((flow) => flow.offMapSignoffs),
      }).toStrictEqual({
        result: { success: true },
        offMapSignoffs: OFF_MAP_FAMILIES.map((family) => FlowOffMapSignoffStub({ id: family })),
      });
    });

    it('VALID: {siegemaster item} => preserves flow nodes without sign-off fields', async () => {
      const proxy = smoketestSignOutstandingUnitsBrokerProxy();
      proxy.setupQuestFound({ quest: questSiegemasterOperational });

      await smoketestSignOutstandingUnitsBroker({ questId: QUEST_ID, workItemId: WORK_ITEM_ID });

      const flows = proxy.getPersistedQuests().flatMap((quest) => quest.flows);

      expect(flows.flatMap((flow) => flow.nodes)).toStrictEqual(FLOW_NODES);
    });

    it('VALID: {flowrider item on a RUNTIME flow} => leaves the off-map families empty', async () => {
      const proxy = smoketestSignOutstandingUnitsBrokerProxy();
      proxy.setupQuestFound({ quest: questFlowriderRuntime });

      const result = await smoketestSignOutstandingUnitsBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      const flows = proxy.getPersistedQuests().flatMap((quest) => quest.flows);

      expect({
        result,
        offMapSignoffs: flows.flatMap((flow) => flow.offMapSignoffs),
      }).toStrictEqual({
        result: { success: true },
        offMapSignoffs: [],
      });
    });
  });

  describe('nothing to sign', () => {
    // STILL REACHABLE, though `relayTailFanOutTransformer` never mints this pairing — it cuts each
    // flow-fanned seed over its own track's `flowTypes`. Two live routes produce it anyway, and the
    // broker's own filter is the only thing holding either:
    //   1. `flowsRule: 'full'` at `in_progress` lets an execution agent EDIT a flow, `flowType`
    //      included, so a flow can turn operational under a flowrider item already minted over it.
    //   2. `questHydrateBroker` prepends a blueprint's authored `operations` verbatim, replacing the
    //      derived items for the roles they name — a blueprint may author a flowrider item over any
    //      flow it likes, and that ledger never passes through the fan-out at all.
    it('VALID: {flowrider item on an OPERATIONAL-only quest} => persists nothing, because that track measures runtime flows alone', async () => {
      const proxy = smoketestSignOutstandingUnitsBrokerProxy();
      proxy.setupQuestFound({ quest: questFlowriderOperational });

      const result = await smoketestSignOutstandingUnitsBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({ result, persistedCount: proxy.getAllPersistedContents().length }).toStrictEqual({
        result: { success: true },
        persistedCount: 0,
      });
    });

    it('VALID: {spiritmender item} => persists nothing, because no verification track names that role', async () => {
      const proxy = smoketestSignOutstandingUnitsBrokerProxy();
      proxy.setupQuestFound({ quest: questSpiritmender });

      const result = await smoketestSignOutstandingUnitsBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({ result, persistedCount: proxy.getAllPersistedContents().length }).toStrictEqual({
        result: { success: true },
        persistedCount: 0,
      });
    });

    it('VALID: {siegemaster item whose off-map families are already recorded} => off-map families are recorded in offMapSignoffs without duplicates', async () => {
      const proxy = smoketestSignOutstandingUnitsBrokerProxy();
      proxy.setupQuestFound({ quest: questAlreadySigned });

      const result = await smoketestSignOutstandingUnitsBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      const flows = proxy.getPersistedQuests().flatMap((quest) => quest.flows);

      expect({
        result,
        offMapSignoffs: flows.flatMap((flow) => flow.offMapSignoffs),
      }).toStrictEqual({
        result: { success: true },
        offMapSignoffs: OFF_MAP_FAMILIES.map((family) => FlowOffMapSignoffStub({ id: family })),
      });
    });
  });

  describe('work items the harness cannot resolve', () => {
    it('VALID: {work item id not on the quest} => persists nothing and resolves success', async () => {
      const proxy = smoketestSignOutstandingUnitsBrokerProxy();
      proxy.setupQuestFound({ quest: questWithoutTheWorkItem });

      const result = await smoketestSignOutstandingUnitsBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({ result, persistedCount: proxy.getAllPersistedContents().length }).toStrictEqual({
        result: { success: true },
        persistedCount: 0,
      });
    });

    it('VALID: {work item carrying no operations/ ref} => persists nothing and resolves success', async () => {
      const proxy = smoketestSignOutstandingUnitsBrokerProxy();
      proxy.setupQuestFound({ quest: questWithUnlinkedWorkItem });

      const result = await smoketestSignOutstandingUnitsBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({ result, persistedCount: proxy.getAllPersistedContents().length }).toStrictEqual({
        result: { success: true },
        persistedCount: 0,
      });
    });
  });
});

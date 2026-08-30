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
  SignoffStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { signoffTrackEligibilityStatics } from '../../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { smoketestStatics } from '../../../statics/smoketest/smoketest-statics';
import { smoketestSweepPendingWorkItemsLayerBroker } from './smoketest-sweep-pending-work-items-layer-broker';
import { smoketestSweepPendingWorkItemsLayerBrokerProxy } from './smoketest-sweep-pending-work-items-layer-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'sweep-layer-quest' });
const WI_PENDING = QuestWorkItemIdStub({ value: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01' });
const WI_PENDING_TWO = QuestWorkItemIdStub({ value: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02' });
const CODEWEAVER_ROLE = WorkItemRoleStub({ value: 'codeweaver' });
const SIEGEMASTER_ROLE = WorkItemRoleStub({ value: 'siegemaster' });
// Unique substring from smoketestPromptsStatics.signalComplete that survives JSON escaping.
const SIGNAL_COMPLETE_SIGNATURE = 'smoketest-complete';

type OffMapFamily = keyof typeof qaOffMapProbeStatics.byFamily;

const SIEGEMASTER_FIELD = signoffTrackEligibilityStatics.byTrack.siegemaster.signoffField;
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily) as readonly OffMapFamily[];
const GATED_OPERATION_ID = 'cccccccc-cccc-4ccc-accc-cccccccccc02';
const GATED_FLOW_ID = 'sweep-signal-flow';

// The minimal blueprint's shape, small enough to assert whole: an action node pointing at a terminal
// node carrying one observable, on an OPERATIONAL flow — the type Siegemaster measures and Flowrider
// does not, which is why siegemaster is the role the gate bites on this blueprint.
const GATED_FLOW = FlowStub({
  id: GATED_FLOW_ID,
  name: 'Sweep Signal Flow',
  flowType: 'operational',
  entryPoint: 'orchestrator dispatches smoketest agent',
  exitPoints: ['agent signaled complete'],
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
  edges: [FlowEdgeStub({ id: 'dispatch-to-signal', from: 'dispatch-agent', to: 'emit-signal' })],
});

const questWithGatedSiegemaster = QuestStub({
  id: QUEST_ID,
  flows: [GATED_FLOW],
  operations: [
    OperationItemStub({
      id: GATED_OPERATION_ID,
      role: 'siegemaster',
      text: 'Siegemaster: manual-QA this flow — flow: sweep-signal-flow',
      status: 'in_progress',
      locked: true,
      flowIds: [GATED_FLOW_ID],
    }),
  ],
  workItems: [
    WorkItemStub({
      id: WI_PENDING,
      role: 'siegemaster',
      status: 'pending',
      relatedDataItems: [`operations/${GATED_OPERATION_ID}`],
    }),
  ],
});

const questWithTwoPendingRoles = QuestStub({
  id: QUEST_ID,
  workItems: [
    WorkItemStub({ id: WI_PENDING, role: 'codeweaver', status: 'pending' }),
    WorkItemStub({ id: WI_PENDING_TWO, role: 'siegemaster', status: 'pending' }),
  ],
});

const questWithStampedCodeweaver = QuestStub({
  id: QUEST_ID,
  workItems: [
    WorkItemStub({
      id: WI_PENDING,
      role: 'codeweaver',
      status: 'pending',
      smoketestPromptOverride: PromptTextStub({ value: 'already stamped' }),
    }),
  ],
});

const dispenseAlwaysNull = (): null => null;
const dispenseSignalCompleteForCodeweaver = ({
  role,
}: {
  role: ReturnType<typeof WorkItemRoleStub>;
}): 'signalComplete' | null => (role === CODEWEAVER_ROLE ? 'signalComplete' : null);
const dispenseSignalCompleteForBoth = ({
  role,
}: {
  role: ReturnType<typeof WorkItemRoleStub>;
}): 'signalComplete' | null =>
  role === CODEWEAVER_ROLE || role === SIEGEMASTER_ROLE ? 'signalComplete' : null;

describe('smoketestSweepPendingWorkItemsLayerBroker', () => {
  describe('aborted signal', () => {
    it('VALID: {abortSignal pre-aborted} => does not persist any stamp', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithTwoPendingRoles });
      const controller = new AbortController();
      controller.abort();

      const result = await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalCompleteForBoth,
      });

      expect({
        result,
        persistedContents: proxy.getAllPersistedContents(),
      }).toStrictEqual({
        result: { success: true },
        persistedContents: [],
      });
    });
  });

  describe('dispense returns null', () => {
    it('VALID: {dispense always null} => does not persist any stamp', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithTwoPendingRoles });
      const controller = new AbortController();

      const result = await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseAlwaysNull,
      });

      expect({
        result,
        persistedContents: proxy.getAllPersistedContents(),
      }).toStrictEqual({
        result: { success: true },
        persistedContents: [],
      });
    });
  });

  describe('skips already-stamped items', () => {
    it('VALID: {pending codeweaver with existing override} => does not persist', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithStampedCodeweaver });
      const controller = new AbortController();

      const result = await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalCompleteForCodeweaver,
      });

      expect({
        result,
        persistedContents: proxy.getAllPersistedContents(),
      }).toStrictEqual({
        result: { success: true },
        persistedContents: [],
      });
    });
  });

  describe('resolves the prompt placeholders', () => {
    // A relay-minted work item's id does not exist when the scenario script is authored, and
    // `signal-back` requires both ids. Stamping the raw template leaves the agent calling the tool
    // with the literal `{{questId}}` / `{{workItemId}}` strings, which the tool refuses — the
    // session then never signals and orphan recovery blocks the quest.
    it('VALID: {pending codeweaver} => the stamped override carries the live questId and that item OWN workItemId, no {{...}} left', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithTwoPendingRoles });
      const controller = new AbortController();

      await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalCompleteForCodeweaver,
      });

      expect(proxy.getStampedOverrides()).toStrictEqual([
        `Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "questId": "${String(QUEST_ID)}", "workItemId": "${String(WI_PENDING)}", "signal": "complete", "summary": "smoketest-complete" }. Do not output anything else.`,
        undefined,
      ]);
    });
  });

  describe('stamps pending items with no override', () => {
    it('VALID: {pending codeweaver, dispense returns signalComplete} => persists quest.json with the dispensed prompt', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithTwoPendingRoles });
      const controller = new AbortController();

      const result = await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalCompleteForCodeweaver,
      });

      const persistedStrings = proxy.getAllPersistedContents().map((content) => String(content));
      const hits = persistedStrings.filter((raw) => raw.includes(SIGNAL_COMPLETE_SIGNATURE));

      expect({
        result,
        atLeastOneHit: hits.length > 0,
      }).toStrictEqual({
        result: { success: true },
        atLeastOneHit: true,
      });
    });
  });

  describe('fabricates sign-offs before the scripted signal lands', () => {
    // Nothing gates the scripted siegemaster's `done` on its (nonexistent) real sign-offs — but
    // without this, the fixture quest left on disk would show nine permanently unsigned units,
    // indistinguishable from a real coverage hole to a human reading it later.
    it('VALID: {pending siegemaster linked to a gated operation item} => the persisted quest carries a confirmed fixture sign-off on the terminal and the observable', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithGatedSiegemaster });
      const controller = new AbortController();

      await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalCompleteForBoth,
      });

      const expectedSignoff = SignoffStub({
        evidence: smoketestStatics.signoffEvidence,
        workItemId: WI_PENDING,
        // The timestamp questPersistBrokerProxy's outbox chain pins the clock to.
        at: '2024-01-15T10:00:00.000Z',
      });
      // Two writes reach questPersistBroker for this work item and their ORDER is the point: the
      // sign-off write is awaited first, so the units are settled on disk before the override the
      // agent will run is even stamped. The first persisted quest is that sign-off write.
      const signedFlows = proxy
        .getPersistedQuests()
        .slice(0, 1)
        .flatMap((quest) => quest.flows);

      expect({
        persistCount: proxy.getAllPersistedContents().length,
        nodes: signedFlows.flatMap((flow) =>
          flow.nodes.map((node) => ({
            id: String(node.id),
            signoff: node[SIEGEMASTER_FIELD],
          })),
        ),
        observables: signedFlows.flatMap((flow) =>
          flow.nodes.flatMap((node) =>
            node.observables.map((observable) => observable[SIEGEMASTER_FIELD]),
          ),
        ),
        offMapSignoffs: signedFlows.flatMap((flow) => flow.offMapSignoffs),
      }).toStrictEqual({
        persistCount: 2,
        nodes: [
          { id: 'dispatch-agent', signoff: undefined },
          { id: 'emit-signal', signoff: expectedSignoff },
        ],
        observables: [expectedSignoff],
        offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
          FlowOffMapSignoffStub({ id: family, siegemasterSignoff: expectedSignoff }),
        ),
      });
    });
  });
});

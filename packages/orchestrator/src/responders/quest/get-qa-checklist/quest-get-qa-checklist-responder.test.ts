import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowStub,
  OperationItemStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { signoffTrackEligibilityStatics } from '../../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { qaChecklistBuildTransformer } from '../../../transformers/qa-checklist-build/qa-checklist-build-transformer';
import { qaChecklistToTextTransformer } from '../../../transformers/qa-checklist-to-text/qa-checklist-to-text-transformer';
import { QuestGetQaChecklistResponderProxy } from './quest-get-qa-checklist-responder.proxy';

// The tracks whose `flowTypes` omit `operational` — the ones an all-operational quest leaves with
// nothing to walk. Derived, so a fourth track inherits the case instead of quietly skipping it.
type SignoffTrack = keyof typeof signoffTrackEligibilityStatics.byTrack;

const RUNTIME_ONLY_TRACKS = (
  Object.keys(signoffTrackEligibilityStatics.byTrack) as SignoffTrack[]
).filter(
  (track) =>
    !signoffTrackEligibilityStatics.byTrack[track].flowTypes.some(
      (flowType) => flowType === 'operational',
    ),
);

const OP_ID = 'c1c1c1c1-1111-4222-9333-444444444444';

describe('QuestGetQaChecklistResponder', () => {
  describe('rendering a quest', () => {
    it('VALID: {quest with one flow} => returns exactly that flow rendered', async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      const flow = FlowStub({ id: 'a-flow', name: 'A Flow', nodes: [], edges: [] });
      const quest = QuestStub({ flows: [flow] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result).toStrictEqual({
        success: true,
        data: qaChecklistToTextTransformer({
          checklist: qaChecklistBuildTransformer({ flow }),
        }),
      });
    });

    it('VALID: {quest with two flows} => renders both, joined by a divider', async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      const first = FlowStub({ id: 'first-flow', name: 'First', nodes: [], edges: [] });
      const second = FlowStub({ id: 'second-flow', name: 'Second', nodes: [], edges: [] });
      const quest = QuestStub({ flows: [first, second] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result).toStrictEqual({
        success: true,
        data: [
          qaChecklistToTextTransformer({
            checklist: qaChecklistBuildTransformer({ flow: first }),
          }),
          qaChecklistToTextTransformer({
            checklist: qaChecklistBuildTransformer({ flow: second }),
          }),
        ].join('\n\n---\n\n'),
      });
    });

    it('VALID: {flowId given} => renders only that flow', async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      const first = FlowStub({ id: 'first-flow', name: 'First', nodes: [], edges: [] });
      const second = FlowStub({ id: 'second-flow', name: 'Second', nodes: [], edges: [] });
      const quest = QuestStub({ flows: [first, second] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id, flowId: 'second-flow' });

      expect(result).toStrictEqual({
        success: true,
        data: qaChecklistToTextTransformer({
          checklist: qaChecklistBuildTransformer({ flow: second }),
        }),
      });
    });
  });

  describe('track scoping', () => {
    it("VALID: {track: 'flowrider', one runtime and one operational flow} => renders the runtime flow alone, measured against flowriderSignoff", async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      const runtime = FlowStub({
        id: 'walk-flow',
        name: 'Walk Flow',
        flowType: 'runtime',
        nodes: [],
        edges: [],
      });
      const operational = FlowStub({
        id: 'rollout-flow',
        name: 'Rollout Flow',
        flowType: 'operational',
        nodes: [],
        edges: [],
      });
      // The scope comes off the ITEM: its role is the track, and every track — flowrider included
      // — is `flowScope: 'declared'`, so the item's own flowIds narrow the flow set first; the
      // track's `flowTypes` narrow further, dropping the operational one.
      const item = OperationItemStub({
        id: OP_ID,
        role: 'flowrider',
        flowIds: ['walk-flow', 'rollout-flow'],
      });
      const quest = QuestStub({ flows: [runtime, operational], operations: [item] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({
        questId: quest.id,
        operationItemId: String(item.id),
      });

      expect(result).toStrictEqual({
        success: true,
        data: qaChecklistToTextTransformer({
          track: 'flowrider',
          checklist: qaChecklistBuildTransformer({ flow: runtime, track: 'flowrider' }),
        }),
      });
    });

    it("VALID: {track: 'siegemaster'} => renders every flow, measured against siegemasterSignoff", async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      const runtime = FlowStub({
        id: 'walk-flow',
        name: 'Walk Flow',
        flowType: 'runtime',
        nodes: [],
        edges: [],
      });
      const operational = FlowStub({
        id: 'rollout-flow',
        name: 'Rollout Flow',
        flowType: 'operational',
        nodes: [],
        edges: [],
      });
      // Siegemaster is `flowScope: 'declared'`, so the item names its flows — and its `flowTypes`
      // carry BOTH kinds, which is why an operational flow is in scope for this track alone.
      const item = OperationItemStub({
        id: OP_ID,
        role: 'siegemaster',
        flowIds: ['walk-flow', 'rollout-flow'],
      });
      const quest = QuestStub({ flows: [runtime, operational], operations: [item] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({
        questId: quest.id,
        operationItemId: String(item.id),
      });

      expect(result).toStrictEqual({
        success: true,
        data: [
          qaChecklistToTextTransformer({
            track: 'siegemaster',
            checklist: qaChecklistBuildTransformer({ flow: runtime, track: 'siegemaster' }),
          }),
          qaChecklistToTextTransformer({
            track: 'siegemaster',
            checklist: qaChecklistBuildTransformer({ flow: operational, track: 'siegemaster' }),
          }),
        ].join('\n\n---\n\n'),
      });
    });

    it("VALID: {track: 'flowrider', packageNames} => REMAINING counts that item's slice, not the whole quest's", async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      const packagesAffected = [
        QuestPackageEntryStub({
          name: 'api-service',
          location: './packages/api-service',
          changeType: 'edit',
          packageType: 'http-backend',
        }),
        QuestPackageEntryStub({
          name: 'core-lib',
          location: './packages/core-lib',
          changeType: 'edit',
          packageType: 'library',
        }),
      ];
      const flow = FlowStub({
        id: 'checkout-flow',
        name: 'Checkout Flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({ id: 'priced', label: 'Priced', packages: ['core-lib'] }),
          FlowNodeStub({ id: 'rejected', label: 'Rejected', packages: ['api-service'] }),
          FlowNodeStub({ id: 'intake', label: 'Intake', packages: ['api-service'] }),
        ],
        edges: [
          FlowEdgeStub({ id: 'to-priced', from: 'intake', to: 'priced' }),
          FlowEdgeStub({ id: 'to-rejected', from: 'intake', to: 'rejected' }),
        ],
      });
      // The package slice is ON the item now, so it cannot be omitted. That omission used not to
      // error — it silently widened the measurement to the whole quest, and the session then worked
      // units a sibling item was gated on while its own remainder never emptied.
      const item = OperationItemStub({
        id: OP_ID,
        role: 'flowrider',
        flowIds: ['checkout-flow'],
        packageNames: ['api-service'],
      });
      const quest = QuestStub({ packagesAffected, flows: [flow], operations: [item] });
      proxy.setupQuestFound({ quest });

      const scoped = packagesAffected
        .filter((entry) => String(entry.name) === 'api-service')
        .map((entry) => entry.name);
      const scopedChecklist = qaChecklistBuildTransformer({
        flow,
        track: 'flowrider',
        packagesAffected,
        packageNames: scoped,
      });
      const wholeQuestChecklist = qaChecklistBuildTransformer({
        flow,
        track: 'flowrider',
        packagesAffected,
      });

      const result = await proxy.callResponder({
        questId: quest.id,
        operationItemId: String(item.id),
      });

      expect(result).toStrictEqual({
        success: true,
        data: qaChecklistToTextTransformer({ track: 'flowrider', checklist: scopedChecklist }),
      });
      // The parameter is load-bearing, not decorative: the same flow measured without it carries the
      // other package's terminal too.
      expect({
        scoped: scopedChecklist.remainingItemIds.map(String),
        wholeQuest: wholeQuestChecklist.remainingItemIds.map(String),
      }).toStrictEqual({
        scoped: ['checkout-flow:terminal:rejected'],
        wholeQuest: ['checkout-flow:terminal:priced', 'checkout-flow:terminal:rejected'],
      });
    });
  });

  describe('nothing to verify', () => {
    it('EMPTY: {quest with no flows} => says so plainly instead of erroring', async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      const quest = QuestStub({ flows: [] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result).toStrictEqual({
        success: true,
        data: 'This quest has no flows, so there is nothing to verify. That is a real state, not an error — your track has zero units to sign, so commit the record and signal done.',
      });
    });

    it.each(RUNTIME_ONLY_TRACKS)(
      'EMPTY: {track: %s, every flow operational} => names that track and says it has nothing to walk, not that the quest has no flows',
      async (track) => {
        const proxy = QuestGetQaChecklistResponderProxy();
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
        const item = OperationItemStub({ id: OP_ID, role: track });
        proxy.setupQuestFound({
          quest: QuestStub({ ...quest, operations: [item] }),
        });

        const result = await proxy.callResponder({
          questId: quest.id,
          operationItemId: String(item.id),
        });

        expect(result).toStrictEqual({
          success: true,
          data: `This quest has no runtime flows, so the ${track} track has nothing to walk. That is a real state, not an error — operational flows are verified by Siegemaster checking their end state, never by an authored suite. Your gate still binds and it yields zero units, so commit the record and signal done.`,
        });
      },
    );

    // Not the same fact as "this quest has no flows": `spiritmender` and `warpgate` are measured on
    // what their own prompt hands them, not on the flow graph. Reading the generic no-flows line
    // would read as "your scope is empty," which a session could act on by signalling done early.
    it.each(['spiritmender', 'warpgate'] as const)(
      'EMPTY: {role: %s} => says its role has no sign-off track, not that there is nothing to verify',
      async (role) => {
        const proxy = QuestGetQaChecklistResponderProxy();
        const item = OperationItemStub({ id: OP_ID, role });
        const quest = QuestStub({
          flows: [FlowStub({ id: 'a-flow', name: 'A Flow', nodes: [], edges: [] })],
          operations: [item],
        });
        proxy.setupQuestFound({ quest });

        const result = await proxy.callResponder({
          questId: quest.id,
          operationItemId: String(item.id),
        });

        expect(result).toStrictEqual({
          success: true,
          data: "That operation item's role has no sign-off track, so no checklist measures it. What it must do is stated in its own prompt and its Operation Context. There is no tool to hunt for.",
        });
      },
    );

    it('EMPTY: {unknown flowId} => points the caller at the unfiltered call', async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      const quest = QuestStub({
        flows: [FlowStub({ id: 'a-flow', name: 'A Flow', nodes: [], edges: [] })],
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id, flowId: 'no-such-flow' });

      expect(result).toStrictEqual({
        success: true,
        data: 'No flow `no-such-flow` on this quest. Call get-qa-checklist with no flowId to list every flow that does exist.',
      });
    });
  });

  describe('failures', () => {
    it('ERROR: {quest not found} => returns success false naming the missing quest', async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      proxy.setupQuestNotFound();

      const result = await proxy.callResponder({ questId: 'nonexistent' });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest with id "nonexistent" not found in any guild',
      });
    });
  });
});

import { FlowStub, QuestQaLedgerEntryStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { qaChecklistBuildTransformer } from '../../../transformers/qa-checklist-build/qa-checklist-build-transformer';
import { qaChecklistToTextTransformer } from '../../../transformers/qa-checklist-to-text/qa-checklist-to-text-transformer';
import { QuestGetQaChecklistResponderProxy } from './quest-get-qa-checklist-responder.proxy';

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
          checklist: qaChecklistBuildTransformer({ flow, ledger: [] }),
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
            checklist: qaChecklistBuildTransformer({ flow: first, ledger: [] }),
          }),
          qaChecklistToTextTransformer({
            checklist: qaChecklistBuildTransformer({ flow: second, ledger: [] }),
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
          checklist: qaChecklistBuildTransformer({ flow: second, ledger: [] }),
        }),
      });
    });

    it('VALID: {ledger disposition} => the rendered coverage reflects the persisted ledger', async () => {
      const proxy = QuestGetQaChecklistResponderProxy();
      const flow = FlowStub({
        id: 'a-flow',
        name: 'A Flow',
        nodes: [{ id: 'a-node', label: 'A node', type: 'state', observables: [] }],
        edges: [],
      });
      const ledger = [QuestQaLedgerEntryStub({ itemId: 'a-flow:terminal:a-node' })];
      const quest = QuestStub({
        flows: [flow],
        planningNotes: { blightReports: [], qaLedger: ledger },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result).toStrictEqual({
        success: true,
        data: qaChecklistToTextTransformer({
          checklist: qaChecklistBuildTransformer({ flow, ledger }),
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
      const quest = QuestStub({ flows: [runtime, operational] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id, track: 'flowrider' });

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
      const quest = QuestStub({ flows: [runtime, operational] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id, track: 'siegemaster' });

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

    it("EMPTY: {track: 'flowrider', every flow operational} => says the flowrider track has nothing to walk, not that the quest has no flows", async () => {
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
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id, track: 'flowrider' });

      expect(result).toStrictEqual({
        success: true,
        data: 'This quest has no runtime flows, so the flowrider track has nothing to walk. That is a real state, not an error — operational flows are verified by Siegemaster checking their end state, never by a flow-perspective suite. Your gate still binds and it yields zero units, so commit the record and signal done.',
      });
    });

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

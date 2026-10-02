import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';
import { UnitObservationStub } from '@dungeonmaster/shared/contracts/unit-observation/unit-observation.stub';

import { questLoadBroker } from './quest-load-broker';
import { questLoadBrokerProxy } from './quest-load-broker.proxy';

describe('questLoadBroker', () => {
  describe('quest found with flows', () => {
    it('VALID: {quest with two flows} => returns both, in file order', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'two-flow-quest' });
      const flowOne = FlowStub({
        id: 'flow-one',
        name: 'Flow One',
        entryPoint: '/flow-one',
        exitPoints: ['/flow-one-exit'],
      });
      const flowTwo = FlowStub({
        id: 'flow-two',
        name: 'Flow Two',
        entryPoint: '/flow-two',
        exitPoints: ['/flow-two-exit'],
      });
      proxy.setupQuest({ questId, questJson: { flows: [flowOne, flowTwo] } });

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({ flows: [flowOne, flowTwo], workItems: [] });
    });

    it('VALID: {flow carrying nodes, edges and observables} => nested shape survives intact', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'nested-shape-quest' });
      const observable = FlowObservableStub({
        id: 'login-redirects-to-dashboard',
        package: 'auth-service',
      });
      const node = FlowNodeStub({ id: 'login-page', observables: [observable] });
      const edge = FlowEdgeStub({ id: 'login-to-dashboard', from: 'login-page', to: 'dashboard' });
      const flow = FlowStub({ id: 'nested-flow', nodes: [node], edges: [edge] });
      proxy.setupQuest({ questId, questJson: { flows: [flow] } });

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({ flows: [flow], workItems: [] });
    });
  });

  describe('quest found with work items', () => {
    it('VALID: {quest with one work item carrying an observation} => returns it alongside the flows', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'work-item-quest' });
      const flow = FlowStub({ id: 'solo-flow' });
      const workItem = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        observations: [UnitObservationStub({ unitId: 'solo-flow:observable:obs-a' })],
      });
      proxy.setupQuest({ questId, questJson: { flows: [flow], workItems: [workItem] } });

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({ flows: [flow], workItems: [workItem] });
    });
  });

  describe('quest not found', () => {
    it('EMPTY: {questFindBroker finds nothing} => returns [], and the file is never read', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'ghost-quest' });
      proxy.setupMissingQuest();

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({ flows: [], workItems: [] });
    });
  });

  describe('quest document missing usable flows', () => {
    it('EMPTY: {quest document has no flows key} => returns []', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'no-flows-key-quest' });
      proxy.setupQuest({ questId, questJson: { someOtherField: 'value' } });

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({ flows: [], workItems: [] });
    });

    it('EMPTY: {flows is an empty array} => returns []', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'empty-flows-quest' });
      proxy.setupQuest({ questId, questJson: { flows: [] } });

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({ flows: [], workItems: [] });
    });
  });

  describe('quest document missing usable work items', () => {
    it('EMPTY: {quest document has no workItems key} => flows still load, workItems is []', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'no-work-items-key-quest' });
      const flow = FlowStub({ id: 'flow-alone' });
      proxy.setupQuest({ questId, questJson: { flows: [flow] } });

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({ flows: [flow], workItems: [] });
    });

    it('EDGE: {a workItems entry fails the contract} => flows still load, workItems is []', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-work-item-entry-quest' });
      const flow = FlowStub({ id: 'flow-alone' });
      proxy.setupQuest({
        questId,
        questJson: { flows: [flow], workItems: [{ id: 'incomplete-work-item' }] },
      });

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({ flows: [flow], workItems: [] });
    });
  });

  describe('unparsable or invalid quest content', () => {
    it('EDGE: {file is not valid JSON} => returns [], no throw', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-json-quest' });
      proxy.setupQuestRawContent({ questId, content: '{ this is not json' });

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({ flows: [], workItems: [] });
    });

    it('INVALID: {a flows entry fails the contract} => throws naming the parse reason', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-flow-entry-quest' });
      proxy.setupQuest({ questId, questJson: { flows: [{ id: 'incomplete-flow' }] } });

      await expect(questLoadBroker({ questId, startDir: '/repo' })).rejects.toThrow(
        /Failed to parse flows for quest invalid-flow-entry-quest/u,
      );
    });

    it('VALID: {quest flows carrying retired sign-off keys on flow nodes} => successfully loads flows with retired keys stripped', async () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'retired-keys-quest' });
      const legacyNode = FlowNodeStub({
        id: 'legacy-node',
        label: 'Legacy Node',
        type: 'state',
        packages: ['auth-service'],
        observables: [],
      });
      const nodeWithRetiredKeys = Object.assign(
        FlowNodeStub({
          id: 'legacy-node',
          label: 'Legacy Node',
          type: 'state',
          packages: ['auth-service'],
          observables: [],
        }),
        {
          codeweaverSignoff: { signed: true },
          flowriderSignoff: 'approved',
          siegemasterSignoff: 123,
        },
      );
      const flowWithRetiredKeys = FlowStub({
        id: 'flow-with-retired-keys',
        nodes: [nodeWithRetiredKeys],
      });
      proxy.setupQuest({ questId, questJson: { flows: [flowWithRetiredKeys] } });

      const result = await questLoadBroker({ questId, startDir: '/repo' });

      expect(result).toStrictEqual({
        flows: [
          FlowStub({
            id: 'flow-with-retired-keys',
            nodes: [legacyNode],
          }),
        ],
        workItems: [],
      });
    });
  });
});

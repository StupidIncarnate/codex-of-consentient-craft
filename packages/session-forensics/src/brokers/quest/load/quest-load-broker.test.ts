import {
  QuestIdStub,
  FlowStub,
  FlowNodeStub,
  FlowEdgeStub,
  FlowObservableStub,
  WorkItemStub,
  UnitObservationStub,
} from '@dungeonmaster/shared/contracts';

import { questLoadBroker } from './quest-load-broker';
import { questLoadBrokerProxy } from './quest-load-broker.proxy';

describe('questLoadBroker', () => {
  describe('quest found with flows', () => {
    it('VALID: {quest with two flows} => returns both, in file order', () => {
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

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [flowOne, flowTwo], workItems: [] });
    });

    it('VALID: {flow carrying nodes, edges and observables} => nested shape survives intact', () => {
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

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [flow], workItems: [] });
    });
  });

  describe('quest found with work items', () => {
    it('VALID: {quest with one work item carrying an observation} => returns it alongside the flows', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'work-item-quest' });
      const flow = FlowStub({ id: 'solo-flow' });
      const workItem = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        observations: [UnitObservationStub({ unitId: 'solo-flow:observable:obs-a' })],
      });
      proxy.setupQuest({ questId, questJson: { flows: [flow], workItems: [workItem] } });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [flow], workItems: [workItem] });
    });
  });

  describe('quest not found', () => {
    it('EMPTY: {questFindBroker finds nothing} => returns [], and the file is never read', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'ghost-quest' });
      proxy.setupMissingQuest();

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [], workItems: [] });
    });
  });

  describe('quest document missing usable flows', () => {
    it('EMPTY: {quest document has no flows key} => returns []', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'no-flows-key-quest' });
      proxy.setupQuest({ questId, questJson: { someOtherField: 'value' } });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [], workItems: [] });
    });

    it('EMPTY: {flows is an empty array} => returns []', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'empty-flows-quest' });
      proxy.setupQuest({ questId, questJson: { flows: [] } });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [], workItems: [] });
    });
  });

  describe('quest document missing usable work items', () => {
    it('EMPTY: {quest document has no workItems key} => flows still load, workItems is []', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'no-work-items-key-quest' });
      const flow = FlowStub({ id: 'flow-alone' });
      proxy.setupQuest({ questId, questJson: { flows: [flow] } });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [flow], workItems: [] });
    });

    it('EDGE: {a workItems entry fails the contract} => flows still load, workItems is []', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-work-item-entry-quest' });
      const flow = FlowStub({ id: 'flow-alone' });
      proxy.setupQuest({
        questId,
        questJson: { flows: [flow], workItems: [{ id: 'incomplete-work-item' }] },
      });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [flow], workItems: [] });
    });
  });

  describe('unparsable or invalid quest content', () => {
    it('EDGE: {file is not valid JSON} => returns [], no throw', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-json-quest' });
      proxy.setupQuestRawContent({ questId, content: '{ this is not json' });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [], workItems: [] });
    });

    it('EDGE: {a flows entry fails the contract} => returns [], no throw', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-flow-entry-quest' });
      proxy.setupQuest({ questId, questJson: { flows: [{ id: 'incomplete-flow' }] } });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual({ flows: [], workItems: [] });
    });
  });
});

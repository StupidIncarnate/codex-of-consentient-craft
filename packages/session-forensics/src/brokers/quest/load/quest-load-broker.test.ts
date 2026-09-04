import {
  QuestIdStub,
  FlowStub,
  FlowNodeStub,
  FlowEdgeStub,
  FlowObservableStub,
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

      expect(result).toStrictEqual([flowOne, flowTwo]);
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

      expect(result).toStrictEqual([flow]);
    });
  });

  describe('quest not found', () => {
    it('EMPTY: {questFindBroker finds nothing} => returns [], and the file is never read', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'ghost-quest' });
      proxy.setupMissingQuest();

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('quest document missing usable flows', () => {
    it('EMPTY: {quest document has no flows key} => returns []', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'no-flows-key-quest' });
      proxy.setupQuest({ questId, questJson: { someOtherField: 'value' } });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {flows is an empty array} => returns []', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'empty-flows-quest' });
      proxy.setupQuest({ questId, questJson: { flows: [] } });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unparsable or invalid quest content', () => {
    it('EDGE: {file is not valid JSON} => returns [], no throw', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-json-quest' });
      proxy.setupQuestRawContent({ questId, content: '{ this is not json' });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {a flows entry fails the contract} => returns [], no throw', () => {
      const proxy = questLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-flow-entry-quest' });
      proxy.setupQuest({ questId, questJson: { flows: [{ id: 'incomplete-flow' }] } });

      const result = questLoadBroker({ questId });

      expect(result).toStrictEqual([]);
    });
  });
});

import {
  DependencyStepStub,
  ExecutionLogEntryStub,
  ObservableIdStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { resolveSiegemasterLayerBroker } from './resolve-siegemaster-layer-broker';
import { resolveSiegemasterLayerBrokerProxy } from './resolve-siegemaster-layer-broker.proxy';

describe('resolveSiegemasterLayerBroker', () => {
  describe('no siegemaster entries', () => {
    it('VALID: {executionLog: []} => launch-siegemaster', () => {
      resolveSiegemasterLayerBrokerProxy();
      const quest = QuestStub({ executionLog: [] });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-siegemaster' });
    });
  });

  describe('max failures reached', () => {
    it('VALID: {2 siegemaster failures} => blocked', () => {
      resolveSiegemasterLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'blocked', context: 'Siegemaster failed 2 times' });
    });
  });

  describe('last entry is pass and invalidated', () => {
    it('VALID: {siegemaster pass then ward ran} => launch-siegemaster', () => {
      resolveSiegemasterLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({ agentType: 'ward', timestamp: '2024-01-15T11:00:00.000Z' }),
        ],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-siegemaster' });
    });
  });

  describe('last entry is fail with failed observables mapping to steps', () => {
    it('VALID: {siegemaster fail with matching observables} => launch-codeweaver with resetStepIds', () => {
      resolveSiegemasterLayerBrokerProxy();
      const observableId = ObservableIdStub({ value: 'obs-login-redirect' });
      const stepId = StepIdStub({ value: 'step-login' });
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
            failedObservableIds: [observableId],
          }),
        ],
        steps: [DependencyStepStub({ id: stepId, observablesSatisfied: [observableId] })],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver', resetStepIds: [stepId] });
    });
  });

  describe('last entry is fail with no matching observables', () => {
    it('VALID: {siegemaster fail, no matching steps} => launch-codeweaver without resetStepIds', () => {
      resolveSiegemasterLayerBrokerProxy();
      const observableId = ObservableIdStub({ value: 'obs-unmatched' });
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
            failedObservableIds: [observableId],
          }),
        ],
        steps: [DependencyStepStub({ observablesSatisfied: [] })],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });
  });

  describe('last entry is fail with empty failedObservableIds', () => {
    it('EDGE: {siegemaster fail with empty failedObservableIds} => launch-codeweaver without resetStepIds', () => {
      resolveSiegemasterLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
            failedObservableIds: [],
          }),
        ],
        steps: [DependencyStepStub()],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });
  });

  describe('last entry is pass and not invalidated', () => {
    it('VALID: {siegemaster pass, no ward after} => undefined', () => {
      resolveSiegemasterLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({ agentType: 'ward', timestamp: '2024-01-15T09:00:00.000Z' }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toBeUndefined();
    });
  });

  describe('multi-entry ordering', () => {
    it('VALID: {siegemaster fail then siegemaster pass} => lastEntry is pass, returns undefined', () => {
      resolveSiegemasterLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toBeUndefined();
    });

    it('VALID: {siegemaster pass then siegemaster fail} => lastEntry is fail, returns launch-codeweaver', () => {
      resolveSiegemasterLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });
  });

  describe('fail count resets after codeweaver pass', () => {
    it('VALID: {1 siege fail, codeweaver pass, 1 siege fail} => launch-codeweaver (not blocked)', () => {
      resolveSiegemasterLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'codeweaver',
            status: 'pass',
            outcome: 'pass',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });
  });

  describe('last entry has no status', () => {
    it('VALID: {siegemaster entry without status} => launch-siegemaster', () => {
      resolveSiegemasterLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });

      const result = resolveSiegemasterLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-siegemaster' });
    });
  });
});

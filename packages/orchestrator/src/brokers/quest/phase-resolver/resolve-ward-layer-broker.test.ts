import { ExecutionLogEntryStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { resolveWardLayerBroker } from './resolve-ward-layer-broker';
import { resolveWardLayerBrokerProxy } from './resolve-ward-layer-broker.proxy';

describe('resolveWardLayerBroker', () => {
  describe('no ward entries', () => {
    it('VALID: {executionLog: []} => launch-ward', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({ executionLog: [] });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });
  });

  describe('max failures reached', () => {
    it('VALID: {3 ward failures} => blocked', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
        ],
      });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'blocked', context: 'Ward failed 3 times' });
    });
  });

  describe('last entry is fail (under limit)', () => {
    it('VALID: {1 ward failure} => launch-ward', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });

    it('EDGE: {2 ward failures, under limit of 3} => launch-ward', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });
  });

  describe('last entry is pass and invalidated', () => {
    it('VALID: {ward pass then codeweaver ran} => launch-ward', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({ agentType: 'codeweaver', timestamp: '2024-01-15T11:00:00.000Z' }),
        ],
      });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });
  });

  describe('last entry is pass and not invalidated', () => {
    it('VALID: {ward pass, no codeweaver after} => undefined', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({ agentType: 'codeweaver', timestamp: '2024-01-15T09:00:00.000Z' }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toBeUndefined();
    });
  });

  describe('multi-entry ordering', () => {
    it('VALID: {ward fail then ward pass} => lastEntry is pass, returns undefined', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toBeUndefined();
    });

    it('VALID: {ward pass then ward fail} => lastEntry is fail, returns launch-ward', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });
  });

  describe('fail count resets after codeweaver pass', () => {
    it('VALID: {2 ward fails, codeweaver pass, 1 ward fail} => launch-ward (not blocked)', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'codeweaver',
            status: 'pass',
            outcome: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            outcome: 'fail',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
        ],
      });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });
  });

  describe('last entry has no status', () => {
    it('VALID: {ward entry without status} => launch-ward', () => {
      resolveWardLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({ agentType: 'ward', timestamp: '2024-01-15T10:00:00.000Z' }),
        ],
      });

      const result = resolveWardLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });
  });
});

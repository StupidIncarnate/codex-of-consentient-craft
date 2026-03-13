import { ExecutionLogEntryStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { resolveLawbringerLayerBroker } from './resolve-lawbringer-layer-broker';
import { resolveLawbringerLayerBrokerProxy } from './resolve-lawbringer-layer-broker.proxy';

describe('resolveLawbringerLayerBroker', () => {
  describe('no lawbringer entries', () => {
    it('VALID: {executionLog: []} => launch-lawbringer', () => {
      resolveLawbringerLayerBrokerProxy();
      const quest = QuestStub({ executionLog: [] });

      const result = resolveLawbringerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });
  });

  describe('max failures reached', () => {
    it('VALID: {2 lawbringer failures} => blocked', () => {
      resolveLawbringerLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'fail',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = resolveLawbringerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'blocked', context: 'Lawbringer failed 2 times' });
    });
  });

  describe('last entry is pass and invalidated', () => {
    it('VALID: {lawbringer pass then siegemaster ran} => launch-lawbringer', () => {
      resolveLawbringerLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = resolveLawbringerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });
  });

  describe('last entry is fail (under limit)', () => {
    it('VALID: {1 lawbringer failure} => launch-lawbringer', () => {
      resolveLawbringerLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'fail',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });

      const result = resolveLawbringerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });
  });

  describe('last entry is pass and not invalidated', () => {
    it('VALID: {lawbringer pass, no siegemaster after} => undefined', () => {
      resolveLawbringerLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            timestamp: '2024-01-15T09:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });

      const result = resolveLawbringerLayerBroker({ quest });

      expect(result).toBeUndefined();
    });
  });

  describe('last entry has no status', () => {
    it('VALID: {lawbringer entry without status} => launch-lawbringer', () => {
      resolveLawbringerLayerBrokerProxy();
      const quest = QuestStub({
        executionLog: [
          ExecutionLogEntryStub({ agentType: 'lawbringer', timestamp: '2024-01-15T10:00:00.000Z' }),
        ],
      });

      const result = resolveLawbringerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });
  });
});

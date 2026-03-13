import {
  DependencyStepStub,
  ExecutionLogEntryStub,
  PathseekerRunStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { resolveInProgressLayerBroker } from './resolve-in-progress-layer-broker';
import { resolveInProgressLayerBrokerProxy } from './resolve-in-progress-layer-broker.proxy';

describe('resolveInProgressLayerBroker', () => {
  describe('pathseeker not done', () => {
    it('VALID: {no pathseeker runs} => launch-pathseeker', () => {
      resolveInProgressLayerBrokerProxy();
      const quest = QuestStub({ pathseekerRuns: [] });

      const result = resolveInProgressLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-pathseeker' });
    });
  });

  describe('pathseeker done, codeweaver needed', () => {
    it('VALID: {pathseeker complete, pending steps} => launch-codeweaver', () => {
      resolveInProgressLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'complete' })],
        steps: [DependencyStepStub({ status: 'pending' })],
      });

      const result = resolveInProgressLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });
  });

  describe('pathseeker done, codeweaver done, ward needed', () => {
    it('VALID: {pathseeker complete, all steps complete, no ward entry} => launch-ward', () => {
      resolveInProgressLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'complete' })],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [],
      });

      const result = resolveInProgressLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });
  });

  describe('all phases pass, siegemaster needed', () => {
    it('VALID: {ward pass, no siegemaster entry} => launch-siegemaster', () => {
      resolveInProgressLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'complete' })],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });

      const result = resolveInProgressLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-siegemaster' });
    });
  });

  describe('all phases pass, lawbringer needed', () => {
    it('VALID: {ward pass, siegemaster pass, no lawbringer entry} => launch-lawbringer', () => {
      resolveInProgressLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'complete' })],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = resolveInProgressLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });
  });

  describe('all phases complete', () => {
    it('VALID: {all phases pass} => complete', () => {
      resolveInProgressLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'complete' })],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T10:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T11:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
        ],
      });

      const result = resolveInProgressLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'complete' });
    });
  });
});

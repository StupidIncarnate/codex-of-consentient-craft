import { PathseekerRunStub, QuestStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { resolvePathseekerLayerBroker } from './resolve-pathseeker-layer-broker';
import { resolvePathseekerLayerBrokerProxy } from './resolve-pathseeker-layer-broker.proxy';

describe('resolvePathseekerLayerBroker', () => {
  describe('no runs', () => {
    it('VALID: {pathseekerRuns: []} => launch-pathseeker', () => {
      resolvePathseekerLayerBrokerProxy();
      const quest = QuestStub({ pathseekerRuns: [] });

      const result = resolvePathseekerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-pathseeker' });
    });
  });

  describe('last run complete', () => {
    it('VALID: {lastRun.status: complete} => undefined', () => {
      resolvePathseekerLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'complete' })],
      });

      const result = resolvePathseekerLayerBroker({ quest });

      expect(result).toBeUndefined();
    });
  });

  describe('last run in_progress', () => {
    it('VALID: {lastRun.status: in_progress, no sessionId} => launch-pathseeker', () => {
      resolvePathseekerLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'in_progress' })],
      });

      const result = resolvePathseekerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-pathseeker' });
    });

    it('VALID: {lastRun.status: in_progress, with sessionId} => resume-pathseeker', () => {
      resolvePathseekerLayerBrokerProxy();
      const sessionId = SessionIdStub({ value: 'ps-session-1' });
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'in_progress', sessionId })],
      });

      const result = resolvePathseekerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'resume-pathseeker', resumeSessionId: sessionId });
    });
  });

  describe('verification_failed with retries remaining', () => {
    it('VALID: {lastRun.status: verification_failed, 1 run} => launch-pathseeker', () => {
      resolvePathseekerLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'verification_failed' })],
      });

      const result = resolvePathseekerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-pathseeker' });
    });

    it('VALID: {lastRun.status: verification_failed, 2 runs} => launch-pathseeker', () => {
      resolvePathseekerLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [
          PathseekerRunStub({ status: 'verification_failed', attempt: 0 }),
          PathseekerRunStub({ status: 'verification_failed', attempt: 1 }),
        ],
      });

      const result = resolvePathseekerLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-pathseeker' });
    });
  });

  describe('max attempts reached', () => {
    it('VALID: {lastRun.status: verification_failed, 3 runs} => blocked', () => {
      resolvePathseekerLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [
          PathseekerRunStub({ status: 'verification_failed', attempt: 0 }),
          PathseekerRunStub({ status: 'verification_failed', attempt: 1 }),
          PathseekerRunStub({ status: 'verification_failed', attempt: 2 }),
        ],
      });

      const result = resolvePathseekerLayerBroker({ quest });

      expect(result).toStrictEqual({
        action: 'blocked',
        context: 'PathSeeker failed after maximum attempts',
      });
    });
  });

  describe('last run failed', () => {
    it('VALID: {lastRun.status: failed} => blocked', () => {
      resolvePathseekerLayerBrokerProxy();
      const quest = QuestStub({
        pathseekerRuns: [PathseekerRunStub({ status: 'failed' })],
      });

      const result = resolvePathseekerLayerBroker({ quest });

      expect(result).toStrictEqual({
        action: 'blocked',
        context: 'PathSeeker failed after maximum attempts',
      });
    });
  });
});

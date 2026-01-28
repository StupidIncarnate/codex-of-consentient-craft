import { UserInputStub, QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { CallbackKeyStub } from '../../contracts/callback-key/callback-key.stub';
import { DebugSessionCallbackInvocationsStub } from '../../contracts/debug-session-callback-invocations/debug-session-callback-invocations.stub';

import { buildCallbacksRecordTransformer } from './build-callbacks-record-transformer';

type CallbackKey = ReturnType<typeof CallbackKeyStub>;
type DebugSessionCallbackInvocations = ReturnType<typeof DebugSessionCallbackInvocationsStub>;
type QuestFolder = DebugSessionCallbackInvocations['onRunQuest'][0]['questFolder'];

describe('buildCallbacksRecordTransformer', () => {
  describe('empty invocations', () => {
    it('EMPTY: {all arrays empty} => returns undefined', () => {
      const invocations = DebugSessionCallbackInvocationsStub();

      const result = buildCallbacksRecordTransformer({ invocations });

      expect(result).toBeUndefined();
    });
  });

  describe('with invocations', () => {
    it('VALID: {onSpawnChaoswhisperer invocation} => returns record with onSpawnChaoswhisperer', () => {
      const userInput = UserInputStub({ value: 'test input' });
      const invocations = DebugSessionCallbackInvocationsStub({
        onSpawnChaoswhisperer: [{ userInput }],
      });

      const result = buildCallbacksRecordTransformer({ invocations });

      expect(result).toStrictEqual({
        [CallbackKeyStub({ value: 'onSpawnChaoswhisperer' })]: [{ userInput }],
      } as Record<CallbackKey, unknown[]>);
    });

    it('VALID: {onExit invocation} => returns record with onExit', () => {
      const invocations = DebugSessionCallbackInvocationsStub({
        onExit: [{}],
      });

      const result = buildCallbacksRecordTransformer({ invocations });

      expect(result).toStrictEqual({
        [CallbackKeyStub({ value: 'onExit' })]: [{}],
      } as Record<CallbackKey, unknown[]>);
    });

    it('VALID: {multiple invocation types} => returns record with all', () => {
      const userInput = UserInputStub({ value: 'test input' });
      const questId = QuestIdStub({ value: 'quest-123' });
      const questFolder = 'folder' as QuestFolder;
      const invocations = DebugSessionCallbackInvocationsStub({
        onSpawnChaoswhisperer: [{ userInput }],
        onRunQuest: [{ questId, questFolder }],
      });

      const result = buildCallbacksRecordTransformer({ invocations });

      expect(result).toStrictEqual({
        [CallbackKeyStub({ value: 'onSpawnChaoswhisperer' })]: [{ userInput }],
        [CallbackKeyStub({ value: 'onRunQuest' })]: [{ questId, questFolder }],
      } as Record<CallbackKey, unknown[]>);
    });

    it('VALID: {onResumeChaoswhisperer invocation} => returns record with onResumeChaoswhisperer', () => {
      const answer = UserInputStub({ value: 'user answer' });
      const sessionId = SessionIdStub({ value: 'session-456' });
      const invocations = DebugSessionCallbackInvocationsStub({
        onResumeChaoswhisperer: [{ answer, sessionId }],
      });

      const result = buildCallbacksRecordTransformer({ invocations });

      expect(result).toStrictEqual({
        [CallbackKeyStub({ value: 'onResumeChaoswhisperer' })]: [{ answer, sessionId }],
      } as Record<CallbackKey, unknown[]>);
    });
  });
});

import { QuestIdStub } from '@dungeonmaster/shared/contracts';

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
    it('VALID: {onRunQuest invocation} => returns record with onRunQuest', () => {
      const questId = QuestIdStub({ value: 'quest-123' });
      const questFolder = 'folder' as QuestFolder;
      const invocations = DebugSessionCallbackInvocationsStub({
        onRunQuest: [{ questId, questFolder }],
      });

      const result = buildCallbacksRecordTransformer({ invocations });

      expect(result).toStrictEqual({
        [CallbackKeyStub({ value: 'onRunQuest' })]: [{ questId, questFolder }],
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
      const questId = QuestIdStub({ value: 'quest-123' });
      const questFolder = 'folder' as QuestFolder;
      const invocations = DebugSessionCallbackInvocationsStub({
        onRunQuest: [{ questId, questFolder }],
        onExit: [{}],
      });

      const result = buildCallbacksRecordTransformer({ invocations });

      expect(result).toStrictEqual({
        [CallbackKeyStub({ value: 'onRunQuest' })]: [{ questId, questFolder }],
        [CallbackKeyStub({ value: 'onExit' })]: [{}],
      } as Record<CallbackKey, unknown[]>);
    });
  });
});

import {
  UserInputStub,
  SessionIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { debugSessionCallbackInvocationsContract } from './debug-session-callback-invocations-contract';
import { DebugSessionCallbackInvocationsStub } from './debug-session-callback-invocations.stub';

type DebugSessionCallbackInvocations = ReturnType<typeof DebugSessionCallbackInvocationsStub>;

describe('debugSessionCallbackInvocationsContract', () => {
  describe('valid input', () => {
    it('VALID: {empty arrays} => parses successfully', () => {
      const input = DebugSessionCallbackInvocationsStub();

      const result = debugSessionCallbackInvocationsContract.parse(input);

      expect(result).toStrictEqual({
        onSpawnChaoswhisperer: [],
        onResumeChaoswhisperer: [],
        onRunQuest: [],
        onExit: [],
      } satisfies DebugSessionCallbackInvocations);
    });

    it('VALID: {with onSpawnChaoswhisperer invocation} => parses with data', () => {
      const userInput = UserInputStub({ value: 'test input' });
      const input = DebugSessionCallbackInvocationsStub({
        onSpawnChaoswhisperer: [{ userInput }],
      });

      const result = debugSessionCallbackInvocationsContract.parse(input);

      expect(result).toStrictEqual({
        onSpawnChaoswhisperer: [{ userInput }],
        onResumeChaoswhisperer: [],
        onRunQuest: [],
        onExit: [],
      } satisfies DebugSessionCallbackInvocations);
    });

    it('VALID: {with onResumeChaoswhisperer invocation} => parses with data', () => {
      const answer = UserInputStub({ value: 'answer text' });
      const sessionId = SessionIdStub({ value: 'abc123' });
      const input = DebugSessionCallbackInvocationsStub({
        onResumeChaoswhisperer: [{ answer, sessionId }],
      });

      const result = debugSessionCallbackInvocationsContract.parse(input);

      expect(result).toStrictEqual({
        onSpawnChaoswhisperer: [],
        onResumeChaoswhisperer: [{ answer, sessionId }],
        onRunQuest: [],
        onExit: [],
      } satisfies DebugSessionCallbackInvocations);
    });

    it('VALID: {with onRunQuest invocation} => parses with data', () => {
      const questId = QuestIdStub({ value: 'quest-123' });
      const { folder: questFolder } = QuestStub();
      const input = DebugSessionCallbackInvocationsStub({
        onRunQuest: [{ questId, questFolder }],
      });

      const result = debugSessionCallbackInvocationsContract.parse(input);

      expect(result).toStrictEqual({
        onSpawnChaoswhisperer: [],
        onResumeChaoswhisperer: [],
        onRunQuest: [{ questId, questFolder }],
        onExit: [],
      } satisfies DebugSessionCallbackInvocations);
    });

    it('VALID: {with onExit invocation} => parses with data', () => {
      const input = DebugSessionCallbackInvocationsStub({
        onExit: [{}],
      });

      const result = debugSessionCallbackInvocationsContract.parse(input);

      expect(result).toStrictEqual({
        onSpawnChaoswhisperer: [],
        onResumeChaoswhisperer: [],
        onRunQuest: [],
        onExit: [{}],
      } satisfies DebugSessionCallbackInvocations);
    });
  });
});

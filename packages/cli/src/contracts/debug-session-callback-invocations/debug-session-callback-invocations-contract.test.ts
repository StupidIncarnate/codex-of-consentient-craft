import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { debugSessionCallbackInvocationsContract } from './debug-session-callback-invocations-contract';
import { DebugSessionCallbackInvocationsStub } from './debug-session-callback-invocations.stub';

type DebugSessionCallbackInvocations = ReturnType<typeof DebugSessionCallbackInvocationsStub>;

describe('debugSessionCallbackInvocationsContract', () => {
  describe('valid input', () => {
    it('VALID: {empty arrays} => parses successfully', () => {
      const input = DebugSessionCallbackInvocationsStub();

      const result = debugSessionCallbackInvocationsContract.parse(input);

      expect(result).toStrictEqual({
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
        onRunQuest: [],
        onExit: [{}],
      } satisfies DebugSessionCallbackInvocations);
    });
  });
});

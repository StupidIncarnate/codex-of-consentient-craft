import { SessionIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { AgentSpawnStreamingResultStub } from '../agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { SlotIndexStub } from '../slot-index/slot-index.stub';
import { activeAgentContract } from './active-agent-contract';

describe('activeAgentContract', () => {
  describe('valid values', () => {
    it('VALID: {complete agent data} => parses successfully', () => {
      const slotIndex = SlotIndexStub();
      const stepId = StepIdStub();
      const sessionId = SessionIdStub();
      const agentResult = AgentSpawnStreamingResultStub();
      const promise = Promise.resolve(agentResult);

      const result = activeAgentContract.parse({
        slotIndex,
        stepId,
        sessionId,
        promise,
      });

      expect(result).toStrictEqual({
        slotIndex,
        stepId,
        sessionId,
        promise,
      });
    });

    it('VALID: {sessionId: null} => parses with null sessionId', () => {
      const slotIndex = SlotIndexStub();
      const stepId = StepIdStub();
      const agentResult = AgentSpawnStreamingResultStub();
      const promise = Promise.resolve(agentResult);

      const result = activeAgentContract.parse({
        slotIndex,
        stepId,
        sessionId: null,
        promise,
      });

      expect(result).toStrictEqual({
        slotIndex,
        stepId,
        sessionId: null,
        promise,
      });
    });
  });

  describe('invalid values', () => {
    it('INVALID_SLOT_INDEX: {slotIndex: -1} => throws too_small', () => {
      const agentResult = AgentSpawnStreamingResultStub();

      expect(() =>
        activeAgentContract.parse({
          slotIndex: -1,
          stepId: StepIdStub(),
          sessionId: null,
          promise: Promise.resolve(agentResult),
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_STEP_ID: {stepId: "not-a-uuid"} => throws Invalid uuid', () => {
      const agentResult = AgentSpawnStreamingResultStub();

      expect(() =>
        activeAgentContract.parse({
          slotIndex: SlotIndexStub(),
          stepId: 'not-a-uuid',
          sessionId: null,
          promise: Promise.resolve(agentResult),
        }),
      ).toThrow(/Invalid uuid/u);
    });

    it('INVALID_SESSION_ID: {sessionId: ""} => throws too_small', () => {
      const agentResult = AgentSpawnStreamingResultStub();

      expect(() =>
        activeAgentContract.parse({
          slotIndex: SlotIndexStub(),
          stepId: StepIdStub(),
          sessionId: '',
          promise: Promise.resolve(agentResult),
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_PROMISE: {promise: "not-a-promise"} => throws Expected promise', () => {
      expect(() =>
        activeAgentContract.parse({
          slotIndex: SlotIndexStub(),
          stepId: StepIdStub(),
          sessionId: null,
          promise: 'not-a-promise' as never,
        }),
      ).toThrow(/Expected promise/u);
    });
  });
});

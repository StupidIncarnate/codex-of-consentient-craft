import { SessionIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { AgentSpawnStreamingResultStub } from '../agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { SlotIndexStub } from '../slot-index/slot-index.stub';
import { ActiveAgentStub } from './active-agent.stub';
import { activeAgentContract } from './active-agent-contract';

describe('activeAgentContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const result = activeAgentContract.parse({
        slotIndex: SlotIndexStub(),
        stepId: StepIdStub(),
        sessionId: SessionIdStub(),
        promise: Promise.resolve(AgentSpawnStreamingResultStub()),
      });

      expect(result.slotIndex).toBe(0);
    });

    it('VALID: {stub} => parses successfully', () => {
      const stub = ActiveAgentStub();

      expect(stub.slotIndex).toBe(0);
    });

    it('VALID: {nullable sessionId} => parses successfully', () => {
      const result = activeAgentContract.parse({
        slotIndex: SlotIndexStub(),
        stepId: StepIdStub(),
        sessionId: null,
        promise: Promise.resolve(AgentSpawnStreamingResultStub()),
      });

      expect(result.sessionId).toBeNull();
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing slotIndex} => throws error', () => {
      expect(() =>
        activeAgentContract.parse({
          stepId: StepIdStub(),
          sessionId: SessionIdStub(),
          promise: Promise.resolve(AgentSpawnStreamingResultStub()),
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing promise} => throws error', () => {
      expect(() =>
        activeAgentContract.parse({
          slotIndex: SlotIndexStub(),
          stepId: StepIdStub(),
          sessionId: SessionIdStub(),
        }),
      ).toThrow(/Required/u);
    });
  });
});

import { SessionIdStub } from '@dungeonmaster/shared/contracts';

import { AgentSpawnStreamingResultStub } from '../agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { SlotIndexStub } from '../slot-index/slot-index.stub';
import { WorkItemIdStub } from '../work-item-id/work-item-id.stub';
import { ActiveAgentStub } from './active-agent.stub';
import { activeAgentContract } from './active-agent-contract';

describe('activeAgentContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const result = activeAgentContract.parse({
        slotIndex: SlotIndexStub(),
        workItemId: WorkItemIdStub(),
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
        workItemId: WorkItemIdStub(),
        sessionId: null,
        promise: Promise.resolve(AgentSpawnStreamingResultStub()),
      });

      expect(result.sessionId).toBe(null);
    });

    it('VALID: {followupDepth omitted} => defaults to 0', () => {
      const result = activeAgentContract.parse({
        slotIndex: SlotIndexStub(),
        workItemId: WorkItemIdStub(),
        sessionId: SessionIdStub(),
        promise: Promise.resolve(AgentSpawnStreamingResultStub()),
      });

      expect(result.followupDepth).toBe(0);
    });

    it('VALID: {followupDepth: 3} => parses successfully', () => {
      const result = activeAgentContract.parse({
        slotIndex: SlotIndexStub(),
        workItemId: WorkItemIdStub(),
        sessionId: SessionIdStub(),
        followupDepth: 3,
        promise: Promise.resolve(AgentSpawnStreamingResultStub()),
      });

      expect(result.followupDepth).toBe(3);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing slotIndex} => throws error', () => {
      expect(() =>
        activeAgentContract.parse({
          workItemId: WorkItemIdStub(),
          sessionId: SessionIdStub(),
          promise: Promise.resolve(AgentSpawnStreamingResultStub()),
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing promise} => throws error', () => {
      expect(() =>
        activeAgentContract.parse({
          slotIndex: SlotIndexStub(),
          workItemId: WorkItemIdStub(),
          sessionId: SessionIdStub(),
        }),
      ).toThrow(/Required/u);
    });
  });
});

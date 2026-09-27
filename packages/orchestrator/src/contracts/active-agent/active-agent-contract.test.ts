import { SessionIdStub } from '@dungeonmaster/shared/contracts';

import { AgentSpawnStreamingResultStub } from '../agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { SlotIndexStub } from '@dungeonmaster/shared/contracts';
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

    it('VALID: {promise field} => passes through unvalidated and resolves to the real value', async () => {
      const streamingResult = AgentSpawnStreamingResultStub();
      const result = activeAgentContract.parse({
        slotIndex: SlotIndexStub(),
        workItemId: WorkItemIdStub(),
        sessionId: SessionIdStub(),
        promise: Promise.resolve(streamingResult),
      });

      await expect(result.promise).resolves.toStrictEqual(streamingResult);
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
      ).toThrow(/received undefined/u);
    });

    // `promise` lives outside the zod schema (see the contract's own header) — a missing one is not
    // a parse failure. Coverage for a call site's own actual dependency on the field belongs at that
    // call site, not here.
  });
});

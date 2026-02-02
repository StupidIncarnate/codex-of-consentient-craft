import { agentSlotContract } from './agent-slot-contract';
import { AgentSlotStub } from './agent-slot.stub';

type AgentSlot = ReturnType<typeof AgentSlotStub>;

describe('agentSlotContract', () => {
  it('VALID: agent slot object => parses successfully', () => {
    const result: AgentSlot = AgentSlotStub();
    const parsed = agentSlotContract.parse(result);

    expect(parsed.stepId).toBe(result.stepId);
    expect(parsed.sessionId).toBe(result.sessionId);
    expect(parsed.startedAt).toBe(result.startedAt);
    expect(typeof parsed.process.kill).toBe('function');
    expect(typeof parsed.process.waitForExit).toBe('function');
  });
});

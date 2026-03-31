import { subagentStartHookDataContract } from './subagent-start-hook-data-contract';
import { SubagentStartHookDataStub } from './subagent-start-hook-data.stub';

describe('subagentStartHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = SubagentStartHookDataStub();

    expect(result).toStrictEqual({
      hook_event_name: 'SubagentStart',
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: result.cwd,
      agent_id: 'agent-abc123',
      agent_type: 'Explore',
    });
  });

  it('VALID: {custom agent_type} => parses successfully', () => {
    const result = SubagentStartHookDataStub({ agent_type: 'Plan' });

    expect(result.agent_type).toBe('Plan');
  });

  it('VALID: {custom agent_id} => parses successfully', () => {
    const result = SubagentStartHookDataStub({ agent_id: 'agent-xyz789' });

    expect(result.agent_id).toBe('agent-xyz789');
  });

  describe('invalid input', () => {
    it('INVALID: {empty object} => throws validation error', () => {
      expect(() => {
        return subagentStartHookDataContract.parse({} as never);
      }).toThrow(/Required/u);
    });

    it('INVALID: {wrong hook_event_name} => throws validation error', () => {
      expect(() => {
        return subagentStartHookDataContract.parse({
          session_id: 'abc',
          transcript_path: '/tmp/t.jsonl',
          cwd: '/tmp',
          hook_event_name: 'SessionStart',
          agent_id: 'agent-1',
          agent_type: 'Explore',
        } as never);
      }).toThrow(/Invalid literal value/u);
    });
  });
});

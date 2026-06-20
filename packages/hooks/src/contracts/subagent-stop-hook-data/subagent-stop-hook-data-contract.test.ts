import { subagentStopHookDataContract } from './subagent-stop-hook-data-contract';
import { SubagentStopHookDataStub } from './subagent-stop-hook-data.stub';

describe('subagentStopHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = SubagentStopHookDataStub();

    expect(result).toStrictEqual({
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: '/tmp/stub-cwd',
      hook_event_name: 'SubagentStop',
    });
  });

  it('VALID: {stop_hook_active: true} => parses with the flag set', () => {
    const result = SubagentStopHookDataStub({ stop_hook_active: true });

    expect(result.stop_hook_active).toBe(true);
  });

  it('VALID: {agent_transcript_path set} => parses the sub-agent transcript path', () => {
    const result = SubagentStopHookDataStub({ agent_transcript_path: '/sub/agent-x.jsonl' });

    expect(result.agent_transcript_path).toBe('/sub/agent-x.jsonl');
  });

  it('INVALID: {hook_event_name: "Stop"} => fails the SubagentStop literal', () => {
    const result = subagentStopHookDataContract.safeParse({
      session_id: 'abc',
      transcript_path: '/tmp/t.jsonl',
      cwd: '/cwd',
      hook_event_name: 'Stop',
    });

    expect(result.success).toBe(false);
  });

  it('INVALID: {transcript_path: ""} => fails the min-length brand', () => {
    const result = subagentStopHookDataContract.safeParse({
      session_id: 'abc',
      transcript_path: '',
      cwd: '/cwd',
      hook_event_name: 'SubagentStop',
    });

    expect(result.success).toBe(false);
  });
});

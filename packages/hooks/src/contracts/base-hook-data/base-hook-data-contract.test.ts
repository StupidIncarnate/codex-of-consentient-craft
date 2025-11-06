import { BaseHookDataStub } from './base-hook-data.stub';

describe('baseHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = BaseHookDataStub();

    expect(result).toStrictEqual({
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: result.cwd,
      hook_event_name: 'PreToolUse',
    });
  });

  it('VALID: {custom session_id} => parses successfully', () => {
    const result = BaseHookDataStub({ session_id: 'custom-session-id' });

    expect(result.session_id).toBe('custom-session-id');
  });

  it('VALID: {custom hook_event_name} => parses successfully', () => {
    const result = BaseHookDataStub({ hook_event_name: 'PostToolUse' });

    expect(result.hook_event_name).toBe('PostToolUse');
  });
});

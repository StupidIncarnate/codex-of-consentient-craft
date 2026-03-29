import { sessionStartHookDataContract } from './session-start-hook-data-contract';
import { SessionStartHookStub } from './session-start-hook-data.stub';

describe('sessionStartHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = SessionStartHookStub();

    expect(result).toStrictEqual({
      hook_event_name: 'SessionStart',
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: result.cwd,
    });
  });

  it('VALID: {custom session_id} => parses successfully', () => {
    const result = SessionStartHookStub({ session_id: 'custom-id' });

    expect(result.session_id).toBe('custom-id');
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return sessionStartHookDataContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});

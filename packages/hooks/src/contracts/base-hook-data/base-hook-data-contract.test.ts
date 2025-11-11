import { baseHookDataContract } from './base-hook-data-contract';
import { BaseHookDataStub } from './base-hook-data.stub';

describe('baseHookDataContract', () => {
  describe('valid input', () => {
    it('VALID: {default values} => parses successfully', () => {
      const data = BaseHookDataStub();
      const result = baseHookDataContract.parse(data);

      expect(result).toStrictEqual({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: result.cwd,
        hook_event_name: 'PreToolUse',
      });
    });

    it('VALID: {custom session_id} => parses successfully', () => {
      const data = BaseHookDataStub({ session_id: 'custom-session-id' });
      const result = baseHookDataContract.parse(data);

      expect(result.session_id).toBe('custom-session-id');
    });

    it('VALID: {custom hook_event_name} => parses successfully', () => {
      const data = BaseHookDataStub({ hook_event_name: 'PostToolUse' });
      const result = baseHookDataContract.parse(data);

      expect(result.hook_event_name).toBe('PostToolUse');
    });
  });

  describe('invalid input', () => {
    it('INVALID_SESSION_ID: {session_id: number} => throws validation error', () => {
      expect(() => {
        return baseHookDataContract.parse({
          session_id: 123 as never,
          transcript_path: '/test',
          cwd: '/cwd',
          hook_event_name: 'PreToolUse',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_MISSING_CWD: {missing cwd} => throws validation error', () => {
      expect(() => {
        return baseHookDataContract.parse({
          session_id: 'test',
          transcript_path: '/test',
          hook_event_name: 'PreToolUse',
        } as never);
      }).toThrow(/Required/u);
    });
  });
});

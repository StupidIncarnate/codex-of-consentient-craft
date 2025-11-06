import { isSessionStartHookDataContract } from './is-session-start-hook-data.stub';
import { SessionStartHookStub } from '../session-start-hook-data/session-start-hook-data.stub';

describe('isSessionStartHookDataContract()', () => {
  describe('valid inputs', () => {
    it('VALID: {data: valid SessionStartHookData} => returns true', () => {
      const data = SessionStartHookStub({
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/current/working/directory',
      });
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(true);
    });

    it('VALID: {data: minimal valid SessionStartHookData} => returns true', () => {
      const data = SessionStartHookStub({
        session_id: 'abc',
        transcript_path: '/t',
        cwd: '/c',
      });
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(true);
    });

    it('VALID: {data: SessionStartHookData with extra fields} => returns true', () => {
      const data = {
        ...SessionStartHookStub({
          session_id: 'session456',
          transcript_path: '/path/to/transcript',
          cwd: '/cwd',
        }),
        extra_field: 'extra',
      };
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs - missing required fields', () => {
    it('INVALID: {data: missing session_id} => returns false', () => {
      const stub = SessionStartHookStub();
      const { session_id: _session_id, ...data } = stub;
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: missing transcript_path} => returns false', () => {
      const stub = SessionStartHookStub();
      const { transcript_path: _transcript_path, ...data } = stub;
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: missing cwd} => returns false', () => {
      const stub = SessionStartHookStub();
      const { cwd: _cwd, ...data } = stub;
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: missing hook_event_name} => returns false', () => {
      const stub = SessionStartHookStub();
      const { hook_event_name: _hook_event_name, ...data } = stub;
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - wrong hook_event_name', () => {
    it('INVALID: {data: hook_event_name is "PreToolUse"} => returns false', () => {
      const data = {
        ...SessionStartHookStub(),
        hook_event_name: 'PreToolUse' as 'SessionStart',
      };
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: hook_event_name is "PostToolUse"} => returns false', () => {
      const data = {
        ...SessionStartHookStub(),
        hook_event_name: 'PostToolUse' as 'SessionStart',
      };
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: hook_event_name is number} => returns false', () => {
      const data = {
        ...SessionStartHookStub(),
        hook_event_name: 123 as unknown as 'SessionStart',
      };
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - wrong types', () => {
    it('INVALID: {data: session_id is number} => returns false', () => {
      const data = {
        ...SessionStartHookStub(),
        session_id: 123 as unknown as string,
      };
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: transcript_path is null} => returns false', () => {
      const data = {
        ...SessionStartHookStub(),
        transcript_path: null as unknown as string,
      };
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: cwd is object} => returns false', () => {
      const data = {
        ...SessionStartHookStub(),
        cwd: { path: '/cwd' } as unknown as string,
      };
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - non-objects', () => {
    it('INVALID: {data: null} => returns false', () => {
      const result = isSessionStartHookDataContract({ data: null });

      expect(result).toBe(false);
    });

    it('INVALID: {data: undefined} => returns false', () => {
      const result = isSessionStartHookDataContract({ data: undefined });

      expect(result).toBe(false);
    });

    it('INVALID: {data: string} => returns false', () => {
      const result = isSessionStartHookDataContract({ data: 'not an object' });

      expect(result).toBe(false);
    });

    it('INVALID: {data: number} => returns false', () => {
      const result = isSessionStartHookDataContract({ data: 42 });

      expect(result).toBe(false);
    });

    it('INVALID: {data: array} => returns false', () => {
      const result = isSessionStartHookDataContract({ data: [] });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {data: empty object} => returns false', () => {
      const result = isSessionStartHookDataContract({ data: {} });

      expect(result).toBe(false);
    });

    it('EDGE: {data: all string fields are empty strings} => returns true', () => {
      const data = SessionStartHookStub({
        session_id: '',
        transcript_path: '',
        cwd: '',
      });
      const result = isSessionStartHookDataContract({ data });

      expect(result).toBe(true);
    });
  });
});

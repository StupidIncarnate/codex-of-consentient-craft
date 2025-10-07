import { isSessionStartHookData } from './is-session-start-hook-data';

describe('isSessionStartHookData()', () => {
  describe('valid inputs', () => {
    it('VALID: {data: valid SessionStartHookData} => returns true', () => {
      const data = {
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/current/working/directory',
        hook_event_name: 'SessionStart',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(true);
    });

    it('VALID: {data: minimal valid SessionStartHookData} => returns true', () => {
      const data = {
        session_id: 'abc',
        transcript_path: '/t',
        cwd: '/c',
        hook_event_name: 'SessionStart',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(true);
    });

    it('VALID: {data: SessionStartHookData with extra fields} => returns true', () => {
      const data = {
        session_id: 'session456',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
        hook_event_name: 'SessionStart',
        extra_field: 'extra',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs - missing required fields', () => {
    it('INVALID: {data: missing session_id} => returns false', () => {
      const data = {
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
        hook_event_name: 'SessionStart',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: missing transcript_path} => returns false', () => {
      const data = {
        session_id: 'session123',
        cwd: '/cwd',
        hook_event_name: 'SessionStart',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: missing cwd} => returns false', () => {
      const data = {
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        hook_event_name: 'SessionStart',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: missing hook_event_name} => returns false', () => {
      const data = {
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - wrong hook_event_name', () => {
    it('INVALID: {data: hook_event_name is "PreToolUse"} => returns false', () => {
      const data = {
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
        hook_event_name: 'PreToolUse',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: hook_event_name is "PostToolUse"} => returns false', () => {
      const data = {
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
        hook_event_name: 'PostToolUse',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: hook_event_name is number} => returns false', () => {
      const data = {
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
        hook_event_name: 123,
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - wrong types', () => {
    it('INVALID: {data: session_id is number} => returns false', () => {
      const data = {
        session_id: 123,
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
        hook_event_name: 'SessionStart',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: transcript_path is null} => returns false', () => {
      const data = {
        session_id: 'session123',
        transcript_path: null,
        cwd: '/cwd',
        hook_event_name: 'SessionStart',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: cwd is object} => returns false', () => {
      const data = {
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: { path: '/cwd' },
        hook_event_name: 'SessionStart',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - non-objects', () => {
    it('INVALID: {data: null} => returns false', () => {
      const result = isSessionStartHookData({ data: null });

      expect(result).toBe(false);
    });

    it('INVALID: {data: undefined} => returns false', () => {
      const result = isSessionStartHookData({ data: undefined });

      expect(result).toBe(false);
    });

    it('INVALID: {data: string} => returns false', () => {
      const result = isSessionStartHookData({ data: 'not an object' });

      expect(result).toBe(false);
    });

    it('INVALID: {data: number} => returns false', () => {
      const result = isSessionStartHookData({ data: 42 });

      expect(result).toBe(false);
    });

    it('INVALID: {data: array} => returns false', () => {
      const result = isSessionStartHookData({ data: [] });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {data: empty object} => returns false', () => {
      const result = isSessionStartHookData({ data: {} });

      expect(result).toBe(false);
    });

    it('EDGE: {data: all string fields are empty strings} => returns true', () => {
      const data = {
        session_id: '',
        transcript_path: '',
        cwd: '',
        hook_event_name: 'SessionStart',
      };
      const result = isSessionStartHookData({ data });

      expect(result).toBe(true);
    });
  });
});

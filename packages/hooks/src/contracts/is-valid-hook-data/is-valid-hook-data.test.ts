import { isValidHookData } from './is-valid-hook-data';

describe('isValidHookData()', () => {
  describe('valid inputs', () => {
    it('VALID: {data: valid HookData object} => returns true', () => {
      const data = {
        hook_event_name: 'PreToolUse',
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/current/working/directory',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(true);
    });

    it('VALID: {data: HookData with extra properties} => returns true', () => {
      const data = {
        hook_event_name: 'PostToolUse',
        session_id: 'session456',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
        tool_name: 'Edit',
        extra_field: 'extra',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(true);
    });

    it('VALID: {data: minimal valid HookData} => returns true', () => {
      const data = {
        hook_event_name: 'SessionStart',
        session_id: 'abc',
        transcript_path: '/t',
        cwd: '/c',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(true);
    });
  });

  describe('invalid inputs - missing required fields', () => {
    it('INVALID: {data: missing hook_event_name} => returns false', () => {
      const data = {
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(false);
    });

    it('INVALID: {data: missing session_id} => returns false', () => {
      const data = {
        hook_event_name: 'PreToolUse',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(false);
    });

    it('INVALID: {data: missing transcript_path} => returns false', () => {
      const data = {
        hook_event_name: 'PreToolUse',
        session_id: 'session123',
        cwd: '/cwd',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(false);
    });

    it('INVALID: {data: missing cwd} => returns false', () => {
      const data = {
        hook_event_name: 'PreToolUse',
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - wrong types', () => {
    it('INVALID: {data: hook_event_name is number} => returns false', () => {
      const data = {
        hook_event_name: 123,
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(false);
    });

    it('INVALID: {data: session_id is boolean} => returns false', () => {
      const data = {
        hook_event_name: 'PreToolUse',
        session_id: true,
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(false);
    });

    it('INVALID: {data: transcript_path is null} => returns false', () => {
      const data = {
        hook_event_name: 'PreToolUse',
        session_id: 'session123',
        transcript_path: null,
        cwd: '/cwd',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(false);
    });

    it('INVALID: {data: cwd is object} => returns false', () => {
      const data = {
        hook_event_name: 'PreToolUse',
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: { path: '/cwd' },
      };
      const result = isValidHookData({ data });
      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - non-objects', () => {
    it('INVALID: {data: null} => returns false', () => {
      const result = isValidHookData({ data: null });
      expect(result).toBe(false);
    });

    it('INVALID: {data: undefined} => returns false', () => {
      const result = isValidHookData({ data: undefined });
      expect(result).toBe(false);
    });

    it('INVALID: {data: string} => returns false', () => {
      const result = isValidHookData({ data: 'not an object' });
      expect(result).toBe(false);
    });

    it('INVALID: {data: number} => returns false', () => {
      const result = isValidHookData({ data: 42 });
      expect(result).toBe(false);
    });

    it('INVALID: {data: array} => returns false', () => {
      const result = isValidHookData({ data: [] });
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {data: empty object} => returns false', () => {
      const result = isValidHookData({ data: {} });
      expect(result).toBe(false);
    });

    it('EDGE: {data: all fields are empty strings} => returns true', () => {
      const data = {
        hook_event_name: '',
        session_id: '',
        transcript_path: '',
        cwd: '',
      };
      const result = isValidHookData({ data });
      expect(result).toBe(true);
    });
  });
});

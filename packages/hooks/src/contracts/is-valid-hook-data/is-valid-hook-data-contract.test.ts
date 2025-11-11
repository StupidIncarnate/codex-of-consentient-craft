import { isValidHookDataContract } from './is-valid-hook-data-contract';
import { isValidHookDataContract as _isValidHookDataStub } from './is-valid-hook-data.stub';
import { HookDataStub } from '../hook-data/hook-data.stub';

describe('isValidHookDataContract()', () => {
  describe('valid inputs', () => {
    it('VALID: {data: valid HookData object} => returns true', () => {
      const data = HookDataStub({
        hook_event_name: 'PreToolUse',
        session_id: 'session123',
        transcript_path: '/path/to/transcript',
        cwd: '/current/working/directory',
      });
      const result = isValidHookDataContract({ data });

      expect(result).toBe(true);
    });

    it('VALID: {data: HookData with extra properties} => returns true', () => {
      const data = HookDataStub({
        hook_event_name: 'PostToolUse',
        session_id: 'session456',
        transcript_path: '/path/to/transcript',
        cwd: '/cwd',
        tool_name: 'Edit',
      });
      Reflect.set(data, 'extra_field', 'extra');
      const result = isValidHookDataContract({ data });

      expect(result).toBe(true);
    });

    it('VALID: {data: minimal valid HookData} => returns true', () => {
      const data = HookDataStub({
        hook_event_name: 'SessionStart',
        session_id: 'abc',
        transcript_path: '/t',
        cwd: '/c',
      });
      const result = isValidHookDataContract({ data });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs - missing required fields', () => {
    it('INVALID: {data: missing hook_event_name} => returns false', () => {
      const stub = HookDataStub();
      const { hook_event_name: _hook_event_name, ...data } = stub;
      const result = isValidHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: missing session_id} => returns false', () => {
      const stub = HookDataStub();
      const { session_id: _session_id, ...data } = stub;
      const result = isValidHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: missing transcript_path} => returns false', () => {
      const stub = HookDataStub();
      const { transcript_path: _transcript_path, ...data } = stub;
      const result = isValidHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: missing cwd} => returns false', () => {
      const stub = HookDataStub();
      const { cwd: _cwd, ...data } = stub;
      const result = isValidHookDataContract({ data });

      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - wrong types', () => {
    it('INVALID: {data: hook_event_name is number} => returns false', () => {
      const data = HookDataStub();
      Reflect.set(data, 'hook_event_name', 123 as never);
      const result = isValidHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: session_id is boolean} => returns false', () => {
      const data = HookDataStub();
      Reflect.set(data, 'session_id', true as never);
      const result = isValidHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: transcript_path is null} => returns false', () => {
      const data = HookDataStub();
      Reflect.set(data, 'transcript_path', null as never);
      const result = isValidHookDataContract({ data });

      expect(result).toBe(false);
    });

    it('INVALID: {data: cwd is object} => returns false', () => {
      const data = HookDataStub();
      const invalidCwd = Object.create(null);
      Reflect.set(invalidCwd, 'path', '/cwd');
      Reflect.set(data, 'cwd', invalidCwd as never);
      const result = isValidHookDataContract({ data });

      expect(result).toBe(false);
    });
  });

  describe('invalid inputs - non-objects', () => {
    it('INVALID: {data: null} => returns false', () => {
      const result = isValidHookDataContract({ data: null });

      expect(result).toBe(false);
    });

    it('INVALID: {data: undefined} => returns false', () => {
      const result = isValidHookDataContract({ data: undefined });

      expect(result).toBe(false);
    });

    it('INVALID: {data: string} => returns false', () => {
      const result = isValidHookDataContract({ data: 'not an object' });

      expect(result).toBe(false);
    });

    it('INVALID: {data: number} => returns false', () => {
      const result = isValidHookDataContract({ data: 42 });

      expect(result).toBe(false);
    });

    it('INVALID: {data: array} => returns false', () => {
      const result = isValidHookDataContract({ data: [] });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {data: empty object} => returns false', () => {
      const result = isValidHookDataContract({ data: {} });

      expect(result).toBe(false);
    });

    it('EDGE: {data: all fields are empty strings} => returns true', () => {
      const data = HookDataStub();
      Reflect.set(data, 'hook_event_name', '');
      Reflect.set(data, 'session_id', '');
      Reflect.set(data, 'transcript_path', '');
      Reflect.set(data, 'cwd', '');
      const result = isValidHookDataContract({ data });

      expect(result).toBe(true);
    });
  });
});

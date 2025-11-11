import { sessionStartHookDataContract } from './session-start-hook-data-contract';
import { SessionStartHookStub } from './session-start-hook-data.stub';

describe('sessionStartHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = SessionStartHookStub();

    expect(result.hook_event_name).toBe('SessionStart');
    expect(result.session_id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
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

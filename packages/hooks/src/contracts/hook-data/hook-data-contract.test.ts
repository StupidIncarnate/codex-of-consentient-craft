import { HookDataStub } from './hook-data.stub';

describe('hookDataContract', () => {
  it('VALID: {PreToolUse hook data} => parses successfully', () => {
    const result = HookDataStub();

    expect(result.hook_event_name).toBe('PreToolUse');
    expect(result.session_id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(result.tool_name).toBe('Write');
  });

  it('VALID: {custom tool_name} => parses successfully', () => {
    const result = HookDataStub({ tool_name: 'Edit' });

    expect(result.tool_name).toBe('Edit');
  });
});

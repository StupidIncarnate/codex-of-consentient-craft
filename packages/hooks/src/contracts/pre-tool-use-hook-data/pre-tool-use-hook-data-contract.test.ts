import { PreToolUseHookDataStub } from './pre-tool-use-hook-data.stub';

describe('preToolUseHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = PreToolUseHookDataStub();

    expect(result.hook_event_name).toBe('PreToolUse');
    expect(result.tool_name).toBe('Write');
    expect(result.tool_input.file_path).toBe('/test/file.ts');
  });

  it('VALID: {Edit tool} => parses successfully', () => {
    const result = PreToolUseHookDataStub({
      tool_name: 'Edit',
    });

    expect(result.tool_name).toBe('Edit');
  });
});

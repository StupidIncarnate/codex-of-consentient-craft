import { PostToolUseHookDataStub } from './post-tool-use-hook-data.stub';

describe('postToolUseHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = PostToolUseHookDataStub();

    expect(result.hook_event_name).toBe('PostToolUse');
    expect(result.tool_name).toBe('Write');
    expect(result.tool_input.file_path).toBe('/test/file.ts');
  });

  it('VALID: {with tool response} => parses successfully', () => {
    const result = PostToolUseHookDataStub({
      tool_response: { success: true, filePath: '/test/output.ts' },
    });

    expect(result.tool_response.success).toBe(true);
  });
});

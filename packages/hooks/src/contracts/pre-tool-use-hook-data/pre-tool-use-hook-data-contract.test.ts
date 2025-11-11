import { preToolUseHookDataContract } from './pre-tool-use-hook-data-contract';
import { PreToolUseHookStub } from './pre-tool-use-hook-data.stub';

describe('preToolUseHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = PreToolUseHookStub();

    expect(result.hook_event_name).toBe('PreToolUse');
    expect(result.tool_name).toBe('Write');
    expect(result.tool_input.file_path).toBe('/test/file.ts');
  });

  it('VALID: {Edit tool} => parses successfully', () => {
    const result = PreToolUseHookStub({
      tool_name: 'Edit',
    });

    expect(result.tool_name).toBe('Edit');
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return preToolUseHookDataContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});

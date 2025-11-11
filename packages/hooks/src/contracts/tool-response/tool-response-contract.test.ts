import { toolResponseContract } from './tool-response-contract';
import { ToolResponseStub } from './tool-response.stub';

describe('toolResponseContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = ToolResponseStub();

    expect(result).toStrictEqual({
      filePath: '/test/file.ts',
      success: true,
    });
  });

  it('VALID: {with additional fields} => parses successfully with passthrough', () => {
    const result = ToolResponseStub({
      filePath: '/src/test.ts',
      success: false,
    });

    expect(result.success).toBe(false);
    expect(result.filePath).toBe('/src/test.ts');
  });

  describe('invalid input', () => {
    it('INVALID: {success: not a boolean} => throws validation error', () => {
      expect(() => {
        return toolResponseContract.parse({ success: 'yes' as never });
      }).toThrow(/Expected boolean/u);
    });
  });
});

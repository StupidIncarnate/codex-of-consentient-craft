import { hookToolResponseContract } from './tool-response-contract';
import { HookToolResponseStub } from './tool-response.stub';

describe('toolResponseContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = HookToolResponseStub();

    expect(result).toStrictEqual({
      filePath: '/test/file.ts',
      success: true,
    });
  });

  it('VALID: {with additional fields} => parses successfully with passthrough', () => {
    const result = HookToolResponseStub({
      filePath: '/src/test.ts',
      success: false,
    });

    expect(result).toStrictEqual({
      filePath: '/src/test.ts',
      success: false,
    });
  });

  describe('invalid input', () => {
    it('INVALID: {success: not a boolean} => throws validation error', () => {
      expect(() => {
        return hookToolResponseContract.parse({ success: 'yes' });
      }).toThrow(/expected boolean/u);
    });
  });
});

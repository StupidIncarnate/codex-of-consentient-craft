import { toolInputParamNameContract } from './tool-input-param-name-contract';
import { ToolInputParamNameStub } from './tool-input-param-name.stub';

describe('toolInputParamNameContract', () => {
  describe('valid names', () => {
    it('VALID: {value: "folderType"} => parses successfully', () => {
      const name = ToolInputParamNameStub({ value: 'folderType' });

      const result = toolInputParamNameContract.parse(name);

      expect(result).toBe('folderType');
    });
  });

  describe('invalid names', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => toolInputParamNameContract.parse(123 as never)).toThrow(/expected string/u);
    });
  });
});

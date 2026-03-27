import { toolNameContract } from './tool-name-contract';
import { ToolNameStub } from './tool-name.stub';

describe('toolNameContract', () => {
  describe('valid tool names', () => {
    it('VALID: {value: "read_file"} => parses successfully', () => {
      const result = ToolNameStub({ value: 'read_file' });

      expect(result).toBe('read_file');
    });

    it('VALID: {value: "toolu_01Lj..."} => parses tool use ID as tool name', () => {
      const result = ToolNameStub({ value: 'toolu_01LjqmeCdGkun1jsiYa3qSPx' });

      expect(result).toBe('toolu_01LjqmeCdGkun1jsiYa3qSPx');
    });
  });

  describe('invalid tool names', () => {
    it('INVALID_MULTIPLE: {value: ""} => throws on empty string', () => {
      expect(() => toolNameContract.parse('')).toThrow(/too_small/u);
    });
  });
});

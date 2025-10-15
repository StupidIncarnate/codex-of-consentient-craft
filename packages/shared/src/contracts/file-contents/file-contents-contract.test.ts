import { fileContentsContract } from './file-contents-contract';

describe('fileContentsContract', () => {
  describe('valid content', () => {
    it('VALID: {content: "some text"} => parses successfully', () => {
      const result = fileContentsContract.parse('some text');

      expect(result).toBe('some text');
    });

    it('VALID: {content: ""} => parses successfully', () => {
      const result = fileContentsContract.parse('');

      expect(result).toBe('');
    });

    it('VALID: {content: "multi\\nline\\ncontent"} => parses successfully', () => {
      const content = 'multi\nline\ncontent';
      const result = fileContentsContract.parse(content);

      expect(result).toBe(content);
    });

    it('VALID: {content: "special chars !@#$%"} => parses successfully', () => {
      const content = 'special chars !@#$%';
      const result = fileContentsContract.parse(content);

      expect(result).toBe(content);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {content: 123} => throws ZodError', () => {
      expect(() => {
        return fileContentsContract.parse(123);
      }).toThrow('Expected string');
    });

    it('INVALID: {content: null} => throws ZodError', () => {
      expect(() => {
        return fileContentsContract.parse(null);
      }).toThrow('Expected string');
    });

    it('INVALID: {content: undefined} => throws ZodError', () => {
      expect(() => {
        return fileContentsContract.parse(undefined);
      }).toThrow('Required');
    });

    it('INVALID: {content: {}} => throws ZodError', () => {
      expect(() => {
        return fileContentsContract.parse({});
      }).toThrow('Expected string');
    });
  });
});

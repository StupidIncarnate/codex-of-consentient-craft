import { batchFileInputContract } from './batch-file-input-contract';
import { BatchFileInputStub } from './batch-file-input.stub';

describe('batchFileInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {filePaths, errors} => parses filePaths and errors', () => {
      const result = batchFileInputContract.parse({
        filePaths: ['/src/file.ts'],
        errors: ['line 5: error'],
      });

      expect(result).toStrictEqual({
        filePaths: ['/src/file.ts'],
        errors: ['line 5: error'],
      });
    });

    it('VALID: {verificationCommand} => includes verificationCommand', () => {
      const result = batchFileInputContract.parse({
        filePaths: ['/src/file.ts'],
        errors: [],
        verificationCommand: 'npm run ward',
      });

      expect(result.verificationCommand).toBe('npm run ward');
    });

    it('VALID: {contextInstructions} => includes contextInstructions', () => {
      const result = batchFileInputContract.parse({
        filePaths: [],
        errors: [],
        contextInstructions: '## Instructions\nFix ward failures.',
      });

      expect(result.contextInstructions).toBe('## Instructions\nFix ward failures.');
    });

    it('VALID: {stub default} => parses filePaths and errors', () => {
      const input = BatchFileInputStub();

      expect(input).toStrictEqual({
        filePaths: ['/src/brokers/test/test-broker.ts'],
        errors: ['line 5: Unexpected any'],
      });
    });
  });

  describe('lenient behavior', () => {
    it('EDGE: {missing filePaths} => defaults to empty array', () => {
      const result = batchFileInputContract.parse({ errors: [] });

      expect(result.filePaths).toStrictEqual([]);
    });

    it('EDGE: {missing errors} => defaults to empty array', () => {
      const result = batchFileInputContract.parse({ filePaths: [] });

      expect(result.errors).toStrictEqual([]);
    });

    it('EDGE: {filePaths not array} => defaults to empty array', () => {
      const result = batchFileInputContract.parse({ filePaths: 'not-array', errors: [] });

      expect(result.filePaths).toStrictEqual([]);
    });

    it('EDGE: {errors not array} => defaults to empty array', () => {
      const result = batchFileInputContract.parse({ filePaths: [], errors: 'not-array' });

      expect(result.errors).toStrictEqual([]);
    });

    it('EDGE: {filePaths with non-string items} => skips non-string items', () => {
      const result = batchFileInputContract.parse({
        filePaths: [123, '/src/valid.ts'],
        errors: [],
      });

      expect(result.filePaths).toStrictEqual(['/src/valid.ts']);
    });

    it('EDGE: {filePaths with relative path} => skips non-absolute paths', () => {
      const result = batchFileInputContract.parse({
        filePaths: ['relative/path.ts', '/src/valid.ts'],
        errors: [],
      });

      expect(result.filePaths).toStrictEqual(['/src/valid.ts']);
    });

    it('EDGE: {errors with non-string items} => skips non-string items', () => {
      const result = batchFileInputContract.parse({ filePaths: [], errors: [42, 'valid error'] });

      expect(result.errors).toStrictEqual(['valid error']);
    });

    it('EDGE: {verificationCommand empty string} => returns undefined', () => {
      const result = batchFileInputContract.parse({
        filePaths: [],
        errors: [],
        verificationCommand: '',
      });

      expect(result.verificationCommand).toBe(undefined);
    });

    it('EDGE: {verificationCommand not a string} => returns undefined', () => {
      const result = batchFileInputContract.parse({
        filePaths: [],
        errors: [],
        verificationCommand: 42,
      });

      expect(result.verificationCommand).toBe(undefined);
    });

    it('EDGE: {non-object input} => returns empty filePaths and errors', () => {
      const result = batchFileInputContract.parse('just a string');

      expect(result).toStrictEqual({
        filePaths: [],
        errors: [],
        verificationCommand: undefined,
        contextInstructions: undefined,
      });
    });

    it('EDGE: {null input} => returns empty filePaths and errors', () => {
      const result = batchFileInputContract.parse(null);

      expect(result).toStrictEqual({
        filePaths: [],
        errors: [],
        verificationCommand: undefined,
        contextInstructions: undefined,
      });
    });
  });
});

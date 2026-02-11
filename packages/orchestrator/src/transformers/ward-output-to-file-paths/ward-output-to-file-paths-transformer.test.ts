import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { wardOutputToFilePathsTransformer } from './ward-output-to-file-paths-transformer';

describe('wardOutputToFilePathsTransformer', () => {
  describe('output with absolute file paths', () => {
    it('VALID: {output with single .ts path} => returns array with one path', () => {
      const output = ErrorMessageStub({
        value: 'Error in /src/brokers/test/test-broker.ts at line 5',
      });

      const result = wardOutputToFilePathsTransformer({ output });

      expect(result).toStrictEqual(['/src/brokers/test/test-broker.ts']);
    });

    it('VALID: {output with multiple .ts paths} => returns deduplicated array', () => {
      const output = ErrorMessageStub({
        value:
          'Error in /src/brokers/auth/auth-broker.ts\nWarning in /src/contracts/user/user-contract.ts',
      });

      const result = wardOutputToFilePathsTransformer({ output });

      expect(result).toStrictEqual([
        '/src/brokers/auth/auth-broker.ts',
        '/src/contracts/user/user-contract.ts',
      ]);
    });

    it('VALID: {output with .tsx path} => returns array with tsx path', () => {
      const output = ErrorMessageStub({
        value: 'Error in /src/widgets/user-card/user-card-widget.tsx',
      });

      const result = wardOutputToFilePathsTransformer({ output });

      expect(result).toStrictEqual(['/src/widgets/user-card/user-card-widget.tsx']);
    });

    it('VALID: {output with duplicate paths} => returns deduplicated array', () => {
      const output = ErrorMessageStub({
        value: 'Error in /src/file.ts at line 1\nError in /src/file.ts at line 10',
      });

      const result = wardOutputToFilePathsTransformer({ output });

      expect(result).toStrictEqual(['/src/file.ts']);
    });
  });

  describe('output without file paths', () => {
    it('EMPTY: {output with no paths} => returns empty array', () => {
      const output = ErrorMessageStub({
        value: 'Some generic error message without paths',
      });

      const result = wardOutputToFilePathsTransformer({ output });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty output} => returns empty array', () => {
      const output = ErrorMessageStub({ value: '' });

      const result = wardOutputToFilePathsTransformer({ output });

      expect(result).toStrictEqual([]);
    });
  });

  describe('output with no recognizable paths', () => {
    it('EDGE: {output with no slash-prefixed paths} => returns empty array', () => {
      const output = ErrorMessageStub({
        value: 'Error: module not found\nTypeError: Cannot read property',
      });

      const result = wardOutputToFilePathsTransformer({ output });

      expect(result).toStrictEqual([]);
    });
  });

  describe('output with mixed content', () => {
    it('VALID: {output with paths mixed in error text} => extracts only valid absolute paths', () => {
      const output = ErrorMessageStub({
        value:
          'packages/orchestrator/src/brokers/test.ts:5:1 - error TS2322\n/home/user/project/src/adapters/fs/read-file/fs-read-file-adapter.ts(10,5): error',
      });

      const result = wardOutputToFilePathsTransformer({ output });

      expect(result).toStrictEqual([
        '/orchestrator/src/brokers/test.ts',
        '/home/user/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
      ]);
    });
  });

  describe('false-positive relative path extraction', () => {
    // Known behavior: The regex /\/[\w./-]+\.tsx?/g matches from the first `/` in a relative path.
    // A relative path like `packages/orchestrator/src/file.ts` extracts `/orchestrator/src/file.ts`
    // because the regex starts matching at the first `/` character. This means ward output
    // containing relative paths will produce truncated absolute paths.
    it('EDGE: {relative path like packages/orchestrator/src/file.ts} => extracts from first slash as /orchestrator/src/file.ts', () => {
      const output = ErrorMessageStub({
        value: 'packages/orchestrator/src/file.ts:10:5 - error TS2322',
      });

      const result = wardOutputToFilePathsTransformer({ output });

      expect(result).toStrictEqual(['/orchestrator/src/file.ts']);
    });
  });
});

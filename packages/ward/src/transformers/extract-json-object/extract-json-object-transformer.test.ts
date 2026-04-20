import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';
import { extractJsonObjectTransformer } from './extract-json-object-transformer';

describe('extractJsonObjectTransformer', () => {
  describe('Jest summary extraction', () => {
    it('VALID: {pure Jest summary JSON} => returns unchanged', () => {
      const jest = JSON.stringify({ numTotalTestSuites: 5, numPassedTests: 17 });
      const output = ErrorMessageStub({ value: jest });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: jest }));
    });

    it('VALID: {Jest summary with trailing text} => returns only JSON', () => {
      const jest = JSON.stringify({ numTotalTestSuites: 2, numPassedTests: 4 });
      const output = ErrorMessageStub({ value: `${jest}FAIL src/file.test.ts` });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: jest }));
    });

    it('VALID: {text before Jest summary} => returns only JSON', () => {
      const jest = JSON.stringify({ numTotalTestSuites: 1, numPassedTests: 2 });
      const output = ErrorMessageStub({ value: `PASS src/other.test.ts\n${jest}` });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: jest }));
    });

    it('VALID: {Jest summary with braces in string values} => returns complete JSON', () => {
      const jest = JSON.stringify({
        numTotalTestSuites: 1,
        testResults: [{ message: 'error TS2552: Cannot find name {foo}' }],
      });
      const output = ErrorMessageStub({ value: `${jest}extra text` });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: jest }));
    });

    it('VALID: {Jest summary with escaped quotes in string values} => returns complete JSON', () => {
      const jest = JSON.stringify({
        numTotalTestSuites: 1,
        testResults: [{ message: 'said "hello"' }],
      });
      const output = ErrorMessageStub({ value: `${jest}trailing` });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: jest }));
    });

    it('VALID: {Jest summary with deeply nested objects} => returns complete JSON', () => {
      const jest = JSON.stringify({
        numTotalTestSuites: 1,
        testResults: [{ outer: { inner: { deep: true } } }],
      });
      const output = ErrorMessageStub({ value: `prefix${jest}suffix` });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: jest }));
    });

    it('VALID: {unrelated JSON before and after Jest summary} => returns only Jest summary', () => {
      const before = JSON.stringify({ runId: '1739625600000-a3f1', checks: [] });
      const jest = JSON.stringify({
        numTotalTestSuites: 5,
        numPassedTests: 17,
        testResults: [{ name: '/a.test.ts' }],
      });
      const after = JSON.stringify({ id: '1' });
      const output = ErrorMessageStub({
        value: `PASS src/foo.test.ts\n${before}\n${jest}\n${after}`,
      });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: jest }));
    });
  });

  describe('no Jest summary present', () => {
    it('EMPTY: {no braces in output} => returns original string', () => {
      const output = ErrorMessageStub({ value: 'PASS all tests passed' });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(output);
    });

    it('EMPTY: {JSON objects but none with numTotalTestSuites} => returns original string', () => {
      const output = ErrorMessageStub({ value: '{"id":"1"}\n{"name":"foo"}' });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(output);
    });
  });
});

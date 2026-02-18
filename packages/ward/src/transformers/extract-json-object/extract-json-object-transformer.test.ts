import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';
import { extractJsonObjectTransformer } from './extract-json-object-transformer';

describe('extractJsonObjectTransformer', () => {
  describe('valid JSON extraction', () => {
    it('VALID: {pure JSON string} => returns unchanged', () => {
      const output = ErrorMessageStub({ value: '{"key":"value"}' });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: '{"key":"value"}' }));
    });

    it('VALID: {JSON with trailing text} => returns only JSON', () => {
      const output = ErrorMessageStub({ value: '{"key":"value"}FAIL src/file.test.ts' });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: '{"key":"value"}' }));
    });

    it('VALID: {text before JSON} => returns only JSON', () => {
      const output = ErrorMessageStub({ value: 'PASS src/other.test.ts\n{"key":"value"}' });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: '{"key":"value"}' }));
    });

    it('VALID: {JSON with nested braces in strings} => returns complete JSON', () => {
      const json = JSON.stringify({ message: 'error TS2552: Cannot find name {foo}' });
      const output = ErrorMessageStub({ value: `${json}extra text` });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: json }));
    });

    it('VALID: {JSON with escaped quotes in strings} => returns complete JSON', () => {
      const json = JSON.stringify({ message: 'said "hello"' });
      const output = ErrorMessageStub({ value: `${json}trailing` });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: json }));
    });

    it('VALID: {JSON with nested objects} => returns complete JSON', () => {
      const json = JSON.stringify({ outer: { inner: { deep: true } } });
      const output = ErrorMessageStub({ value: `prefix${json}suffix` });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(ErrorMessageStub({ value: json }));
    });
  });

  describe('no JSON present', () => {
    it('EMPTY: {no braces in output} => returns original string', () => {
      const output = ErrorMessageStub({ value: 'PASS all tests passed' });

      const result = extractJsonObjectTransformer({ output });

      expect(result).toBe(output);
    });
  });
});

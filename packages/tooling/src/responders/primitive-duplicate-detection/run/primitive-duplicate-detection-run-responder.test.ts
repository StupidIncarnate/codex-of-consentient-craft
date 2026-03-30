import { PrimitiveDuplicateDetectionRunResponder } from './primitive-duplicate-detection-run-responder';
import { PrimitiveDuplicateDetectionRunResponderProxy } from './primitive-duplicate-detection-run-responder.proxy';
import { SourceCodeStub } from '../../../contracts/source-code/source-code.stub';

describe('PrimitiveDuplicateDetectionRunResponder', () => {
  describe('default args (no flags)', () => {
    it('VALID: {no args} => outputs scanning header with default pattern, threshold, and min length', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: [] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toMatch(/^Scanning for duplicate primitives\.\.\.$/mu);
      expect(output).toMatch(/^ {2}Pattern: \*\*\/\*\.ts$/mu);
      expect(output).toMatch(/^ {2}Threshold: 3\+ occurrences$/mu);
      expect(output).toMatch(/^ {2}Min length: 3 characters$/mu);
    });
  });

  describe('custom --pattern= arg', () => {
    it('VALID: {--pattern=src/**/*.ts} => outputs custom pattern in scanning header', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: ['--pattern=src/**/*.ts'] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toMatch(/^ {2}Pattern: src\/\*\*\/\*\.ts$/mu);
    });
  });

  describe('custom --cwd= arg', () => {
    it('VALID: {--cwd=/some/path} => outputs custom directory in scanning header', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: ['--cwd=/some/path'] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toMatch(/^ {2}Directory: \/some\/path$/mu);
    });
  });

  describe('custom --threshold= arg', () => {
    it('VALID: {--threshold=5} => outputs custom threshold in scanning header', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: ['--threshold=5'] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toMatch(/^ {2}Threshold: 5\+ occurrences$/mu);
    });
  });

  describe('custom --min-length= arg', () => {
    it('VALID: {--min-length=10} => outputs custom min-length in scanning header', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: ['--min-length=10'] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toMatch(/^ {2}Min length: 10 characters$/mu);
    });
  });

  describe('zero duplicates', () => {
    it('EMPTY: {no source files} => outputs success message and no report', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: [] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toMatch(/^\u2705 No duplicate primitives found!$/mu);
    });
  });

  describe('multiple string duplicates', () => {
    it('VALID: {source with string literal repeated 3 times} => outputs formatted STRING duplicate report', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupWithSourceCode({
        sourceCode: SourceCodeStub({
          value: 'const a = "hello-world";\nconst b = "hello-world";\nconst c = "hello-world";',
        }),
      });

      await PrimitiveDuplicateDetectionRunResponder({ args: [] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toMatch(/^Found 1 duplicate primitive\(s\):$/mu);
      expect(output).toMatch(/^STRING: "hello-world"$/mu);
      expect(output).toMatch(/^Occurrences: 3$/mu);
      expect(output).toMatch(/^Suggestion: Extract these literals to statics files:$/mu);
    });
  });

  describe('regex type duplicates', () => {
    it('VALID: {source with regex literal repeated 3 times} => outputs REGEX prefix in report', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupWithSourceCode({
        sourceCode: SourceCodeStub({
          value: 'const a = /foo-bar/;\nconst b = /foo-bar/;\nconst c = /foo-bar/;',
        }),
      });

      await PrimitiveDuplicateDetectionRunResponder({ args: [] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toMatch(/^REGEX: "\/foo-bar\/"$/mu);
      expect(output).toMatch(/^Occurrences: 3$/mu);
    });
  });
});

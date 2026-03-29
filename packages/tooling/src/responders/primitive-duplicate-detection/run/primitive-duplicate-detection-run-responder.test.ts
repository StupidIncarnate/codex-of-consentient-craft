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

      expect(output).toContain('Scanning for duplicate primitives...');
      expect(output).toContain('Pattern: **/*.ts');
      expect(output).toContain('Threshold: 3+ occurrences');
      expect(output).toContain('Min length: 3 characters');
    });
  });

  describe('custom --pattern= arg', () => {
    it('VALID: {--pattern=src/**/*.ts} => outputs custom pattern in scanning header', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: ['--pattern=src/**/*.ts'] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toContain('Pattern: src/**/*.ts');
    });
  });

  describe('custom --cwd= arg', () => {
    it('VALID: {--cwd=/some/path} => outputs custom directory in scanning header', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: ['--cwd=/some/path'] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toContain('Directory: /some/path');
    });
  });

  describe('custom --threshold= arg', () => {
    it('VALID: {--threshold=5} => outputs custom threshold in scanning header', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: ['--threshold=5'] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toContain('Threshold: 5+ occurrences');
    });
  });

  describe('custom --min-length= arg', () => {
    it('VALID: {--min-length=10} => outputs custom min-length in scanning header', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: ['--min-length=10'] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toContain('Min length: 10 characters');
    });
  });

  describe('zero duplicates', () => {
    it('EMPTY: {no source files} => outputs success message and no report', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      proxy.setupNoDuplicates();

      await PrimitiveDuplicateDetectionRunResponder({ args: [] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toContain('No duplicate primitives found!');
    });
  });

  describe('multiple string duplicates', () => {
    it('VALID: {source with string literal repeated 3 times} => outputs formatted STRING duplicate report', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      // "hello-world" is 11 chars >= minLength(3), repeated 3 times >= threshold(3)
      proxy.setupWithSourceCode({
        sourceCode: SourceCodeStub({
          value: 'const a = "hello-world";\nconst b = "hello-world";\nconst c = "hello-world";',
        }),
      });

      await PrimitiveDuplicateDetectionRunResponder({ args: [] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toContain('Found 1 duplicate primitive(s)');
      expect(output).toContain('STRING: "hello-world"');
      expect(output).toContain('Occurrences: 3');
      expect(output).toContain('Suggestion: Extract these literals to statics files');
    });
  });

  describe('regex type duplicates', () => {
    it('VALID: {source with regex literal repeated 3 times} => outputs REGEX prefix in report', async () => {
      const proxy = PrimitiveDuplicateDetectionRunResponderProxy();
      // /foo-bar/ regex literal repeated 3 times >= threshold(3)
      proxy.setupWithSourceCode({
        sourceCode: SourceCodeStub({
          value: 'const a = /foo-bar/;\nconst b = /foo-bar/;\nconst c = /foo-bar/;',
        }),
      });

      await PrimitiveDuplicateDetectionRunResponder({ args: [] });

      const output = proxy.getStdoutOutput().join('');

      expect(output).toContain('REGEX: "/foo-bar/"');
      expect(output).toContain('Occurrences: 3');
    });
  });
});

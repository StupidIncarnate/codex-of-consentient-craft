import { executionRowSubtitleTransformer } from './execution-row-subtitle-transformer';

describe('executionRowSubtitleTransformer', () => {
  describe('queued with dependencies', () => {
    it('VALID: {status: "queued", dependsOn: ["step-1"]} => returns waiting for slot text', () => {
      const result = executionRowSubtitleTransformer({
        status: 'queued',
        dependsOn: ['step-1'],
        files: [],
      });

      expect(result).toBe('\u2514\u2500 waiting for slot (depends on: step-1)');
    });

    it('VALID: {status: "queued", dependsOn: ["step-1", "step-2"]} => joins multiple deps', () => {
      const result = executionRowSubtitleTransformer({
        status: 'queued',
        dependsOn: ['step-1', 'step-2'],
        files: [],
      });

      expect(result).toBe('\u2514\u2500 waiting for slot (depends on: step-1, step-2)');
    });
  });

  describe('pending with dependencies', () => {
    it('VALID: {status: "pending", dependsOn: ["step-1"]} => returns depends on text', () => {
      const result = executionRowSubtitleTransformer({
        status: 'pending',
        dependsOn: ['step-1'],
        files: [],
      });

      expect(result).toBe('\u2514\u2500 depends on: step-1');
    });
  });

  describe('files display', () => {
    it('VALID: {status: "in_progress", files: ["src/auth.ts"]} => returns file list', () => {
      const result = executionRowSubtitleTransformer({
        status: 'in_progress',
        dependsOn: [],
        files: ['src/auth.ts'],
      });

      expect(result).toBe('\u2514\u2500 src/auth.ts');
    });

    it('VALID: {files: ["a.ts", "b.ts"]} => joins multiple files', () => {
      const result = executionRowSubtitleTransformer({
        status: 'complete',
        dependsOn: [],
        files: ['a.ts', 'b.ts'],
      });

      expect(result).toBe('\u2514\u2500 a.ts, b.ts');
    });
  });

  describe('empty subtitle', () => {
    it('EMPTY: {no deps, no files} => returns empty string', () => {
      const result = executionRowSubtitleTransformer({
        status: 'in_progress',
        dependsOn: [],
        files: [],
      });

      expect(result).toBe('');
    });

    it('VALID: {status: "queued", no deps} => returns empty even with files', () => {
      const result = executionRowSubtitleTransformer({
        status: 'queued',
        dependsOn: [],
        files: ['src/auth.ts'],
      });

      expect(result).toBe('\u2514\u2500 src/auth.ts');
    });
  });
});

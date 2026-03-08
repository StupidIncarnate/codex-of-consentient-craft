import { DependencyLabelStub } from '../../contracts/dependency-label/dependency-label.stub';
import { DisplayFilePathStub } from '../../contracts/display-file-path/display-file-path.stub';
import { ExecutionStepStatusStub } from '../../contracts/execution-step-status/execution-step-status.stub';
import { executionRowSubtitleTransformer } from './execution-row-subtitle-transformer';

describe('executionRowSubtitleTransformer', () => {
  describe('queued with dependencies', () => {
    it('VALID: {status: "queued", dependsOn: ["step-1"]} => returns waiting for slot text', () => {
      const result = executionRowSubtitleTransformer({
        status: ExecutionStepStatusStub({ value: 'queued' }),
        dependsOn: [DependencyLabelStub({ value: 'step-1' })],
        files: [],
      });

      expect(result).toBe('\u2514\u2500 waiting for slot (depends on: step-1)');
    });

    it('VALID: {status: "queued", dependsOn: ["step-1", "step-2"]} => joins multiple deps', () => {
      const result = executionRowSubtitleTransformer({
        status: ExecutionStepStatusStub({ value: 'queued' }),
        dependsOn: [
          DependencyLabelStub({ value: 'step-1' }),
          DependencyLabelStub({ value: 'step-2' }),
        ],
        files: [],
      });

      expect(result).toBe('\u2514\u2500 waiting for slot (depends on: step-1, step-2)');
    });
  });

  describe('pending with dependencies', () => {
    it('VALID: {status: "pending", dependsOn: ["step-1"]} => returns depends on text', () => {
      const result = executionRowSubtitleTransformer({
        status: ExecutionStepStatusStub({ value: 'pending' }),
        dependsOn: [DependencyLabelStub({ value: 'step-1' })],
        files: [],
      });

      expect(result).toBe('\u2514\u2500 depends on: step-1');
    });
  });

  describe('files display', () => {
    it('VALID: {status: "in_progress", files: ["src/auth.ts"]} => returns file list', () => {
      const result = executionRowSubtitleTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        dependsOn: [],
        files: [DisplayFilePathStub({ value: 'src/auth.ts' })],
      });

      expect(result).toBe('\u2514\u2500 src/auth.ts');
    });

    it('VALID: {files: ["a.ts", "b.ts"]} => joins multiple files', () => {
      const result = executionRowSubtitleTransformer({
        status: ExecutionStepStatusStub({ value: 'complete' }),
        dependsOn: [],
        files: [DisplayFilePathStub({ value: 'a.ts' }), DisplayFilePathStub({ value: 'b.ts' })],
      });

      expect(result).toBe('\u2514\u2500 a.ts, b.ts');
    });
  });

  describe('empty subtitle', () => {
    it('EMPTY: {no deps, no files} => returns empty string', () => {
      const result = executionRowSubtitleTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        dependsOn: [],
        files: [],
      });

      expect(result).toBe('');
    });

    it('VALID: {status: "queued", no deps} => returns empty even with files', () => {
      const result = executionRowSubtitleTransformer({
        status: ExecutionStepStatusStub({ value: 'queued' }),
        dependsOn: [],
        files: [DisplayFilePathStub({ value: 'src/auth.ts' })],
      });

      expect(result).toBe('\u2514\u2500 src/auth.ts');
    });
  });
});

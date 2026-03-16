import { StreamTextStub } from '../../contracts/stream-text/stream-text.stub';
import { buildContinuationContextTransformer } from './build-continuation-context-transformer';

describe('buildContinuationContextTransformer', () => {
  describe('both continuationPoint and capturedOutput', () => {
    it('VALID: {continuationPoint and capturedOutput with lines} => returns combined context with output tail', () => {
      const capturedOutput = [
        StreamTextStub({ value: 'Created file utils.ts' }),
        StreamTextStub({ value: 'Writing test cases' }),
      ];

      const result = buildContinuationContextTransformer({
        continuationPoint: 'Resume from gate 3',
        capturedOutput,
      });

      expect(result).toBe(
        'Resume from gate 3\n\n--- Recent agent output ---\nCreated file utils.ts\nWriting test cases',
      );
    });
  });

  describe('only continuationPoint', () => {
    it('VALID: {continuationPoint, empty capturedOutput} => returns continuationPoint as context', () => {
      const result = buildContinuationContextTransformer({
        continuationPoint: 'Resume from gate 3',
        capturedOutput: [],
      });

      expect(result).toBe('Resume from gate 3');
    });
  });

  describe('only capturedOutput', () => {
    it('VALID: {no continuationPoint, capturedOutput with lines} => returns output section only', () => {
      const capturedOutput = [
        StreamTextStub({ value: 'Line one' }),
        StreamTextStub({ value: 'Line two' }),
      ];

      const result = buildContinuationContextTransformer({
        capturedOutput,
      });

      expect(result).toBe('--- Recent agent output ---\nLine one\nLine two');
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no continuationPoint, empty capturedOutput} => returns null', () => {
      const result = buildContinuationContextTransformer({
        capturedOutput: [],
      });

      expect(result).toBeNull();
    });
  });

  describe('output tail trimming', () => {
    it('EDGE: {capturedOutput exceeds 50 lines} => returns only last 50 lines', () => {
      const lines = Array.from({ length: 60 }, (_, index) =>
        StreamTextStub({ value: `Line ${String(index + 1)}` }),
      );

      const result = buildContinuationContextTransformer({
        capturedOutput: lines,
      });

      const expectedLines = Array.from({ length: 50 }, (_, index) => `Line ${String(index + 11)}`);

      expect(result).toBe(`--- Recent agent output ---\n${expectedLines.join('\n')}`);
    });

    it('EDGE: {capturedOutput exactly 50 lines} => returns all 50 lines', () => {
      const lines = Array.from({ length: 50 }, (_, index) =>
        StreamTextStub({ value: `Line ${String(index + 1)}` }),
      );

      const result = buildContinuationContextTransformer({
        capturedOutput: lines,
      });

      const expectedLines = Array.from({ length: 50 }, (_, index) => `Line ${String(index + 1)}`);

      expect(result).toBe(`--- Recent agent output ---\n${expectedLines.join('\n')}`);
    });
  });
});

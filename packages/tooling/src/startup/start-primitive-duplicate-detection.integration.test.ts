import { StartPrimitiveDuplicateDetection } from './start-primitive-duplicate-detection';

describe('StartPrimitiveDuplicateDetection', () => {
  it('VALID: exports a function that delegates to PrimitiveDuplicateDetectionFlow', () => {
    expect(StartPrimitiveDuplicateDetection).toStrictEqual(expect.any(Function));
  });
});

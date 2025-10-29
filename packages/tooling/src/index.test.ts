import { StartPrimitiveDuplicateDetection } from './index';

describe('index', () => {
  it('VALID: exports StartPrimitiveDuplicateDetection', () => {
    expect(StartPrimitiveDuplicateDetection).toBeDefined();
    expect(typeof StartPrimitiveDuplicateDetection).toBe('function');
  });
});

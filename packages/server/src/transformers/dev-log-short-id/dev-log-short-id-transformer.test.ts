import { devLogShortIdTransformer } from './dev-log-short-id-transformer';

describe('devLogShortIdTransformer', () => {
  it('VALID: {standard UUID} => returns first 8 hex chars', () => {
    const result = devLogShortIdTransformer({
      id: '89362ba3-918c-4408-aeb1-f8f4ce8400cb',
    });

    expect(result).toBe('89362ba3');
  });

  it('VALID: {prefixed process ID} => returns first hex segment', () => {
    const result = devLogShortIdTransformer({
      id: 'proc-recovery-1925f6f6-e4b2-48fa-8b80-77e62301cc82',
    });

    expect(result).toBe('1925f6f6');
  });

  it('VALID: {replay process ID} => returns first hex segment', () => {
    const result = devLogShortIdTransformer({
      id: 'replay-e8c8ba78-4e77-4ec4-944a-414c2cc8864f',
    });

    expect(result).toBe('e8c8ba78');
  });

  it('EDGE: {short non-hex string} => returns first 8 chars', () => {
    const result = devLogShortIdTransformer({ id: 'ABCDEFGHIJ' });

    expect(result).toBe('ABCDEFGH');
  });

  it('EDGE: {very short string} => returns full string', () => {
    const result = devLogShortIdTransformer({ id: 'abc' });

    expect(result).toBe('abc');
  });
});

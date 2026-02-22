import { estimateContentTokensTransformer } from './estimate-content-tokens-transformer';

describe('estimateContentTokensTransformer', () => {
  it('VALID: {content: 370 chars} => returns 100', () => {
    const result = estimateContentTokensTransformer({ content: 'x'.repeat(370) });

    expect(result).toBe(100);
  });

  it('VALID: {content: 371 chars} => returns 101 (ceils up)', () => {
    const result = estimateContentTokensTransformer({ content: 'x'.repeat(371) });

    expect(result).toBe(101);
  });

  it('VALID: {content: 3700 chars} => returns 1000', () => {
    const result = estimateContentTokensTransformer({ content: 'x'.repeat(3700) });

    expect(result).toBe(1000);
  });

  it('EDGE: {content: empty string} => returns 0', () => {
    const result = estimateContentTokensTransformer({ content: '' });

    expect(result).toBe(0);
  });
});

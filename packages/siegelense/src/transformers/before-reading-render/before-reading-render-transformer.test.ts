import { beforeReadingRenderTransformer } from './before-reading-render-transformer';

describe('beforeReadingRenderTransformer', () => {
  it('VALID: {source: "window.__test = 1;"} => formats reading with character count', () => {
    const result = beforeReadingRenderTransformer({ source: 'window.__test = 1;' });

    expect(result).toBe('installed init script (18 chars)');
  });

  it('EMPTY: {source: ""} => formats reading with 0 characters', () => {
    const result = beforeReadingRenderTransformer({ source: '' });

    expect(result).toBe('installed init script (0 chars)');
  });
});

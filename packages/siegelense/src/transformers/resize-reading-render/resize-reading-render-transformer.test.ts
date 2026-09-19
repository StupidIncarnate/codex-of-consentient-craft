import { resizeReadingRenderTransformer } from './resize-reading-render-transformer';

describe('resizeReadingRenderTransformer', () => {
  it('VALID: {width: 1280, height: 720} => formats to "resized to 1280x720"', () => {
    const result = resizeReadingRenderTransformer({ width: 1280, height: 720 });

    expect(result).toBe('resized to 1280x720');
  });

  it('VALID: {width: 375, height: 667} => formats mobile viewport', () => {
    const result = resizeReadingRenderTransformer({ width: 375, height: 667 });

    expect(result).toBe('resized to 375x667');
  });
});

import { scrollSourceBuildTransformer } from './scroll-source-build-transformer';

describe('scrollSourceBuildTransformer', () => {
  it('VALID: {by: 400} => scrolls the window down by 400', () => {
    const source = scrollSourceBuildTransformer({
      target: null,
      within: null,
      ref: null,
      by: 400,
      byX: null,
      to: null,
    });

    expect(source).toBe(`(() => {
  window.scrollBy({ top: 400, left: 0, behavior: 'instant' });
  return true;
})()`);
  });

  it('VALID: {byX: -50} => scrolls the window 50 left and none vertically', () => {
    const source = scrollSourceBuildTransformer({
      target: null,
      within: null,
      ref: null,
      by: null,
      byX: -50,
      to: null,
    });

    expect(source).toBe(`(() => {
  window.scrollBy({ top: 0, left: -50, behavior: 'instant' });
  return true;
})()`);
  });

  it('VALID: {to: top} => scrolls the window to y=0', () => {
    const source = scrollSourceBuildTransformer({
      target: null,
      within: null,
      ref: null,
      by: null,
      byX: null,
      to: 'top',
    });

    expect(source).toBe(`(() => {
  window.scrollTo({ top: 0, left: window.scrollX, behavior: 'instant' });
  return true;
})()`);
  });

  it('VALID: {to: bottom} => scrolls the window to the document height', () => {
    const source = scrollSourceBuildTransformer({
      target: null,
      within: null,
      ref: null,
      by: null,
      byX: null,
      to: 'bottom',
    });

    expect(source).toBe(`(() => {
  window.scrollTo({ top: document.documentElement.scrollHeight, left: window.scrollX, behavior: 'instant' });
  return true;
})()`);
  });

  it('VALID: {ref: 26} => brings registry slot 25 into view', () => {
    const source = scrollSourceBuildTransformer({
      target: null,
      within: null,
      ref: 26,
      by: null,
      byX: null,
      to: null,
    });

    expect(source).toBe(`(() => {
  const registry = window.__siege.refs;
  registry[25].scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  return true;
})()`);
  });

  it('VALID: {target} => brings the one matching element into view', () => {
    const source = scrollSourceBuildTransformer({
      target: '[data-testid="PIXEL_BTN"]',
      within: null,
      ref: null,
      by: null,
      byX: null,
      to: null,
    });

    expect(source).toBe(`(() => {
  const found = document.querySelectorAll("[data-testid=\\"PIXEL_BTN\\"]");
  if (found.length !== 1) {
    throw new Error('scroll: ' + String(found.length) + ' elements match ' + "[data-testid=\\"PIXEL_BTN\\"]" + ' — a scroll target must be a CSS selector matching exactly one');
  }
  found[0].scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  return true;
})()`);
  });

  it('VALID: {target, within} => scopes the selector with a descendant combinator', () => {
    const source = scrollSourceBuildTransformer({
      target: '[data-testid="ROW"]',
      within: '[data-testid="LIST"]',
      ref: null,
      by: null,
      byX: null,
      to: null,
    });

    expect(source).toBe(`(() => {
  const found = document.querySelectorAll("[data-testid=\\"LIST\\"] [data-testid=\\"ROW\\"]");
  if (found.length !== 1) {
    throw new Error('scroll: ' + String(found.length) + ' elements match ' + "[data-testid=\\"LIST\\"] [data-testid=\\"ROW\\"]" + ' — a scroll target must be a CSS selector matching exactly one');
  }
  found[0].scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  return true;
})()`);
  });
});

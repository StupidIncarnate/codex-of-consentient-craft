import { ResizeObserver } from './ResizeObserver';

describe('#gateway/browser/ResizeObserver', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(ResizeObserver).toBe(globalThis.ResizeObserver);
  });
});

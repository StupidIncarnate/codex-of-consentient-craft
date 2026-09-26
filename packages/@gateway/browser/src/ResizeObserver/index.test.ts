import { ResizeObserver } from './index';

describe('@dungeonmaster/browser/ResizeObserver', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(ResizeObserver).toBe(globalThis.ResizeObserver);
  });
});

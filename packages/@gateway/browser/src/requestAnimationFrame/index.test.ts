import { requestAnimationFrame } from './index';

describe('@dungeonmaster/browser/requestAnimationFrame', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(requestAnimationFrame).toBe(globalThis.requestAnimationFrame);
  });
});

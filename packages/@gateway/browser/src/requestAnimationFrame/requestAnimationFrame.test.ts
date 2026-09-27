import { requestAnimationFrame } from './requestAnimationFrame';

describe('#gateway/browser/requestAnimationFrame', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(requestAnimationFrame).toBe(globalThis.requestAnimationFrame);
  });
});

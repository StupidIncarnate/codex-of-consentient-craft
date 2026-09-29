import { HTMLElement } from './HTMLElement';

describe('#gateway/browser/HTMLElement', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(HTMLElement).toBe(globalThis.HTMLElement);
  });
});

import { Element } from './Element';

describe('#gateway/browser/Element', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(Element).toBe(globalThis.Element);
  });
});

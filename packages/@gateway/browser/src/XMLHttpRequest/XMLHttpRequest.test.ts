import { XMLHttpRequest } from './XMLHttpRequest';

describe('#gateway/browser/XMLHttpRequest', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(XMLHttpRequest).toBe(globalThis.XMLHttpRequest);
  });
});

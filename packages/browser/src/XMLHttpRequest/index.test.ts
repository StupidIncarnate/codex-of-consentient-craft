import { XMLHttpRequest } from './index';

describe('@dungeonmaster/browser/XMLHttpRequest', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(XMLHttpRequest).toBe(globalThis.XMLHttpRequest);
  });
});

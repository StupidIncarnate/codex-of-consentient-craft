import { document } from './document';

describe('#gateway/browser/document', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(document).toBe(globalThis.document);
  });
});

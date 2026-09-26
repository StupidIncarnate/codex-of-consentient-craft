import { document } from './index';

describe('@dungeonmaster/browser/document', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(document).toBe(globalThis.document);
  });
});

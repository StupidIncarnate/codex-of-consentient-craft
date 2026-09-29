import { Text } from './Text';

describe('#gateway/browser/Text', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(Text).toBe(globalThis.Text);
  });
});

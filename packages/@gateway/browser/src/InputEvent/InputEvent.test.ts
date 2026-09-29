import { InputEvent } from './InputEvent';

describe('#gateway/browser/InputEvent', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(InputEvent).toBe(globalThis.InputEvent);
  });
});

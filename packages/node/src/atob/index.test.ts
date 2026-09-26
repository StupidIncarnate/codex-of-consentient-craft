import { atob } from './index';

describe('@dungeonmaster/node/atob', () => {
  it('VALID: {export} => is the same function Node provides on globalThis', () => {
    expect(atob).toBe(globalThis.atob);
  });

  it('VALID: {value: "aGk="} => decodes real base64', () => {
    expect(atob('aGk=')).toBe('hi');
  });

  it('ERROR: {value: "not base64!!"} => throws DOMException Invalid character, uncaught by design', () => {
    expect(() => atob('not base64!!')).toThrow(/Invalid character/u);
  });
});

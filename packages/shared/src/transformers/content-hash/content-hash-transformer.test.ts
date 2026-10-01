import { contentHashTransformer } from './content-hash-transformer';

describe('contentHashTransformer', () => {
  it('VALID: {text: "abc"} => returns its sha256 hex digest', () => {
    expect(contentHashTransformer({ text: 'abc' })).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('EMPTY: {text: ""} => returns the digest of empty input', () => {
    expect(contentHashTransformer({ text: '' })).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

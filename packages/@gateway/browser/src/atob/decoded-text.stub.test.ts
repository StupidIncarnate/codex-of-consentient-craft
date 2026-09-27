import { DecodedTextStub } from './decoded-text.stub';

describe('DecodedTextStub', () => {
  it('VALID: {} => decodes the default base64 sample to "hello"', () => {
    expect(DecodedTextStub()).toBe('hello');
  });

  it('VALID: {base64} => decodes the given base64 string', () => {
    expect(DecodedTextStub({ base64: 'd29ybGQ=' })).toBe('world');
  });
});

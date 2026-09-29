import { EncodedBase64Stub } from './encoded-base64.stub';

describe('EncodedBase64Stub', () => {
  it('VALID: {} => encodes the default sample to "aGVsbG8="', () => {
    expect(EncodedBase64Stub()).toBe('aGVsbG8=');
  });

  it('VALID: {text} => encodes the given text', () => {
    expect(EncodedBase64Stub({ text: 'world' })).toBe('d29ybGQ=');
  });
});

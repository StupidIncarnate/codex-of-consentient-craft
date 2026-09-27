import { BufferInstanceStub } from './buffer-instance.stub';

describe('BufferInstanceStub', () => {
  it('VALID: {} => defaults to the utf8 bytes of "hello"', () => {
    const buffer = BufferInstanceStub();

    expect(buffer.toString('utf8')).toBe('hello');
  });

  it('VALID: {text} => encodes the given text as utf8 bytes', () => {
    const buffer = BufferInstanceStub({ text: 'world' });

    expect(buffer.toString('utf8')).toBe('world');
  });

  it('VALID: {} => is a real Buffer instance', () => {
    const buffer = BufferInstanceStub();

    expect(Buffer.isBuffer(buffer)).toBe(true);
  });
});

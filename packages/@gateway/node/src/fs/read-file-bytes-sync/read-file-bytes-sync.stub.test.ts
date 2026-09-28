import { ReadFileBytesSyncStub } from './read-file-bytes-sync.stub';

describe('ReadFileBytesSyncStub', () => {
  it('VALID: {} => defaults to the utf8 bytes of "hello"', () => {
    const buffer = ReadFileBytesSyncStub();

    expect(buffer.toString('utf8')).toBe('hello');
  });

  it('VALID: {text} => encodes the given text as utf8 bytes', () => {
    const buffer = ReadFileBytesSyncStub({ text: 'world' });

    expect(buffer.toString('utf8')).toBe('world');
  });

  it('VALID: {bytes} => returns the provided buffer directly', () => {
    const custom = Buffer.from([1, 2, 3]);
    const buffer = ReadFileBytesSyncStub({ bytes: custom });

    expect(buffer).toStrictEqual(custom);
  });

  it('VALID: {} => is a real Buffer instance', () => {
    const buffer = ReadFileBytesSyncStub();

    expect(Buffer.isBuffer(buffer)).toBe(true);
  });
});

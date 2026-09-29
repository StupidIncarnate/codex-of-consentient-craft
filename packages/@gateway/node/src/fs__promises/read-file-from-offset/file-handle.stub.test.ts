import { FileHandleStub } from './file-handle.stub';

describe('FileHandleStub', () => {
  it('VALID: {size: 5} => stat reports that size', async () => {
    const handle = FileHandleStub({ size: 5, contents: 'hello' });

    const stats = await handle.stat();

    expect(stats.size).toBe(5);
  });

  it('VALID: {contents: "hello"} => read writes the contents into the buffer at the offset', async () => {
    const handle = FileHandleStub({ size: 5, contents: 'hello' });
    const buffer = Buffer.alloc(5);

    const result = await handle.read(buffer, 0, 5, 0);

    expect({ bytesRead: result.bytesRead, text: buffer.toString('utf8') }).toStrictEqual({
      bytesRead: 5,
      text: 'hello',
    });
  });

  it('VALID: {} => close resolves', async () => {
    const handle = FileHandleStub({ size: 0, contents: '' });

    await expect(handle.close()).resolves.toBe(undefined);
  });
});

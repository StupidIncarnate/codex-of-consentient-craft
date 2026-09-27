import { FileReaderStub } from './file-reader.stub';

describe('FileReaderStub', () => {
  it('VALID: {} => a real, idle FileReader', () => {
    const reader = FileReaderStub();

    expect({
      isFileReader: reader instanceof FileReader,
      readyState: reader.readyState,
    }).toStrictEqual({ isFileReader: true, readyState: FileReader.EMPTY });
  });

  it('VALID: {readAsText(realBlob)} => actually reads the blob content', async () => {
    const reader = FileReaderStub();
    const resultPromise = new Promise<string>((resolve) => {
      reader.addEventListener('load', () => {
        resolve(String(reader.result));
      });
    });

    reader.readAsText(new Blob(['hello from a real Blob']));

    await expect(resultPromise).resolves.toBe('hello from a real Blob');
  });
});

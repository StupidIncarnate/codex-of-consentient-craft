import { LineReaderHandleStub } from './line-reader-handle.stub';

describe('LineReaderHandleStub', () => {
  it('VALID: {} => a real handle that dispatches the default line to onLine', async () => {
    const reader = LineReaderHandleStub();

    const receivedLine = await new Promise<string>((resolve) => {
      reader.onLine(resolve);
    });

    expect(receivedLine).toBe('stub-line');
  });

  it('VALID: {line} => dispatches the given line to onLine', async () => {
    const reader = LineReaderHandleStub({ line: 'custom-line' });

    const receivedLine = await new Promise<string>((resolve) => {
      reader.onLine(resolve);
    });

    expect(receivedLine).toBe('custom-line');
  });
});

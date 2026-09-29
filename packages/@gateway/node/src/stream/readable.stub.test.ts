import { ReadableStub } from './readable.stub';

describe('ReadableStub', () => {
  it('VALID: {chunks: ["a","b"]} => yields exactly those chunks in order', async () => {
    const received: unknown[] = [];

    for await (const chunk of ReadableStub({ chunks: ['a', 'b'] })) {
      received.push(chunk);
    }

    expect(received).toStrictEqual(['a', 'b']);
  });

  it('VALID: {} => yields the default single chunk', async () => {
    const received: unknown[] = [];

    for await (const chunk of ReadableStub()) {
      received.push(chunk);
    }

    expect(received).toStrictEqual(['chunk']);
  });
});

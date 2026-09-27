import { Writable } from 'node:stream';
import { StdioServerTransportStub } from './stdio-server-transport.stub';

describe('StdioServerTransportStub', () => {
  it('VALID: {stdout} => a real transport that writes a real newline-delimited JSON-RPC message', async () => {
    const written: string[] = [];
    const stdout = new Writable({
      write: (chunk: Buffer, _encoding, callback): void => {
        written.push(chunk.toString('utf8'));
        callback();
      },
    });
    const transport = StdioServerTransportStub({ stdout });

    await transport.send({ jsonrpc: '2.0', method: 'gateway/stub', params: {} });

    expect(written).toStrictEqual(['{"jsonrpc":"2.0","method":"gateway/stub","params":{}}\n']);
  });
});

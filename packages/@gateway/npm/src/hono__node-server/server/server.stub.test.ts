import { ServerStub } from './server.stub';

describe('ServerStub', () => {
  it('VALID: {} => a real server that starts listening and can be closed cleanly', async () => {
    const server = ServerStub();

    await new Promise<void>((resolve) => {
      server.on('listening', resolve);
    });

    const closeError = await new Promise<Error | undefined>((resolve) => {
      server.close((error) => {
        resolve(error);
      });
    });

    expect(closeError).toBe(undefined);
  });
});

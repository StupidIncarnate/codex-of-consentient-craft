import { ServerStub } from './server.stub';

describe('ServerStub', () => {
  it('VALID: {} => a real Server with no client connected yet', () => {
    const server = ServerStub();

    expect(server.getClientVersion()).toBe(undefined);
  });
});

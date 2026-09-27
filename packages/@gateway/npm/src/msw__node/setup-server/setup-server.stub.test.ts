import { SetupServerStub } from './setup-server.stub';

describe('SetupServerStub', () => {
  it('VALID: {} => a real SetupServerApi exposing real listen/close/resetHandlers functions', () => {
    const server = SetupServerStub();

    expect({
      listen: server.listen.name,
      close: server.close.name,
      resetHandlers: server.resetHandlers.name,
    }).toStrictEqual({ listen: 'listen', close: 'close', resetHandlers: 'resetHandlers' });
  });
});

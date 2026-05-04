import { wsServerNpmPackagesStatics } from './ws-server-npm-packages-statics';

describe('wsServerNpmPackagesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(wsServerNpmPackagesStatics).toStrictEqual({
      npmPackages: ['@hono/node-ws', 'ws', 'socket.io', 'engine.io'],
    });
  });
});

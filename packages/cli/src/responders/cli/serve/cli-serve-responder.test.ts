import { CliServeResponderProxy } from './cli-serve-responder.proxy';

const SERVER_URL = 'http://dungeonmaster.localhost:3737';

describe('CliServeResponder', () => {
  describe('server start', () => {
    it('VALID: {default config} => calls StartServer on the imported module', async () => {
      const StartServer = jest.fn();
      const proxy = CliServeResponderProxy({ StartServer });
      proxy.setupPlatform({ platform: 'linux' });

      await proxy.callResponder();

      expect(StartServer).toHaveBeenCalledTimes(1);
    });

    it('VALID: {default config} => starts the server in web-bundle serving mode', async () => {
      const StartServer = jest.fn();
      const proxy = CliServeResponderProxy({ StartServer });
      proxy.setupPlatform({ platform: 'linux' });

      await proxy.callResponder();

      expect(StartServer).toHaveBeenCalledWith({ serveWebBundle: true });
    });

    it('VALID: {default config} => writes server URL to stdout', async () => {
      const StartServer = jest.fn();
      const proxy = CliServeResponderProxy({ StartServer });
      proxy.setupPlatform({ platform: 'linux' });

      await proxy.callResponder();

      expect(proxy.getStdoutOutput()).toStrictEqual([
        `Dungeonmaster server running at ${SERVER_URL}\n`,
      ]);
    });
  });

  describe('browser open', () => {
    it('VALID: {platform: darwin} => opens browser with the open command', async () => {
      const StartServer = jest.fn();
      const proxy = CliServeResponderProxy({ StartServer });
      proxy.setupPlatform({ platform: 'darwin' });

      await expect(proxy.callResponder()).resolves.toBe(undefined);

      expect(proxy.getBrowserOpenCalls({ command: `open ${SERVER_URL}` })).toStrictEqual([
        [`open ${SERVER_URL}`],
      ]);
    });

    it('VALID: {platform: win32} => opens browser with the start command', async () => {
      const StartServer = jest.fn();
      const proxy = CliServeResponderProxy({ StartServer });
      proxy.setupPlatform({ platform: 'win32' });

      await expect(proxy.callResponder()).resolves.toBe(undefined);

      expect(proxy.getBrowserOpenCalls({ command: `start ${SERVER_URL}` })).toStrictEqual([
        [`start ${SERVER_URL}`],
      ]);
    });

    it('VALID: {platform: linux} => opens browser with the xdg-open command', async () => {
      const StartServer = jest.fn();
      const proxy = CliServeResponderProxy({ StartServer });
      proxy.setupPlatform({ platform: 'linux' });

      await expect(proxy.callResponder()).resolves.toBe(undefined);

      expect(proxy.getBrowserOpenCalls({ command: `xdg-open ${SERVER_URL}` })).toStrictEqual([
        [`xdg-open ${SERVER_URL}`],
      ]);
    });
  });
});

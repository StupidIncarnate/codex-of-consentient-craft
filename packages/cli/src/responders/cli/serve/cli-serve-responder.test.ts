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
    // runFireAndForgetProxy addresses its mock by the exact command staged (setupSuccess), so a
    // response other than {success: true} below means the responder built a different command
    // than this platform's — the mock throws unconditionally on an unaddressed call.
    it('VALID: {platform: darwin} => opens browser with the open command', async () => {
      const StartServer = jest.fn();
      const proxy = CliServeResponderProxy({ StartServer });
      proxy.setupPlatform({ platform: 'darwin' });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {platform: win32} => opens browser with the start command', async () => {
      const StartServer = jest.fn();
      const proxy = CliServeResponderProxy({ StartServer });
      proxy.setupPlatform({ platform: 'win32' });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {platform: linux} => opens browser with the xdg-open command', async () => {
      const StartServer = jest.fn();
      const proxy = CliServeResponderProxy({ StartServer });
      proxy.setupPlatform({ platform: 'linux' });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({ success: true });
    });
  });
});

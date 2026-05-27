import { clipboardWriteAdapter } from './clipboard-write-adapter';
import { clipboardWriteAdapterProxy } from './clipboard-write-adapter.proxy';

describe('clipboardWriteAdapter', () => {
  describe('successful writes', () => {
    it('VALID: {text: "/dumpster-launch"} => writes text to clipboard', async () => {
      const proxy = clipboardWriteAdapterProxy();

      proxy.succeeds();

      await expect(clipboardWriteAdapter({ text: '/dumpster-launch' })).resolves.toStrictEqual({
        success: true,
      });
      expect(proxy.getWrittenText()).toBe('/dumpster-launch');
    });
  });

  describe('error cases', () => {
    it('ERROR: {text: anything, clipboard rejects} => propagates the rejection', async () => {
      const proxy = clipboardWriteAdapterProxy();

      proxy.throws({ error: new Error('NotAllowedError: write blocked') });

      await expect(clipboardWriteAdapter({ text: '/dumpster-launch' })).rejects.toThrow(
        /NotAllowedError/u,
      );
    });
  });
});

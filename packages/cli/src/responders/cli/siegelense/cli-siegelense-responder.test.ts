import { CliSiegelenseResponderProxy } from './cli-siegelense-responder.proxy';

describe('CliSiegelenseResponder', () => {
  describe('driver route', () => {
    it('VALID: {args: [driver, --instance, inst_7f3a]} => delegates with those args', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['driver', '--instance', 'inst_7f3a'] });

      expect(StartSiegelense).toHaveBeenCalledWith({ args: ['driver', '--instance', 'inst_7f3a'] });
    });
  });

  describe('bare fleet route', () => {
    it('VALID: {args: []} => delegates with an empty list', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: [] });

      expect(StartSiegelense).toHaveBeenCalledWith({ args: [] });
    });
  });

  describe('status route', () => {
    it('VALID: {args: [status]} => delegates with those args rather than rejecting it as unknown', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['status'] });

      expect(StartSiegelense).toHaveBeenCalledWith({ args: ['status'] });
    });

    it('VALID: {args: [status, --instance, inst_7f3a]} => delegates with those args', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['status', '--instance', 'inst_7f3a'] });

      expect(StartSiegelense).toHaveBeenCalledWith({ args: ['status', '--instance', 'inst_7f3a'] });
    });
  });

  describe('cleanup route', () => {
    it('VALID: {args: [cleanup]} => delegates with those args rather than rejecting it as unknown', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['cleanup'] });

      expect(StartSiegelense).toHaveBeenCalledWith({ args: ['cleanup'] });
    });
  });

  describe('missing --instance', () => {
    it('INVALID: {args: [driver]} => throws naming the --instance flag', async () => {
      const proxy = CliSiegelenseResponderProxy();

      await expect(proxy.callResponder({ args: ['driver'] })).rejects.toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.\n\nUsage: dungeonmaster siegelense \[driver --instance <instanceId> \| status \[--instance <instanceId>\] \| cleanup\]$/u,
      );
    });

    it('INVALID: {args: [driver, --instance]} => throws naming the --instance flag when the flag is the last argument', async () => {
      const proxy = CliSiegelenseResponderProxy();

      await expect(proxy.callResponder({ args: ['driver', '--instance'] })).rejects.toThrow(
        /^--instance is required/u,
      );
    });
  });

  describe('unknown subcommand', () => {
    it('INVALID: {args: [bogus]} => throws naming the unknown subcommand', async () => {
      const proxy = CliSiegelenseResponderProxy();

      await expect(proxy.callResponder({ args: ['bogus'] })).rejects.toThrow(
        /^Unknown siegelense subcommand: bogus\n\nUsage: dungeonmaster siegelense \[driver --instance <instanceId> \| status \[--instance <instanceId>\] \| cleanup\]$/u,
      );
    });
  });

  describe('module resolution failure', () => {
    it('ERROR: {module not found} => the error names the package rather than the specifier', async () => {
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupImportFailure({
        error: new Error("Cannot find module '/repo/packages/siegelense/dist/startup.js'"),
      });

      await expect(proxy.callResponder({ args: [] })).rejects.toThrow(
        /^Failed to load @dungeonmaster\/siegelense: Cannot find module '\/repo\/packages\/siegelense\/dist\/startup\.js'$/u,
      );
    });
  });
});

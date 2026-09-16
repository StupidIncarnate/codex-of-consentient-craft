import { CliSiegelenseResponderProxy } from './cli-siegelense-responder.proxy';

describe('CliSiegelenseResponder', () => {
  describe('driver route', () => {
    it('VALID: {args: [driver, --instance, inst_7f3a]} => delegates with those args', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['driver', '--instance', 'inst_7f3a'] });

      expect(StartSiegelense.mock.calls).toStrictEqual([
        [{ args: ['driver', '--instance', 'inst_7f3a'] }],
      ]);
    });
  });

  describe('bare fleet route', () => {
    it('VALID: {args: []} => forwards as an empty array', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: [] });

      expect(StartSiegelense.mock.calls).toStrictEqual([[{ args: [] }]]);
    });
  });

  describe('status route', () => {
    it('VALID: {args: [status]} => delegates with those args rather than rejecting it as unknown', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['status'] });

      expect(StartSiegelense.mock.calls).toStrictEqual([[{ args: ['status'] }]]);
    });

    it('VALID: {args: [status, --instance, inst_7f3a]} => StartSiegelense receives exactly those args', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['status', '--instance', 'inst_7f3a'] });

      expect(StartSiegelense.mock.calls).toStrictEqual([
        [{ args: ['status', '--instance', 'inst_7f3a'] }],
      ]);
    });
  });

  describe('cleanup route', () => {
    it('VALID: {args: [cleanup]} => delegates with those args rather than rejecting it as unknown', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['cleanup'] });

      expect(StartSiegelense.mock.calls).toStrictEqual([[{ args: ['cleanup'] }]]);
    });
  });

  describe('no CLI-side subcommand or flag validation', () => {
    // SiegelenseFlow is the single source of truth for which subcommand exists and what its
    // flags are. This layer forwards verbatim, so a name it has never heard of — capacity is a
    // real siegelense call that is simply not built yet — passes straight through rather than
    // being refused here. The refusal, if any, belongs one layer down.
    it('VALID: {args: [capacity]} => forwards verbatim rather than refusing an unrecognised subcommand', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['capacity'] });

      expect(StartSiegelense.mock.calls).toStrictEqual([[{ args: ['capacity'] }]]);
    });

    it('VALID: {args: [driver]} => forwards verbatim with no --instance pre-check', async () => {
      const StartSiegelense = jest.fn().mockResolvedValue({ success: true });
      const proxy = CliSiegelenseResponderProxy();
      proxy.setupModule({ StartSiegelense });

      await proxy.callResponder({ args: ['driver'] });

      expect(StartSiegelense.mock.calls).toStrictEqual([[{ args: ['driver'] }]]);
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

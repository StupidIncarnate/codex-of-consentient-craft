import { E2eNotConfiguredError } from './e2e-not-configured-error';

describe('E2eNotConfiguredError', () => {
  describe('constructor()', () => {
    it('VALID: {specName: "api"} => names devServer.e2e.processes and the spec, sets name', () => {
      const error = new E2eNotConfiguredError({ specName: 'api' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'E2eNotConfiguredError',
        message:
          'siegelense has no e2e lane configured for spec "api": add devServer.e2e.processes ' +
          "to .dungeonmaster.json, naming the no-watch command(s) that boot this repo's own app — " +
          'the same way this repo\'s own Playwright e2e setup boots it. "dungeonmaster init" seeds a ' +
          'placeholder entry; edit devServer.e2e.processes[0].command (and portRole/readyPath) to point ' +
          "at this repo's real no-watch dev command before running a lane.",
      });
    });

    it('VALID: {specName: "stack"} => names the browsered spec instead', () => {
      const error = new E2eNotConfiguredError({ specName: 'stack' });

      expect(
        error.message.startsWith('siegelense has no e2e lane configured for spec "stack":'),
      ).toBe(true);
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof E2eNotConfiguredError => returns true', () => {
      const error = new E2eNotConfiguredError({ specName: 'api' });

      expect(error instanceof E2eNotConfiguredError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new E2eNotConfiguredError({ specName: 'api' });

      expect(error instanceof Error).toBe(true);
    });
  });
});

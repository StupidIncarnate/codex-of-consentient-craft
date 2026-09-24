import { devServerE2eProcessContract } from './dev-server-e2e-process-contract';
import { DevServerE2eProcessStub } from './dev-server-e2e-process.stub';

describe('devServerE2eProcessContract', () => {
  describe('valid processes', () => {
    it('VALID: {name, command, portRole, readyPath} => parses successfully', () => {
      const process = DevServerE2eProcessStub({
        name: 'app',
        command: 'npm run dev:no-watch',
        portRole: 'api',
        readyPath: '/',
      });

      const result = devServerE2eProcessContract.parse(process);

      expect(result).toStrictEqual({
        name: 'app',
        command: 'npm run dev:no-watch',
        portRole: 'api',
        readyPath: '/',
      });
    });

    it('VALID: {portRole: "web"} => parses successfully', () => {
      const process = DevServerE2eProcessStub({
        name: 'web',
        command: 'npx vite preview --strictPort',
        portRole: 'web',
        readyPath: '/',
      });

      const result = devServerE2eProcessContract.parse(process);

      expect(result.portRole).toBe('web');
    });

    it('VALID: {env: {PORT: "{apiPort}"}} => keeps the env map', () => {
      const process = DevServerE2eProcessStub({ env: { PORT: '{apiPort}' } });

      const result = devServerE2eProcessContract.parse(process);

      expect(result.env).toStrictEqual({ PORT: '{apiPort}' });
    });

    it('EMPTY: {no env} => env is undefined', () => {
      const process = DevServerE2eProcessStub();

      const result = devServerE2eProcessContract.parse(process);

      expect(result.env).toBe(undefined);
    });
  });

  describe('invalid processes', () => {
    it('INVALID: {name: ""} => throws validation error', () => {
      expect(() => {
        return devServerE2eProcessContract.parse({
          name: '',
          command: 'npm run dev:no-watch',
          portRole: 'api',
          readyPath: '/',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {command: ""} => throws validation error', () => {
      expect(() => {
        return devServerE2eProcessContract.parse({
          name: 'app',
          command: '',
          portRole: 'api',
          readyPath: '/',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {readyPath: ""} => throws validation error', () => {
      expect(() => {
        return devServerE2eProcessContract.parse({
          name: 'app',
          command: 'npm run dev:no-watch',
          portRole: 'api',
          readyPath: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {portRole: "db"} => throws validation error', () => {
      expect(() => {
        return devServerE2eProcessContract.parse({
          name: 'app',
          command: 'npm run dev:no-watch',
          portRole: 'db',
          readyPath: '/',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing name, command, portRole and readyPath} => throws validation error', () => {
      expect(() => {
        return devServerE2eProcessContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});

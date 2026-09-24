import { laneSpecFindBroker } from './lane-spec-find-broker';
import { laneSpecFindBrokerProxy } from './lane-spec-find-broker.proxy';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { E2eNotConfiguredError } from '../../../errors/e2e-not-configured/e2e-not-configured-error';
import { e2eProcessPlaceholderStatics } from '@dungeonmaster/config';

describe('laneSpecFindBroker', () => {
  describe('a configured repo', () => {
    it('VALID: {specName: "api"} => returns the validated, browserless spec built from devServer.e2e.processes', async () => {
      const proxy = laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'api' });
      proxy.setupConfiguredProcesses({
        processes: [
          {
            name: 'api',
            command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
            portRole: 'api',
            readyPath: '/api/guilds',
            env: { PORT: '{apiPort}' },
          },
        ],
      });

      const result = await laneSpecFindBroker({ specName });

      expect(result.browser).toBe(false);
    });

    it('VALID: {specName: "stack"} => returns the validated, browsered spec built from the same config', async () => {
      const proxy = laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'stack' });
      proxy.setupConfiguredProcesses({
        processes: [
          {
            name: 'api',
            command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
            portRole: 'api',
            readyPath: '/api/guilds',
            env: { PORT: '{apiPort}' },
          },
        ],
      });

      const result = await laneSpecFindBroker({ specName });

      expect(result.browser).toBe(true);
    });

    it('VALID: {two configured processes} => builds one LaneProcess per configured entry, each spawned through sh -c', async () => {
      const proxy = laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'stack' });
      proxy.setupConfiguredProcesses({
        processes: [
          {
            name: 'api',
            command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
            portRole: 'api',
            readyPath: '/api/guilds',
          },
          {
            name: 'web',
            command: 'npx vite preview --strictPort',
            portRole: 'web',
            readyPath: '/',
          },
        ],
      });

      const result = await laneSpecFindBroker({ specName });

      expect(
        result.processes.map((process) => ({
          name: process.name,
          command: process.command,
          args: process.args,
          portRole: process.portRole,
          readyPath: process.readyPath,
          logFileName: process.logFileName,
        })),
      ).toStrictEqual([
        {
          name: 'api',
          command: 'sh',
          args: ['-c', 'npm run dev:no-watch --workspace=@dungeonmaster/server'],
          portRole: 'api',
          readyPath: '/api/guilds',
          logFileName: 'api-server.log',
        },
        {
          name: 'web',
          command: 'sh',
          args: ['-c', 'npx vite preview --strictPort'],
          portRole: 'web',
          readyPath: '/',
          logFileName: 'web-server.log',
        },
      ]);
    });
  });

  describe('devServer.e2e is absent', () => {
    it('ERROR: {no devServer.e2e in the resolved config} => throws E2eNotConfiguredError naming devServer.e2e.processes', async () => {
      const proxy = laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'api' });
      proxy.setupE2eAbsent();

      const caughtError = (await laneSpecFindBroker({ specName }).catch(
        (error: unknown) => error,
      )) as E2eNotConfiguredError;

      expect(caughtError instanceof E2eNotConfiguredError).toBe(true);
      expect(caughtError.message).toMatch(/devServer\.e2e\.processes/u);
    });

    it('ERROR: {devServer itself absent from config} => throws the same named error', async () => {
      const proxy = laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'api' });
      proxy.setupDevServerAbsent();

      await expect(laneSpecFindBroker({ specName })).rejects.toThrow(E2eNotConfiguredError);
    });
  });

  describe('devServer.e2e.processes is the unedited placeholder', () => {
    it('ERROR: {the seeded placeholder, unedited} => throws E2eNotConfiguredError', async () => {
      const proxy = laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'api' });
      proxy.setupConfiguredProcesses({ processes: [e2eProcessPlaceholderStatics.process] });

      await expect(laneSpecFindBroker({ specName })).rejects.toThrow(E2eNotConfiguredError);
    });
  });

  describe('an unknown spec name', () => {
    it('ERROR: {specName: "nightly"} => throws naming the spec and the known convention names', async () => {
      laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'nightly' });

      await expect(laneSpecFindBroker({ specName })).rejects.toThrow(
        /^Unknown lane spec "nightly"\. Known specs: stack, api$/u,
      );
    });
  });
});

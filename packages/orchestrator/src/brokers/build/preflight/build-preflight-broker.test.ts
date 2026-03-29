import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { buildPreflightBroker } from './build-preflight-broker';
import { buildPreflightBrokerProxy } from './build-preflight-broker.proxy';

describe('buildPreflightBroker', () => {
  describe('successful build', () => {
    it('VALID: {build exits 0} => returns success true with exitCode 0', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildSuccess();

      const result = await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        success: true,
        output: 'Build succeeded',
        exitCode: 0,
      });
    });

    it('VALID: {build command has multiple args} => splits command and args correctly', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildSuccess();

      await buildPreflightBroker({
        buildCommand: 'npm run build --workspace=@dungeonmaster/shared',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getSpawnedCommand()).toBe('npm');
      expect(proxy.getSpawnedArgs()).toStrictEqual([
        'run',
        'build',
        '--workspace=@dungeonmaster/shared',
      ]);
    });
  });

  describe('failed build', () => {
    it('VALID: {build exits 1} => returns success false with exitCode 1', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildFailure({
        exitCode: ExitCodeStub({ value: 1 }),
        output: 'src/index.ts(5,3): error TS2345: Argument of type...',
      });

      const result = await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        success: false,
        output: 'src/index.ts(5,3): error TS2345: Argument of type...',
        exitCode: 1,
      });
    });

    it('VALID: {build exits 2} => returns success false with exitCode 2', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildFailure({
        exitCode: ExitCodeStub({ value: 2 }),
        output: 'Compilation error',
      });

      const result = await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        success: false,
        output: 'Compilation error',
        exitCode: 2,
      });
    });
  });

  describe('process error', () => {
    it('ERROR: {spawn throws} => returns success false with exitCode 1', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildError({ error: new Error('ENOENT: command not found') });

      const result = await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        success: false,
        output: '',
        exitCode: 1,
      });
    });
  });

  describe('empty build command', () => {
    it('EDGE: {empty buildCommand} => returns success false without spawning', async () => {
      buildPreflightBrokerProxy();

      const result = await buildPreflightBroker({
        buildCommand: '',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        success: false,
        output: 'Build command is empty',
        exitCode: 1,
      });
    });
  });
});

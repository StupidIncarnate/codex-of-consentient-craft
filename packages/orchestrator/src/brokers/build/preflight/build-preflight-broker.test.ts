import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  ExitCodeStub,
} from '@dungeonmaster/shared/contracts';

import { buildPreflightBroker } from './build-preflight-broker';
import { buildPreflightBrokerProxy } from './build-preflight-broker.proxy';

type StreamedLine = ReturnType<typeof ErrorMessageStub>;

describe('buildPreflightBroker', () => {
  describe('successful build', () => {
    it('VALID: {build exits 0} => returns success true with exitCode 0', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildSuccess({ command: 'npm' });

      const result = await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        output: 'Build succeeded',
        exitCode: 0,
      });
    });

    it('VALID: {build command has multiple args} => splits command and args correctly', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildSuccess({ command: 'npm' });

      await buildPreflightBroker({
        buildCommand: 'npm run build --workspace=@dungeonmaster/shared',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: () => undefined,
      });

      expect(proxy.getSpawnedCommand({ command: 'npm' })).toBe('npm');
      expect(proxy.getSpawnedArgs({ command: 'npm' })).toStrictEqual([
        'run',
        'build',
        '--workspace=@dungeonmaster/shared',
      ]);
    });
  });

  describe('live streaming', () => {
    it('VALID: {build writes three stdout lines} => onLine receives exactly those lines, in order', async () => {
      const proxy = buildPreflightBrokerProxy();
      const streamed: StreamedLine[] = [];
      proxy.setupBuildStdoutLines({
        command: 'npm',
        lines: [
          '> @dungeonmaster/shared@1.0.0 build',
          'tsc -b packages/shared',
          'Build succeeded in 4.2s',
        ],
      });

      await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(streamed).toStrictEqual([
        '> @dungeonmaster/shared@1.0.0 build',
        'tsc -b packages/shared',
        'Build succeeded in 4.2s',
      ]);
    });

    it('VALID: {build writes three stdout lines} => the returned output is those same lines joined', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildStdoutLines({
        command: 'npm',
        lines: [
          '> @dungeonmaster/shared@1.0.0 build',
          'tsc -b packages/shared',
          'Build succeeded in 4.2s',
        ],
      });

      const result = await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        output:
          '> @dungeonmaster/shared@1.0.0 build\ntsc -b packages/shared\nBuild succeeded in 4.2s',
        exitCode: 0,
      });
    });

    it('EMPTY: {empty buildCommand} => onLine receives nothing at all', async () => {
      buildPreflightBrokerProxy();
      const streamed: StreamedLine[] = [];

      await buildPreflightBroker({
        buildCommand: '',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(streamed).toStrictEqual([]);
    });
  });

  describe('failed build', () => {
    it('VALID: {build exits 1} => returns success false with exitCode 1', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildFailure({
        command: 'npm',
        exitCode: ExitCodeStub({ value: 1 }),
        output: 'src/index.ts(5,3): error TS2345: Argument of type...',
      });

      const result = await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: () => undefined,
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
        command: 'npm',
        exitCode: ExitCodeStub({ value: 2 }),
        output: 'Compilation error',
      });

      const result = await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: false,
        output: 'Compilation error',
        exitCode: 2,
      });
    });

    it('VALID: {build exits 2 after writing two error lines} => both lines still reached onLine', async () => {
      const proxy = buildPreflightBrokerProxy();
      const streamed: StreamedLine[] = [];
      proxy.setupBuildFailure({
        command: 'npm',
        exitCode: ExitCodeStub({ value: 2 }),
        output: 'src/index.ts(5,3): error TS2345\nFound 1 error.',
      });

      await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(streamed).toStrictEqual(['src/index.ts(5,3): error TS2345', 'Found 1 error.']);
    });
  });

  describe('process error', () => {
    it('ERROR: {spawn throws} => returns success false with exitCode 1', async () => {
      const proxy = buildPreflightBrokerProxy();
      proxy.setupBuildError({ command: 'npm', error: new Error('ENOENT: command not found') });

      const result = await buildPreflightBroker({
        buildCommand: 'npm run build',
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: () => undefined,
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
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: false,
        output: 'Build command is empty',
        exitCode: 1,
      });
    });
  });
});

import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  ExitCodeStub,
} from '@dungeonmaster/shared/contracts';

import { buildUntilGreenBroker } from './build-until-green-broker';
import { buildUntilGreenBrokerProxy } from './build-until-green-broker.proxy';

type StreamedLine = ReturnType<typeof ErrorMessageStub>;

describe('buildUntilGreenBroker', () => {
  describe('first pass succeeds', () => {
    it('VALID: {build succeeds on the first pass} => returns success with that pass output after exactly one invocation', async () => {
      const proxy = buildUntilGreenBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const buildCommand = 'npm run build';
      proxy.setupBuildSuccess({ command: 'npm' });

      const result = await buildUntilGreenBroker({
        buildCommand,
        cwd,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ success: true, output: 'Build succeeded' });
      expect(proxy.getSpawnedArgsList({ command: 'npm' })).toStrictEqual([['run', 'build']]);
    });
  });

  describe('first pass fails, second pass succeeds', () => {
    it('VALID: {first pass fails, second pass succeeds} => returns success with the SECOND pass output after exactly two invocations', async () => {
      const proxy = buildUntilGreenBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const buildCommand = 'npm run build';
      proxy.setupFirstPassFailsSecondSucceeds({
        command: 'npm',
        failOutput: 'TS6305: Output file has not been built from source file',
        successOutput: 'Build succeeded',
      });

      const result = await buildUntilGreenBroker({
        buildCommand,
        cwd,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ success: true, output: 'Build succeeded' });
      expect(proxy.getSpawnedArgsList({ command: 'npm' })).toStrictEqual([
        ['run', 'build'],
        ['run', 'build'],
      ]);
    });
  });

  describe('every pass fails', () => {
    it('ERROR: {every pass fails} => returns success false carrying the last pass output after exactly three invocations', async () => {
      const proxy = buildUntilGreenBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const buildCommand = 'npm run build';
      proxy.setupBuildFailure({
        command: 'npm',
        exitCode: ExitCodeStub({ value: 2 }),
        output: 'tsc exited with code 2',
      });

      const result = await buildUntilGreenBroker({
        buildCommand,
        cwd,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ success: false, output: 'tsc exited with code 2' });
      expect(proxy.getSpawnedArgsList({ command: 'npm' })).toStrictEqual([
        ['run', 'build'],
        ['run', 'build'],
        ['run', 'build'],
      ]);
    });
  });

  describe('explicit passesRemaining of 1', () => {
    it('ERROR: {passesRemaining: 1, build fails} => returns success false after exactly one invocation, with no recursion', async () => {
      const proxy = buildUntilGreenBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const buildCommand = 'npm run build';
      proxy.setupBuildFailure({
        command: 'npm',
        exitCode: ExitCodeStub({ value: 2 }),
        output: 'tsc exited with code 2',
      });

      const result = await buildUntilGreenBroker({
        buildCommand,
        cwd,
        onLine: () => undefined,
        passesRemaining: 1,
      });

      expect(result).toStrictEqual({ success: false, output: 'tsc exited with code 2' });
      expect(proxy.getSpawnedArgsList({ command: 'npm' })).toStrictEqual([['run', 'build']]);
    });
  });

  describe('live streaming', () => {
    it('VALID: {build succeeds on the first pass} => onLine receives the pass-1 banner followed by that pass output', async () => {
      const proxy = buildUntilGreenBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];
      proxy.setupBuildStdoutLines({
        command: 'npm',
        lines: ['tsc -b packages/shared', 'Build succeeded in 4.2s'],
      });

      await buildUntilGreenBroker({
        buildCommand: 'npm run build',
        cwd,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(streamed).toStrictEqual([
        '— build pass 1/3 —',
        'tsc -b packages/shared',
        'Build succeeded in 4.2s',
      ]);
    });

    it('VALID: {first pass fails, second succeeds} => onLine receives a banner per pass, each followed by that pass output', async () => {
      const proxy = buildUntilGreenBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];
      proxy.setupFirstPassFailsSecondSucceeds({
        command: 'npm',
        failOutput: 'TS6305: Output file has not been built from source file',
        successOutput: 'Build succeeded',
      });

      await buildUntilGreenBroker({
        buildCommand: 'npm run build',
        cwd,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(streamed).toStrictEqual([
        '— build pass 1/3 —',
        'TS6305: Output file has not been built from source file',
        '— build pass 2/3 —',
        'Build succeeded',
      ]);
    });

    it('ERROR: {every pass fails} => onLine receives all three banners and all three passes of output', async () => {
      const proxy = buildUntilGreenBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];
      proxy.setupBuildFailure({
        command: 'npm',
        exitCode: ExitCodeStub({ value: 2 }),
        output: 'tsc exited with code 2',
      });

      await buildUntilGreenBroker({
        buildCommand: 'npm run build',
        cwd,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(streamed).toStrictEqual([
        '— build pass 1/3 —',
        'tsc exited with code 2',
        '— build pass 2/3 —',
        'tsc exited with code 2',
        '— build pass 3/3 —',
        'tsc exited with code 2',
      ]);
    });
  });
});

import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { buildUntilGreenLayerBroker } from './build-until-green-layer-broker';
import { buildUntilGreenLayerBrokerProxy } from './build-until-green-layer-broker.proxy';

describe('buildUntilGreenLayerBroker', () => {
  describe('first pass succeeds', () => {
    it('VALID: {build succeeds on the first pass} => returns success with that pass output after exactly one invocation', async () => {
      const proxy = buildUntilGreenLayerBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const buildCommand = 'npm run build';
      proxy.setupBuildSuccess({ command: 'npm' });

      const result = await buildUntilGreenLayerBroker({ buildCommand, cwd });

      expect(result).toStrictEqual({ success: true, output: 'Build succeeded' });
      expect(proxy.getSpawnedArgsList({ command: 'npm' })).toStrictEqual([['run', 'build']]);
    });
  });

  describe('first pass fails, second pass succeeds', () => {
    it('VALID: {first pass fails, second pass succeeds} => returns success with the SECOND pass output after exactly two invocations', async () => {
      const proxy = buildUntilGreenLayerBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const buildCommand = 'npm run build';
      proxy.setupFirstPassFailsSecondSucceeds({
        command: 'npm',
        failOutput: 'TS6305: Output file has not been built from source file',
        successOutput: 'Build succeeded',
      });

      const result = await buildUntilGreenLayerBroker({ buildCommand, cwd });

      expect(result).toStrictEqual({ success: true, output: 'Build succeeded' });
      expect(proxy.getSpawnedArgsList({ command: 'npm' })).toStrictEqual([
        ['run', 'build'],
        ['run', 'build'],
      ]);
    });
  });

  describe('every pass fails', () => {
    it('ERROR: {every pass fails} => returns success false carrying the last pass output after exactly three invocations', async () => {
      const proxy = buildUntilGreenLayerBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const buildCommand = 'npm run build';
      proxy.setupBuildFailure({
        command: 'npm',
        exitCode: ExitCodeStub({ value: 2 }),
        output: 'tsc exited with code 2',
      });

      const result = await buildUntilGreenLayerBroker({ buildCommand, cwd });

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
      const proxy = buildUntilGreenLayerBrokerProxy();
      const cwd = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const buildCommand = 'npm run build';
      proxy.setupBuildFailure({
        command: 'npm',
        exitCode: ExitCodeStub({ value: 2 }),
        output: 'tsc exited with code 2',
      });

      const result = await buildUntilGreenLayerBroker({ buildCommand, cwd, passesRemaining: 1 });

      expect(result).toStrictEqual({ success: false, output: 'tsc exited with code 2' });
      expect(proxy.getSpawnedArgsList({ command: 'npm' })).toStrictEqual([['run', 'build']]);
    });
  });
});

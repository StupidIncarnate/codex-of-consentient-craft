import { QuestIdStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { pathseekerSpawnBroker } from './pathseeker-spawn-broker';
import { pathseekerSpawnBrokerProxy } from './pathseeker-spawn-broker.proxy';
import { cliStatics } from '../../../statics/cli/cli-statics';

describe('pathseekerSpawnBroker', () => {
  describe('successful spawns', () => {
    it('VALID: {questId: "add-auth"} => spawns claude with pathseeker prompt and exits with code 0', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await pathseekerSpawnBroker({ questId });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: {questId: "feature-dark-mode"} => spawns claude and exits with code 0', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const questId = QuestIdStub({ value: 'feature-dark-mode' });

      const result = await pathseekerSpawnBroker({ questId });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: {questId: "x"} => spawns claude with minimal quest id and exits with code 0', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const questId = QuestIdStub({ value: 'x' });

      const result = await pathseekerSpawnBroker({ questId });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: spawns with claude command from PATH => not a constructed path', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const questId = QuestIdStub({ value: 'add-auth' });

      await pathseekerSpawnBroker({ questId });

      expect(proxy.getSpawnedCommand()).toBe(cliStatics.commands.claude);
    });
  });

  describe('non-zero exit codes', () => {
    it('VALID: agent process exits with code 1 => returns exit code 1', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({ exitCode });

      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await pathseekerSpawnBroker({ questId });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: agent process exits with code 130 (SIGINT) => returns exit code 130', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 130 });
      proxy.setupSuccess({ exitCode });

      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await pathseekerSpawnBroker({ questId });

      expect(result.exitCode).toBe(exitCode);
    });
  });

  describe('spawn errors', () => {
    it('ERROR: claude binary not found => rejects with error', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const error = new Error('ENOENT: claude command not found');
      proxy.setupError({ error });

      const questId = QuestIdStub({ value: 'add-auth' });

      await expect(pathseekerSpawnBroker({ questId })).rejects.toThrow(
        'ENOENT: claude command not found',
      );
    });

    it('ERROR: spawn fails with permission error => rejects with error', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const error = new Error('EACCES: permission denied');
      proxy.setupError({ error });

      const questId = QuestIdStub({ value: 'add-auth' });

      await expect(pathseekerSpawnBroker({ questId })).rejects.toThrow('EACCES: permission denied');
    });
  });

  describe('edge cases', () => {
    it('EDGE: questId with numbers => spawns claude with numeric quest id', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const questId = QuestIdStub({ value: '001-add-auth' });

      const result = await pathseekerSpawnBroker({ questId });

      expect(result.exitCode).toBe(exitCode);
    });

    it('EDGE: questId with special characters => spawns claude with special chars in prompt', async () => {
      const proxy = pathseekerSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const questId = QuestIdStub({ value: 'feature_with-mixed_case' });

      const result = await pathseekerSpawnBroker({ questId });

      expect(result.exitCode).toBe(exitCode);
    });
  });
});

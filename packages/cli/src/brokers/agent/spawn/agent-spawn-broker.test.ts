import { agentSpawnBroker } from './agent-spawn-broker';
import { agentSpawnBrokerProxy } from './agent-spawn-broker.proxy';
import { UserInputStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { cliStatics } from '../../../statics/cli/cli-statics';

describe('agentSpawnBroker', () => {
  describe('successful spawns', () => {
    it('VALID: {userInput: "Create auth system"} => spawns claude with pathseeker prompt and exits with code 0', async () => {
      const proxy = agentSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const userInput = UserInputStub({ value: 'Create auth system' });

      const result = await agentSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: {userInput: "Add dark mode toggle"} => spawns claude and exits with code 0', async () => {
      const proxy = agentSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const userInput = UserInputStub({ value: 'Add dark mode toggle' });

      const result = await agentSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: {userInput: ""} => spawns claude with empty context and exits with code 0', async () => {
      const proxy = agentSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const userInput = UserInputStub({ value: '' });

      const result = await agentSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: spawns with claude command from PATH => not a constructed path', async () => {
      const proxy = agentSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const userInput = UserInputStub({ value: 'Create feature' });

      await agentSpawnBroker({ userInput });

      expect(proxy.getSpawnedCommand()).toBe(cliStatics.commands.claude);
    });
  });

  describe('non-zero exit codes', () => {
    it('VALID: agent process exits with code 1 => returns exit code 1', async () => {
      const proxy = agentSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({ exitCode });

      const userInput = UserInputStub({ value: 'Create feature' });

      const result = await agentSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: agent process exits with code 130 (SIGINT) => returns exit code 130', async () => {
      const proxy = agentSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 130 });
      proxy.setupSuccess({ exitCode });

      const userInput = UserInputStub({ value: 'Create feature' });

      const result = await agentSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });
  });

  describe('spawn errors', () => {
    it('ERROR: claude binary not found => rejects with error', async () => {
      const proxy = agentSpawnBrokerProxy();
      const error = new Error('ENOENT: claude command not found');
      proxy.setupError({ error });

      const userInput = UserInputStub({ value: 'Create feature' });

      await expect(agentSpawnBroker({ userInput })).rejects.toThrow(
        'ENOENT: claude command not found',
      );
    });

    it('ERROR: spawn fails with permission error => rejects with error', async () => {
      const proxy = agentSpawnBrokerProxy();
      const error = new Error('EACCES: permission denied');
      proxy.setupError({ error });

      const userInput = UserInputStub({ value: 'Create feature' });

      await expect(agentSpawnBroker({ userInput })).rejects.toThrow('EACCES: permission denied');
    });
  });

  describe('edge cases', () => {
    it('EDGE: userInput with multiline text => spawns claude with multiline prompt', async () => {
      const proxy = agentSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const userInput = UserInputStub({ value: 'Create feature\nwith multiple lines\nof context' });

      const result = await agentSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('EDGE: userInput with special characters => spawns claude with escaped content', async () => {
      const proxy = agentSpawnBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode });

      const userInput = UserInputStub({ value: 'Create "auth" with $variables & symbols' });

      const result = await agentSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });
  });
});

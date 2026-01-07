import { FilePathStub, UserInputStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { chaoswhispererSpawnBroker } from './chaoswhisperer-spawn-broker';
import { chaoswhispererSpawnBrokerProxy } from './chaoswhisperer-spawn-broker.proxy';

describe('chaoswhispererSpawnBroker', () => {
  describe('successful spawns', () => {
    it('VALID: {userInput: "I need user authentication"} => spawns claude with ChaosWhisperer prompt and exits with code 0', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const userInput = UserInputStub({ value: 'I need user authentication' });

      const result = await chaoswhispererSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: {userInput: "Add dark mode toggle"} => spawns claude and exits with code 0', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/my-project' });
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const userInput = UserInputStub({ value: 'Add dark mode toggle' });

      const result = await chaoswhispererSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: {userInput: "x"} => spawns claude with minimal user input and exits with code 0', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const userInput = UserInputStub({ value: 'x' });

      const result = await chaoswhispererSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });
  });

  describe('non-zero exit codes', () => {
    it('VALID: agent process exits with code 1 => returns exit code 1', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const userInput = UserInputStub({ value: 'I need user authentication' });

      const result = await chaoswhispererSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: agent process exits with code 130 (SIGINT) => returns exit code 130', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 130 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const userInput = UserInputStub({ value: 'I need user authentication' });

      const result = await chaoswhispererSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });
  });

  describe('spawn errors', () => {
    it('ERROR: claude binary not found => rejects with error', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const error = new Error('ENOENT: claude command not found');
      proxy.setupError({ projectRoot, error });

      const userInput = UserInputStub({ value: 'I need user authentication' });

      await expect(chaoswhispererSpawnBroker({ userInput })).rejects.toThrow(
        'ENOENT: claude command not found',
      );
    });

    it('ERROR: spawn fails with permission error => rejects with error', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const error = new Error('EACCES: permission denied');
      proxy.setupError({ projectRoot, error });

      const userInput = UserInputStub({ value: 'I need user authentication' });

      await expect(chaoswhispererSpawnBroker({ userInput })).rejects.toThrow(
        'EACCES: permission denied',
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: userInput with multiline content => spawns claude with multiline prompt', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const userInput = UserInputStub({
        value: 'I need:\n1. User authentication\n2. Password reset\n3. Email verification',
      });

      const result = await chaoswhispererSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('EDGE: userInput with special characters => spawns claude with special chars in prompt', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const userInput = UserInputStub({
        value: "Add support for @mentions, #hashtags, and $variables in user's input",
      });

      const result = await chaoswhispererSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });

    it('EDGE: userInput with unicode characters => spawns claude with unicode in prompt', async () => {
      const proxy = chaoswhispererSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const userInput = UserInputStub({
        value: 'Add internationalization support for Japanese: \u65e5\u672c\u8a9e',
      });

      const result = await chaoswhispererSpawnBroker({ userInput });

      expect(result.exitCode).toBe(exitCode);
    });
  });
});

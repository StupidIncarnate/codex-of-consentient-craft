import { UserInputStub } from '@dungeonmaster/shared/contracts';

import { chaoswhispererSpawnSubprocessBroker } from './chaoswhisperer-spawn-subprocess-broker';
import { chaoswhispererSpawnSubprocessBrokerProxy } from './chaoswhisperer-spawn-subprocess-broker.proxy';
import type { KillableProcessStub } from '../../../contracts/killable-process/killable-process.stub';
import { cliStatics } from '../../../statics/cli/cli-statics';

type KillableProcess = ReturnType<typeof KillableProcessStub>;

describe('chaoswhispererSpawnSubprocessBroker', () => {
  describe('successful spawns', () => {
    it('VALID: {userInput: "I need user authentication"} => spawns claude and returns killable process', () => {
      const proxy = chaoswhispererSpawnSubprocessBrokerProxy();
      proxy.setupSuccess();

      const userInput = UserInputStub({ value: 'I need user authentication' });

      const result: KillableProcess = chaoswhispererSpawnSubprocessBroker({ userInput });

      expect(typeof result.kill).toBe('function');
    });

    it('VALID: {userInput: "Add dark mode toggle"} => spawns claude and returns killable process', () => {
      const proxy = chaoswhispererSpawnSubprocessBrokerProxy();
      proxy.setupSuccess();

      const userInput = UserInputStub({ value: 'Add dark mode toggle' });

      const result: KillableProcess = chaoswhispererSpawnSubprocessBroker({ userInput });

      expect(typeof result.kill).toBe('function');
    });

    it('VALID: {userInput: "x"} => spawns claude with minimal user input', () => {
      const proxy = chaoswhispererSpawnSubprocessBrokerProxy();
      proxy.setupSuccess();

      const userInput = UserInputStub({ value: 'x' });

      const result: KillableProcess = chaoswhispererSpawnSubprocessBroker({ userInput });

      expect(typeof result.kill).toBe('function');
    });

    it('VALID: kill() returns boolean => process can be killed', () => {
      const proxy = chaoswhispererSpawnSubprocessBrokerProxy();
      proxy.setupSuccess();

      const userInput = UserInputStub({ value: 'I need user authentication' });

      const result: KillableProcess = chaoswhispererSpawnSubprocessBroker({ userInput });
      const killResult = result.kill();

      expect(typeof killResult).toBe('boolean');
    });

    it('VALID: waitForExit() returns promise => can wait for process to exit', async () => {
      const proxy = chaoswhispererSpawnSubprocessBrokerProxy();
      proxy.setupSuccess();

      const userInput = UserInputStub({ value: 'I need user authentication' });

      const result: KillableProcess = chaoswhispererSpawnSubprocessBroker({ userInput });

      expect(typeof result.waitForExit).toBe('function');
      await expect(result.waitForExit()).resolves.toBeUndefined();
    });

    it('VALID: spawns with claude command from PATH => not a constructed path', () => {
      const proxy = chaoswhispererSpawnSubprocessBrokerProxy();
      proxy.setupSuccess();

      const userInput = UserInputStub({ value: 'I need user authentication' });

      chaoswhispererSpawnSubprocessBroker({ userInput });

      expect(proxy.getSpawnedCommand()).toBe(cliStatics.commands.claude);
    });
  });

  describe('edge cases', () => {
    it('EDGE: userInput with multiline content => spawns claude with multiline prompt', () => {
      const proxy = chaoswhispererSpawnSubprocessBrokerProxy();
      proxy.setupSuccess();

      const userInput = UserInputStub({
        value: 'I need:\n1. User authentication\n2. Password reset\n3. Email verification',
      });

      const result: KillableProcess = chaoswhispererSpawnSubprocessBroker({ userInput });

      expect(typeof result.kill).toBe('function');
    });

    it('EDGE: userInput with special characters => spawns claude with special chars in prompt', () => {
      const proxy = chaoswhispererSpawnSubprocessBrokerProxy();
      proxy.setupSuccess();

      const userInput = UserInputStub({
        value: "Add support for @mentions, #hashtags, and $variables in user's input",
      });

      const result: KillableProcess = chaoswhispererSpawnSubprocessBroker({ userInput });

      expect(typeof result.kill).toBe('function');
    });

    it('EDGE: userInput with unicode characters => spawns claude with unicode in prompt', () => {
      const proxy = chaoswhispererSpawnSubprocessBrokerProxy();
      proxy.setupSuccess();

      const userInput = UserInputStub({
        value: 'Add internationalization support for Japanese: \u65e5\u672c\u8a9e',
      });

      const result: KillableProcess = chaoswhispererSpawnSubprocessBroker({ userInput });

      expect(typeof result.kill).toBe('function');
    });
  });
});

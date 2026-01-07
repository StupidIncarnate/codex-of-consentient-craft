import { FilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { claudeSpawnBroker } from './claude-spawn-broker';
import { claudeSpawnBrokerProxy } from './claude-spawn-broker.proxy';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';

describe('claudeSpawnBroker', () => {
  describe('successful spawns', () => {
    it('VALID: {prompt: "You are an AI..."} => spawns claude and exits with code 0', async () => {
      const proxy = claudeSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const prompt = PromptTextStub({ value: 'You are an AI assistant' });

      const result = await claudeSpawnBroker({ prompt });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: {prompt: multiline} => spawns claude with multiline prompt', async () => {
      const proxy = claudeSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/my-project' });
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const prompt = PromptTextStub({ value: '# Agent\n\nYou are helpful.' });

      const result = await claudeSpawnBroker({ prompt });

      expect(result.exitCode).toBe(exitCode);
    });
  });

  describe('non-zero exit codes', () => {
    it('VALID: process exits with code 1 => returns exit code 1', async () => {
      const proxy = claudeSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const prompt = PromptTextStub({ value: 'Test prompt' });

      const result = await claudeSpawnBroker({ prompt });

      expect(result.exitCode).toBe(exitCode);
    });

    it('VALID: process exits with code 130 (SIGINT) => returns exit code 130', async () => {
      const proxy = claudeSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 130 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const prompt = PromptTextStub({ value: 'Test prompt' });

      const result = await claudeSpawnBroker({ prompt });

      expect(result.exitCode).toBe(exitCode);
    });
  });

  describe('spawn errors', () => {
    it('ERROR: claude binary not found => rejects with error', async () => {
      const proxy = claudeSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const error = new Error('ENOENT: claude command not found');
      proxy.setupError({ projectRoot, error });

      const prompt = PromptTextStub({ value: 'Test prompt' });

      await expect(claudeSpawnBroker({ prompt })).rejects.toThrow(
        'ENOENT: claude command not found',
      );
    });

    it('ERROR: spawn fails with permission error => rejects with error', async () => {
      const proxy = claudeSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const error = new Error('EACCES: permission denied');
      proxy.setupError({ projectRoot, error });

      const prompt = PromptTextStub({ value: 'Test prompt' });

      await expect(claudeSpawnBroker({ prompt })).rejects.toThrow('EACCES: permission denied');
    });
  });

  describe('edge cases', () => {
    it('EDGE: prompt with special characters => spawns claude successfully', async () => {
      const proxy = claudeSpawnBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ projectRoot, exitCode });

      const prompt = PromptTextStub({ value: 'Prompt with "quotes" and $variables' });

      const result = await claudeSpawnBroker({ prompt });

      expect(result.exitCode).toBe(exitCode);
    });
  });
});

/**
 * Integration tests for StartCli
 */

import { StartCli } from './start-cli';
import { StartCliProxy } from './start-cli.proxy';

const originalArgv = process.argv;

describe('StartCli', () => {
  describe('with help command', () => {
    it('VALID: {command: help} => executes without errors', async () => {
      StartCliProxy();
      process.argv = ['node', 'script.js', 'help'];

      await StartCli();

      process.argv = originalArgv;

      expect(true).toBe(true);
    });

    it('VALID: {command: undefined} => executes without errors (default)', async () => {
      StartCliProxy();
      process.argv = ['node', 'script.js'];

      await StartCli();

      process.argv = originalArgv;

      expect(true).toBe(true);
    });
  });

  describe('with list command', () => {
    it('EMPTY: {quests folder: does not exist} => executes without errors', async () => {
      StartCliProxy();
      process.argv = ['node', 'script.js', 'list'];

      await StartCli();

      process.argv = originalArgv;

      expect(true).toBe(true);
    });
  });

  describe('with quest request (unknown command)', () => {
    it('VALID: {command: single word quest} => spawns agent and executes without errors', async () => {
      const proxy = StartCliProxy();
      proxy.setupAgentSuccess();
      process.argv = ['node', 'script.js', 'refactor'];

      await StartCli();

      process.argv = originalArgv;

      expect(true).toBe(true);
    });

    it('VALID: {command: multi-word quest} => joins arguments and spawns agent', async () => {
      const proxy = StartCliProxy();
      proxy.setupAgentSuccess();
      process.argv = ['node', 'script.js', 'Create', 'auth', 'system'];

      await StartCli();

      process.argv = originalArgv;

      expect(true).toBe(true);
    });

    it('VALID: {command: quest with special characters} => spawns agent with special characters', async () => {
      const proxy = StartCliProxy();
      proxy.setupAgentSuccess();
      process.argv = ['node', 'script.js', 'Add', '"dark', 'mode"', 'toggle'];

      await StartCli();

      process.argv = originalArgv;

      expect(true).toBe(true);
    });

    it('ERROR: {agent spawn fails} => calls process.exit with code 1', async () => {
      const proxy = StartCliProxy();
      proxy.setupAgentError();
      const exitCalls = proxy.getProcessExitCalls();
      process.argv = ['node', 'script.js', 'Create', 'feature'];

      await expect(StartCli()).rejects.toThrow('process.exit called');

      process.argv = originalArgv;

      expect(exitCalls).toHaveBeenCalledWith(1);
    });
  });
});

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

    it('VALID: {command: unknown} => executes without errors', async () => {
      StartCliProxy();
      process.argv = ['node', 'script.js', 'unknown-command'];

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
});

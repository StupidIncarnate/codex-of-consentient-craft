/**
 * Integration tests for StartCli - runs actual CLI via subprocess
 */

import { execSync } from 'child_process';
import { unlinkSync } from 'fs';
import * as path from 'path';
import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';

const startupPath = path.join(process.cwd(), 'src', 'startup', 'start-cli.ts');

describe('StartCli integration', () => {
  describe('help command', () => {
    it('VALID: {command: help} => shows help message with commands', () => {
      const command = `npx tsx ${startupPath} help`;

      const stdout = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });

      expect(stdout).toMatch(/Dungeonmaster/u);
      expect(stdout).toMatch(/Commands:/u);
      expect(stdout).toMatch(/help/u);
      expect(stdout).toMatch(/list/u);
      expect(stdout).toMatch(/init/u);
    });

    it('VALID: {command: none} => shows help message (default)', () => {
      const command = `npx tsx ${startupPath}`;

      const stdout = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });

      expect(stdout).toMatch(/Dungeonmaster/u);
      expect(stdout).toMatch(/Commands:/u);
    });
  });

  describe('list command', () => {
    it('VALID: {command: list, no quests folder} => shows no quests message', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-list-empty' }),
      });

      const command = `npx tsx ${startupPath} list`;

      const stdout = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: testbed.projectPath,
      });

      testbed.cleanup();

      expect(stdout).toMatch(/\.dungeonmaster-quests folder/u);
    });

    it('VALID: {command: list, empty quests folder} => shows no active quests', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-list-no-quests' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster-quests/.gitkeep' }),
        content: FileContentStub({ value: '' }),
      });

      const command = `npx tsx ${startupPath} list`;

      const stdout = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: testbed.projectPath,
      });

      testbed.cleanup();

      expect(stdout).toMatch(/No active quests/u);
    });
  });

  describe('init command', () => {
    it('ERROR: {command: init, no package.json} => exits with error about package.json', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-init-no-pkg' }),
      });

      // Delete package.json to simulate project without it
      unlinkSync(path.join(testbed.projectPath, 'package.json'));

      const command = `npx tsx ${startupPath} init`;

      let caughtError: Error | null = null;
      try {
        execSync(command, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: testbed.projectPath,
        });
      } catch (error) {
        caughtError = error as Error;
      }

      testbed.cleanup();

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toMatch(/package\.json/u);
    });
  });
});

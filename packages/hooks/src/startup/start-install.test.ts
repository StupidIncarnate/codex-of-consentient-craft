import { StartInstall } from './start-install';
import { StartInstallProxy } from './start-install.proxy';
import {
  InstallContextStub,
  FilePathStub,
  FileContentsStub,
} from '@dungeonmaster/shared/contracts';

describe('StartInstall', () => {
  describe('install()', () => {
    it('VALID: settings.json does not exist => creates new file with hooks', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const settingsPath = FilePathStub({ value: '/project/.claude/settings.json' });
      const expectedContents = FileContentsStub({
        value: JSON.stringify(
          {
            hooks: {
              PreToolUse: [
                {
                  matcher: 'Write|Edit|MultiEdit',
                  hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
                },
              ],
              SessionStart: [
                {
                  hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
                },
              ],
            },
          },
          null,
          2,
        ),
      });

      proxy.pathJoin.returns({ result: settingsPath });
      proxy.fsReadFile.throws({ error: new Error('ENOENT: file not found') });
      proxy.fsWriteFile.succeeds({ filepath: settingsPath, contents: expectedContents });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'created',
        message: 'Created .claude/settings.json with hooks',
      });
    });

    it('VALID: settings.json exists with dungeonmaster hooks => skips installation', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const settingsPath = FilePathStub({ value: '/project/.claude/settings.json' });
      const existingContents = FileContentsStub({
        value: JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: 'Write|Edit|MultiEdit',
                hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
              },
            ],
          },
        }),
      });

      proxy.pathJoin.returns({ result: settingsPath });
      proxy.fsReadFile.returns({ contents: existingContents });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'skipped',
        message: 'Hooks already configured',
      });
    });

    it('VALID: settings.json exists without dungeonmaster hooks => merges hooks', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const settingsPath = FilePathStub({ value: '/project/.claude/settings.json' });
      const existingContents = FileContentsStub({
        value: JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [{ type: 'command', command: 'other-hook' }],
              },
            ],
          },
        }),
      });

      const expectedMergedContents = FileContentsStub({
        value: JSON.stringify(
          {
            hooks: {
              PreToolUse: [
                {
                  matcher: 'Bash',
                  hooks: [{ type: 'command', command: 'other-hook' }],
                },
                {
                  matcher: 'Write|Edit|MultiEdit',
                  hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
                },
              ],
              SessionStart: [
                {
                  hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
                },
              ],
            },
          },
          null,
          2,
        ),
      });

      proxy.pathJoin.returns({ result: settingsPath });
      proxy.fsReadFile.returns({ contents: existingContents });
      proxy.fsWriteFile.succeeds({ filepath: settingsPath, contents: expectedMergedContents });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });
    });

    it('VALID: settings.json exists without hooks property => merges hooks', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const settingsPath = FilePathStub({ value: '/project/.claude/settings.json' });
      const existingContents = FileContentsStub({
        value: JSON.stringify({
          tools: { someTool: 'enabled' },
          env: { NODE_ENV: 'production' },
        }),
      });

      const expectedMergedContents = FileContentsStub({
        value: JSON.stringify(
          {
            tools: { someTool: 'enabled' },
            env: { NODE_ENV: 'production' },
            hooks: {
              PreToolUse: [
                {
                  matcher: 'Write|Edit|MultiEdit',
                  hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
                },
              ],
              SessionStart: [
                {
                  hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
                },
              ],
            },
          },
          null,
          2,
        ),
      });

      proxy.pathJoin.returns({ result: settingsPath });
      proxy.fsReadFile.returns({ contents: existingContents });
      proxy.fsWriteFile.succeeds({ filepath: settingsPath, contents: expectedMergedContents });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });
    });

    it('VALID: settings.json exists with invalid JSON => creates new file', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const settingsPath = FilePathStub({ value: '/project/.claude/settings.json' });
      const invalidContents = FileContentsStub({ value: 'invalid json{' });
      const expectedContents = FileContentsStub({
        value: JSON.stringify(
          {
            hooks: {
              PreToolUse: [
                {
                  matcher: 'Write|Edit|MultiEdit',
                  hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
                },
              ],
              SessionStart: [
                {
                  hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
                },
              ],
            },
          },
          null,
          2,
        ),
      });

      proxy.pathJoin.returns({ result: settingsPath });
      proxy.fsReadFile.returns({ contents: invalidContents });
      proxy.fsWriteFile.succeeds({ filepath: settingsPath, contents: expectedContents });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'created',
        message: 'Created .claude/settings.json with hooks',
      });
    });

    it('VALID: settings.json has other settings => preserves them when merging', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const settingsPath = FilePathStub({ value: '/project/.claude/settings.json' });
      const existingContents = FileContentsStub({
        value: JSON.stringify({
          tools: { bash: 'enabled', grep: 'enabled' },
          env: { DEBUG: 'true' },
          permissions: { read: true, write: true },
        }),
      });

      const expectedMergedContents = FileContentsStub({
        value: JSON.stringify(
          {
            tools: { bash: 'enabled', grep: 'enabled' },
            env: { DEBUG: 'true' },
            permissions: { read: true, write: true },
            hooks: {
              PreToolUse: [
                {
                  matcher: 'Write|Edit|MultiEdit',
                  hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
                },
              ],
              SessionStart: [
                {
                  hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
                },
              ],
            },
          },
          null,
          2,
        ),
      });

      proxy.pathJoin.returns({ result: settingsPath });
      proxy.fsReadFile.returns({ contents: existingContents });
      proxy.fsWriteFile.succeeds({ filepath: settingsPath, contents: expectedMergedContents });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });
    });
  });
});

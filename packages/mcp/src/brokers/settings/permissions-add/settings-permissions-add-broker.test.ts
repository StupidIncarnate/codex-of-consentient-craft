import { settingsPermissionsAddBroker } from './settings-permissions-add-broker';
import { settingsPermissionsAddBrokerProxy } from './settings-permissions-add-broker.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

describe('settingsPermissionsAddBroker', () => {
  describe('no existing settings file', () => {
    it('VALID: {targetProjectRoot: /project, settings: none} => creates settings with MCP + git permissions', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = '/project';
      const settingsPath = '/project/.claude/settings.json';

      proxy.setupNoExistingSettings({ targetProjectRoot, settingsPath });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        `${JSON.stringify(
          {
            permissions: {
              allow: [
                'mcp__dungeonmaster__discover',
                'mcp__dungeonmaster__get-architecture',
                'mcp__dungeonmaster__get-folder-detail',
                'mcp__dungeonmaster__get-testing-patterns',
                'mcp__dungeonmaster__get-quest',
                'mcp__dungeonmaster__modify-quest',
                'mcp__dungeonmaster__signal-back',
                'mcp__dungeonmaster__start-quest',
                'mcp__dungeonmaster__get-quest-status',
                'mcp__dungeonmaster__list-quests',
                'mcp__dungeonmaster__list-guilds',
                'mcp__dungeonmaster__ask-user-question',
                'mcp__dungeonmaster__get-agent-prompt',
                'mcp__dungeonmaster__get-project-map',
                'mcp__dungeonmaster__get-quest-planning-notes',
                'mcp__dungeonmaster__get-blight-checklist',
                'mcp__dungeonmaster__get-project-inventory',
                'mcp__dungeonmaster__create-quest',
                'mcp__dungeonmaster__get-server-config',
                'mcp__dungeonmaster__get-quest-summary',
                'mcp__dungeonmaster__create-worktree',
                'mcp__dungeonmaster__quest-work',
                'mcp__dungeonmaster__get-quest-work',
                'Bash(git status:*)',
                'Bash(git log:*)',
                'Bash(git diff:*)',
                'Bash(git show:*)',
                'Bash(git add:*)',
                'Bash(git rm:*)',
                'Bash(git mv:*)',
                'Bash(git commit:*)',
                'Bash(git checkout:*)',
                'Bash(git merge:*)',
                'Bash(git push:*)',
                'Bash(git rev-parse:*)',
                'Bash(git merge-base:*)',
                'mcp__claude-in-chrome',
                'Bash(curl:*)',
                'Bash(dungeonmaster siegelense:*)',
                'Bash(kill:*)',
                'Bash(lsof:*)',
                'Bash(ps:*)',
                'Bash(python3:*)',
              ],
            },
          },
          null,
          2,
        )}\n`,
      );
    });
  });

  describe('existing settings file with no permissions', () => {
    it('VALID: {targetProjectRoot: /project, settings: hooks only} => adds permissions to existing settings', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = '/project';
      const settingsPath = '/project/.claude/settings.json';
      const existingContents = JSON.stringify({ hooks: { PreToolUse: [] } });

      proxy.setupExistingSettings({ targetProjectRoot, settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        `${JSON.stringify(
          {
            hooks: { PreToolUse: [] },
            permissions: {
              allow: [
                'mcp__dungeonmaster__discover',
                'mcp__dungeonmaster__get-architecture',
                'mcp__dungeonmaster__get-folder-detail',
                'mcp__dungeonmaster__get-testing-patterns',
                'mcp__dungeonmaster__get-quest',
                'mcp__dungeonmaster__modify-quest',
                'mcp__dungeonmaster__signal-back',
                'mcp__dungeonmaster__start-quest',
                'mcp__dungeonmaster__get-quest-status',
                'mcp__dungeonmaster__list-quests',
                'mcp__dungeonmaster__list-guilds',
                'mcp__dungeonmaster__ask-user-question',
                'mcp__dungeonmaster__get-agent-prompt',
                'mcp__dungeonmaster__get-project-map',
                'mcp__dungeonmaster__get-quest-planning-notes',
                'mcp__dungeonmaster__get-blight-checklist',
                'mcp__dungeonmaster__get-project-inventory',
                'mcp__dungeonmaster__create-quest',
                'mcp__dungeonmaster__get-server-config',
                'mcp__dungeonmaster__get-quest-summary',
                'mcp__dungeonmaster__create-worktree',
                'mcp__dungeonmaster__quest-work',
                'mcp__dungeonmaster__get-quest-work',
                'Bash(git status:*)',
                'Bash(git log:*)',
                'Bash(git diff:*)',
                'Bash(git show:*)',
                'Bash(git add:*)',
                'Bash(git rm:*)',
                'Bash(git mv:*)',
                'Bash(git commit:*)',
                'Bash(git checkout:*)',
                'Bash(git merge:*)',
                'Bash(git push:*)',
                'Bash(git rev-parse:*)',
                'Bash(git merge-base:*)',
                'mcp__claude-in-chrome',
                'Bash(curl:*)',
                'Bash(dungeonmaster siegelense:*)',
                'Bash(kill:*)',
                'Bash(lsof:*)',
                'Bash(ps:*)',
                'Bash(python3:*)',
              ],
            },
          },
          null,
          2,
        )}\n`,
      );
    });
  });

  describe('existing settings file with existing permissions', () => {
    it('VALID: {targetProjectRoot: /project, settings: has permissions} => merges and deduplicates permissions', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = '/project';
      const settingsPath = '/project/.claude/settings.json';
      const existingContents = JSON.stringify({
        permissions: {
          allow: ['Bash(npm:*)', 'mcp__dungeonmaster__discover'],
        },
      });

      proxy.setupExistingSettings({ targetProjectRoot, settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        `${JSON.stringify(
          {
            permissions: {
              allow: [
                'Bash(npm:*)',
                'mcp__dungeonmaster__discover',
                'mcp__dungeonmaster__get-architecture',
                'mcp__dungeonmaster__get-folder-detail',
                'mcp__dungeonmaster__get-testing-patterns',
                'mcp__dungeonmaster__get-quest',
                'mcp__dungeonmaster__modify-quest',
                'mcp__dungeonmaster__signal-back',
                'mcp__dungeonmaster__start-quest',
                'mcp__dungeonmaster__get-quest-status',
                'mcp__dungeonmaster__list-quests',
                'mcp__dungeonmaster__list-guilds',
                'mcp__dungeonmaster__ask-user-question',
                'mcp__dungeonmaster__get-agent-prompt',
                'mcp__dungeonmaster__get-project-map',
                'mcp__dungeonmaster__get-quest-planning-notes',
                'mcp__dungeonmaster__get-blight-checklist',
                'mcp__dungeonmaster__get-project-inventory',
                'mcp__dungeonmaster__create-quest',
                'mcp__dungeonmaster__get-server-config',
                'mcp__dungeonmaster__get-quest-summary',
                'mcp__dungeonmaster__create-worktree',
                'mcp__dungeonmaster__quest-work',
                'mcp__dungeonmaster__get-quest-work',
                'Bash(git status:*)',
                'Bash(git log:*)',
                'Bash(git diff:*)',
                'Bash(git show:*)',
                'Bash(git add:*)',
                'Bash(git rm:*)',
                'Bash(git mv:*)',
                'Bash(git commit:*)',
                'Bash(git checkout:*)',
                'Bash(git merge:*)',
                'Bash(git push:*)',
                'Bash(git rev-parse:*)',
                'Bash(git merge-base:*)',
                'mcp__claude-in-chrome',
                'Bash(curl:*)',
                'Bash(dungeonmaster siegelense:*)',
                'Bash(kill:*)',
                'Bash(lsof:*)',
                'Bash(ps:*)',
                'Bash(python3:*)',
              ],
            },
          },
          null,
          2,
        )}\n`,
      );
    });
  });

  describe('git permissions for dispatched relay agents', () => {
    it('VALID: {settings: already has the git grants} => a re-run keeps them in place exactly once', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = '/project';
      const settingsPath = '/project/.claude/settings.json';
      const existingContents = JSON.stringify({
        permissions: {
          allow: ['Bash(git add:*)', 'Bash(git commit:*)'],
        },
      });

      proxy.setupExistingSettings({ targetProjectRoot, settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        `${JSON.stringify(
          {
            permissions: {
              allow: [
                'Bash(git add:*)',
                'Bash(git commit:*)',
                'mcp__dungeonmaster__discover',
                'mcp__dungeonmaster__get-architecture',
                'mcp__dungeonmaster__get-folder-detail',
                'mcp__dungeonmaster__get-testing-patterns',
                'mcp__dungeonmaster__get-quest',
                'mcp__dungeonmaster__modify-quest',
                'mcp__dungeonmaster__signal-back',
                'mcp__dungeonmaster__start-quest',
                'mcp__dungeonmaster__get-quest-status',
                'mcp__dungeonmaster__list-quests',
                'mcp__dungeonmaster__list-guilds',
                'mcp__dungeonmaster__ask-user-question',
                'mcp__dungeonmaster__get-agent-prompt',
                'mcp__dungeonmaster__get-project-map',
                'mcp__dungeonmaster__get-quest-planning-notes',
                'mcp__dungeonmaster__get-blight-checklist',
                'mcp__dungeonmaster__get-project-inventory',
                'mcp__dungeonmaster__create-quest',
                'mcp__dungeonmaster__get-server-config',
                'mcp__dungeonmaster__get-quest-summary',
                'mcp__dungeonmaster__create-worktree',
                'mcp__dungeonmaster__quest-work',
                'mcp__dungeonmaster__get-quest-work',
                'Bash(git status:*)',
                'Bash(git log:*)',
                'Bash(git diff:*)',
                'Bash(git show:*)',
                'Bash(git rm:*)',
                'Bash(git mv:*)',
                'Bash(git checkout:*)',
                'Bash(git merge:*)',
                'Bash(git push:*)',
                'Bash(git rev-parse:*)',
                'Bash(git merge-base:*)',
                'mcp__claude-in-chrome',
                'Bash(curl:*)',
                'Bash(dungeonmaster siegelense:*)',
                'Bash(kill:*)',
                'Bash(lsof:*)',
                'Bash(ps:*)',
                'Bash(python3:*)',
              ],
            },
          },
          null,
          2,
        )}\n`,
      );
    });
  });

  describe('existing settings file with stale dungeonmaster permissions', () => {
    it('VALID: {settings: has stale + valid dungeonmaster + user permission} => drops stale, keeps valid and user permissions, adds current set', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = '/project';
      const settingsPath = '/project/.claude/settings.json';
      const existingContents = JSON.stringify({
        permissions: {
          allow: [
            'mcp__dungeonmaster__verify-quest',
            'mcp__dungeonmaster__get-quest',
            'Bash(npm:*)',
          ],
        },
      });

      proxy.setupExistingSettings({ targetProjectRoot, settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        `${JSON.stringify(
          {
            permissions: {
              allow: [
                'mcp__dungeonmaster__get-quest',
                'Bash(npm:*)',
                'mcp__dungeonmaster__discover',
                'mcp__dungeonmaster__get-architecture',
                'mcp__dungeonmaster__get-folder-detail',
                'mcp__dungeonmaster__get-testing-patterns',
                'mcp__dungeonmaster__modify-quest',
                'mcp__dungeonmaster__signal-back',
                'mcp__dungeonmaster__start-quest',
                'mcp__dungeonmaster__get-quest-status',
                'mcp__dungeonmaster__list-quests',
                'mcp__dungeonmaster__list-guilds',
                'mcp__dungeonmaster__ask-user-question',
                'mcp__dungeonmaster__get-agent-prompt',
                'mcp__dungeonmaster__get-project-map',
                'mcp__dungeonmaster__get-quest-planning-notes',
                'mcp__dungeonmaster__get-blight-checklist',
                'mcp__dungeonmaster__get-project-inventory',
                'mcp__dungeonmaster__create-quest',
                'mcp__dungeonmaster__get-server-config',
                'mcp__dungeonmaster__get-quest-summary',
                'mcp__dungeonmaster__create-worktree',
                'mcp__dungeonmaster__quest-work',
                'mcp__dungeonmaster__get-quest-work',
                'Bash(git status:*)',
                'Bash(git log:*)',
                'Bash(git diff:*)',
                'Bash(git show:*)',
                'Bash(git add:*)',
                'Bash(git rm:*)',
                'Bash(git mv:*)',
                'Bash(git commit:*)',
                'Bash(git checkout:*)',
                'Bash(git merge:*)',
                'Bash(git push:*)',
                'Bash(git rev-parse:*)',
                'Bash(git merge-base:*)',
                'mcp__claude-in-chrome',
                'Bash(curl:*)',
                'Bash(dungeonmaster siegelense:*)',
                'Bash(kill:*)',
                'Bash(lsof:*)',
                'Bash(ps:*)',
                'Bash(python3:*)',
              ],
            },
          },
          null,
          2,
        )}\n`,
      );
    });

    it('VALID: {settings: only non-dungeonmaster permissions} => all stay, current dungeonmaster set added on top', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = '/project';
      const settingsPath = '/project/.claude/settings.json';
      const existingContents = JSON.stringify({
        permissions: {
          allow: ['Bash(npm:*)', 'Bash(git:*)', 'mcp__otherserver__sometool'],
        },
      });

      proxy.setupExistingSettings({ targetProjectRoot, settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        `${JSON.stringify(
          {
            permissions: {
              allow: [
                'Bash(npm:*)',
                'Bash(git:*)',
                'mcp__otherserver__sometool',
                'mcp__dungeonmaster__discover',
                'mcp__dungeonmaster__get-architecture',
                'mcp__dungeonmaster__get-folder-detail',
                'mcp__dungeonmaster__get-testing-patterns',
                'mcp__dungeonmaster__get-quest',
                'mcp__dungeonmaster__modify-quest',
                'mcp__dungeonmaster__signal-back',
                'mcp__dungeonmaster__start-quest',
                'mcp__dungeonmaster__get-quest-status',
                'mcp__dungeonmaster__list-quests',
                'mcp__dungeonmaster__list-guilds',
                'mcp__dungeonmaster__ask-user-question',
                'mcp__dungeonmaster__get-agent-prompt',
                'mcp__dungeonmaster__get-project-map',
                'mcp__dungeonmaster__get-quest-planning-notes',
                'mcp__dungeonmaster__get-blight-checklist',
                'mcp__dungeonmaster__get-project-inventory',
                'mcp__dungeonmaster__create-quest',
                'mcp__dungeonmaster__get-server-config',
                'mcp__dungeonmaster__get-quest-summary',
                'mcp__dungeonmaster__create-worktree',
                'mcp__dungeonmaster__quest-work',
                'mcp__dungeonmaster__get-quest-work',
                'Bash(git status:*)',
                'Bash(git log:*)',
                'Bash(git diff:*)',
                'Bash(git show:*)',
                'Bash(git add:*)',
                'Bash(git rm:*)',
                'Bash(git mv:*)',
                'Bash(git commit:*)',
                'Bash(git checkout:*)',
                'Bash(git merge:*)',
                'Bash(git push:*)',
                'Bash(git rev-parse:*)',
                'Bash(git merge-base:*)',
                'mcp__claude-in-chrome',
                'Bash(curl:*)',
                'Bash(dungeonmaster siegelense:*)',
                'Bash(kill:*)',
                'Bash(lsof:*)',
                'Bash(ps:*)',
                'Bash(python3:*)',
              ],
            },
          },
          null,
          2,
        )}\n`,
      );
    });

    it('VALID: {settings: stale + current dungeonmaster entries} => deduplicates, removes stale', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = '/project';
      const settingsPath = '/project/.claude/settings.json';
      const existingContents = JSON.stringify({
        permissions: {
          allow: [
            'mcp__dungeonmaster__verify-quest',
            'mcp__dungeonmaster__validate-spec',
            'mcp__dungeonmaster__discover',
            'mcp__dungeonmaster__get-quest',
          ],
        },
      });

      proxy.setupExistingSettings({ targetProjectRoot, settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        `${JSON.stringify(
          {
            permissions: {
              allow: [
                'mcp__dungeonmaster__discover',
                'mcp__dungeonmaster__get-quest',
                'mcp__dungeonmaster__get-architecture',
                'mcp__dungeonmaster__get-folder-detail',
                'mcp__dungeonmaster__get-testing-patterns',
                'mcp__dungeonmaster__modify-quest',
                'mcp__dungeonmaster__signal-back',
                'mcp__dungeonmaster__start-quest',
                'mcp__dungeonmaster__get-quest-status',
                'mcp__dungeonmaster__list-quests',
                'mcp__dungeonmaster__list-guilds',
                'mcp__dungeonmaster__ask-user-question',
                'mcp__dungeonmaster__get-agent-prompt',
                'mcp__dungeonmaster__get-project-map',
                'mcp__dungeonmaster__get-quest-planning-notes',
                'mcp__dungeonmaster__get-blight-checklist',
                'mcp__dungeonmaster__get-project-inventory',
                'mcp__dungeonmaster__create-quest',
                'mcp__dungeonmaster__get-server-config',
                'mcp__dungeonmaster__get-quest-summary',
                'mcp__dungeonmaster__create-worktree',
                'mcp__dungeonmaster__quest-work',
                'mcp__dungeonmaster__get-quest-work',
                'Bash(git status:*)',
                'Bash(git log:*)',
                'Bash(git diff:*)',
                'Bash(git show:*)',
                'Bash(git add:*)',
                'Bash(git rm:*)',
                'Bash(git mv:*)',
                'Bash(git commit:*)',
                'Bash(git checkout:*)',
                'Bash(git merge:*)',
                'Bash(git push:*)',
                'Bash(git rev-parse:*)',
                'Bash(git merge-base:*)',
                'mcp__claude-in-chrome',
                'Bash(curl:*)',
                'Bash(dungeonmaster siegelense:*)',
                'Bash(kill:*)',
                'Bash(lsof:*)',
                'Bash(ps:*)',
                'Bash(python3:*)',
              ],
            },
          },
          null,
          2,
        )}\n`,
      );
    });
  });

  describe('unreadable existing settings file', () => {
    it('ERROR: {settings: invalid JSON} => rejects naming the file and never writes', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = '/project';
      const settingsPath = '/project/.claude/settings.json';

      proxy.setupInvalidJsonSettings({ targetProjectRoot, settingsPath });

      await expect(settingsPermissionsAddBroker({ targetProjectRoot })).rejects.toStrictEqual(
        new SyntaxError(`Invalid JSON in ${settingsPath}`),
      );
      expect(proxy.wasWriteCalled({ settingsPath })).toBe(false);
    });

    it('ERROR: {settings: EACCES} => rejects naming the file and never writes', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = '/project';
      const settingsPath = '/project/.claude/settings.json';
      const eaccesError = FsErrorStub({ code: 'EACCES', path: settingsPath, syscall: 'open' });

      proxy.setupUnreadableSettings({ targetProjectRoot, settingsPath });

      await expect(settingsPermissionsAddBroker({ targetProjectRoot })).rejects.toStrictEqual(
        eaccesError,
      );
      expect(proxy.wasWriteCalled({ settingsPath })).toBe(false);
    });
  });
});

import { settingsPermissionsAddBroker } from './settings-permissions-add-broker';
import { settingsPermissionsAddBrokerProxy } from './settings-permissions-add-broker.proxy';
import { FileContentsStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';

describe('settingsPermissionsAddBroker', () => {
  describe('no existing settings file', () => {
    it('VALID: {targetProjectRoot: /project, settings: none} => creates settings with MCP permissions', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = PathSegmentStub({ value: '/project' });
      const settingsPath = PathSegmentStub({ value: '/project/.claude/settings.json' });

      proxy.setupNoExistingSettings({ settingsPath });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        FileContentsStub({
          value: JSON.stringify(
            {
              permissions: {
                allow: [
                  'mcp__dungeonmaster__discover',
                  'mcp__dungeonmaster__get-architecture',
                  'mcp__dungeonmaster__get-folder-detail',
                  'mcp__dungeonmaster__get-syntax-rules',
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
                  'mcp__dungeonmaster__get-planning-notes',
                ],
              },
            },
            null,
            2,
          ),
        }),
      );
    });
  });

  describe('existing settings file with no permissions', () => {
    it('VALID: {targetProjectRoot: /project, settings: hooks only} => adds permissions to existing settings', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = PathSegmentStub({ value: '/project' });
      const settingsPath = PathSegmentStub({ value: '/project/.claude/settings.json' });
      const existingContents = FileContentsStub({
        value: JSON.stringify({ hooks: { PreToolUse: [] } }),
      });

      proxy.setupExistingSettings({ settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        FileContentsStub({
          value: JSON.stringify(
            {
              hooks: { PreToolUse: [] },
              permissions: {
                allow: [
                  'mcp__dungeonmaster__discover',
                  'mcp__dungeonmaster__get-architecture',
                  'mcp__dungeonmaster__get-folder-detail',
                  'mcp__dungeonmaster__get-syntax-rules',
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
                  'mcp__dungeonmaster__get-planning-notes',
                ],
              },
            },
            null,
            2,
          ),
        }),
      );
    });
  });

  describe('existing settings file with existing permissions', () => {
    it('VALID: {targetProjectRoot: /project, settings: has permissions} => merges and deduplicates permissions', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = PathSegmentStub({ value: '/project' });
      const settingsPath = PathSegmentStub({ value: '/project/.claude/settings.json' });
      const existingContents = FileContentsStub({
        value: JSON.stringify({
          permissions: {
            allow: ['Bash(npm:*)', 'mcp__dungeonmaster__discover'],
          },
        }),
      });

      proxy.setupExistingSettings({ settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        FileContentsStub({
          value: JSON.stringify(
            {
              permissions: {
                allow: [
                  'Bash(npm:*)',
                  'mcp__dungeonmaster__discover',
                  'mcp__dungeonmaster__get-architecture',
                  'mcp__dungeonmaster__get-folder-detail',
                  'mcp__dungeonmaster__get-syntax-rules',
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
                  'mcp__dungeonmaster__get-planning-notes',
                ],
              },
            },
            null,
            2,
          ),
        }),
      );
    });
  });

  describe('existing settings file with stale dungeonmaster permissions', () => {
    it('VALID: {settings: has stale + valid dungeonmaster + user permission} => drops stale, keeps valid and user permissions, adds current set', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = PathSegmentStub({ value: '/project' });
      const settingsPath = PathSegmentStub({ value: '/project/.claude/settings.json' });
      const existingContents = FileContentsStub({
        value: JSON.stringify({
          permissions: {
            allow: [
              'mcp__dungeonmaster__verify-quest',
              'mcp__dungeonmaster__get-quest',
              'Bash(npm:*)',
            ],
          },
        }),
      });

      proxy.setupExistingSettings({ settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        FileContentsStub({
          value: JSON.stringify(
            {
              permissions: {
                allow: [
                  'mcp__dungeonmaster__get-quest',
                  'Bash(npm:*)',
                  'mcp__dungeonmaster__discover',
                  'mcp__dungeonmaster__get-architecture',
                  'mcp__dungeonmaster__get-folder-detail',
                  'mcp__dungeonmaster__get-syntax-rules',
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
                  'mcp__dungeonmaster__get-planning-notes',
                ],
              },
            },
            null,
            2,
          ),
        }),
      );
    });

    it('VALID: {settings: only non-dungeonmaster permissions} => all stay, current dungeonmaster set added on top', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = PathSegmentStub({ value: '/project' });
      const settingsPath = PathSegmentStub({ value: '/project/.claude/settings.json' });
      const existingContents = FileContentsStub({
        value: JSON.stringify({
          permissions: {
            allow: ['Bash(npm:*)', 'Bash(git:*)', 'mcp__otherserver__sometool'],
          },
        }),
      });

      proxy.setupExistingSettings({ settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        FileContentsStub({
          value: JSON.stringify(
            {
              permissions: {
                allow: [
                  'Bash(npm:*)',
                  'Bash(git:*)',
                  'mcp__otherserver__sometool',
                  'mcp__dungeonmaster__discover',
                  'mcp__dungeonmaster__get-architecture',
                  'mcp__dungeonmaster__get-folder-detail',
                  'mcp__dungeonmaster__get-syntax-rules',
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
                  'mcp__dungeonmaster__get-planning-notes',
                ],
              },
            },
            null,
            2,
          ),
        }),
      );
    });

    it('VALID: {settings: stale + current dungeonmaster entries} => deduplicates, removes stale', async () => {
      const proxy = settingsPermissionsAddBrokerProxy();
      const targetProjectRoot = PathSegmentStub({ value: '/project' });
      const settingsPath = PathSegmentStub({ value: '/project/.claude/settings.json' });
      const existingContents = FileContentsStub({
        value: JSON.stringify({
          permissions: {
            allow: [
              'mcp__dungeonmaster__verify-quest',
              'mcp__dungeonmaster__validate-spec',
              'mcp__dungeonmaster__discover',
              'mcp__dungeonmaster__get-quest',
            ],
          },
        }),
      });

      proxy.setupExistingSettings({ settingsPath, contents: existingContents });

      const result = await settingsPermissionsAddBroker({ targetProjectRoot });

      expect(result).toStrictEqual(
        FileContentsStub({
          value: JSON.stringify(
            {
              permissions: {
                allow: [
                  'mcp__dungeonmaster__discover',
                  'mcp__dungeonmaster__get-quest',
                  'mcp__dungeonmaster__get-architecture',
                  'mcp__dungeonmaster__get-folder-detail',
                  'mcp__dungeonmaster__get-syntax-rules',
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
                  'mcp__dungeonmaster__get-planning-notes',
                ],
              },
            },
            null,
            2,
          ),
        }),
      );
    });
  });
});

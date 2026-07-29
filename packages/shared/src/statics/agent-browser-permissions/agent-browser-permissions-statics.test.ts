import { agentBrowserPermissionsStatics } from './agent-browser-permissions-statics';

describe('agentBrowserPermissionsStatics', () => {
  describe('allow', () => {
    it('VALID: {agentBrowserPermissionsStatics} => exposes exactly the Claude-in-Chrome server grant', () => {
      expect(agentBrowserPermissionsStatics).toStrictEqual({
        allow: ['mcp__claude-in-chrome'],
      });
    });

    it('VALID: {allow} => scopes the grant to the server, not one tool, so later browser tools stay covered', () => {
      const { allow } = agentBrowserPermissionsStatics;
      const perToolEntries = allow.filter((entry) => entry.startsWith('mcp__claude-in-chrome__'));

      expect(perToolEntries).toStrictEqual([]);
    });
  });
});

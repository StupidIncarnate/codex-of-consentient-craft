import { agentQaPermissionsStatics } from './agent-qa-permissions-statics';

describe('agentQaPermissionsStatics', () => {
  describe('allow', () => {
    it('VALID: {agentQaPermissionsStatics} => exposes exactly the probe and process-control grants', () => {
      expect(agentQaPermissionsStatics).toStrictEqual({
        allow: ['Bash(curl:*)', 'Bash(kill:*)', 'Bash(lsof:*)', 'Bash(ps:*)', 'Bash(python3:*)'],
      });
    });

    // The `manual-qa` pack prescribes `curl -sf --retry ...` as its readiness poll and as the way
    // around this repo's IPv6-only dev server. A prefix-scoped entry is what makes those flags
    // reachable; `Bash(curl)` alone would grant the bare word and deny every real invocation.
    it('VALID: {allow} => grants every entry with its arguments rather than the bare command', () => {
      const { allow } = agentQaPermissionsStatics;

      expect(allow.filter((entry) => !entry.endsWith(':*)'))).toStrictEqual([]);
    });

    // `pkill` reaps by name, so it kills processes this session did not start — a sibling quest's
    // dev server, the user's own. The manual-qa pack forbids it BY NAME ("never `pkill` a bare
    // name/port"), and granting it here would undercut that sentence with a permission.
    it('VALID: {allow} => withholds pkill, the bare-name kill the manual-qa pack forbids', () => {
      const { allow } = agentQaPermissionsStatics;

      expect(allow.filter((entry) => entry.includes('pkill'))).toStrictEqual([]);
    });
  });
});

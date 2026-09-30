/**
 * PURPOSE: The command the post-bash hook runs after an agent's `npm install <pkg>`, and the two
 * time limits around it. `settingsTimeoutSeconds` goes into the settings.json hook entry, because
 * Claude Code's own 60s default can kill a sync that runs `npm install` to refresh the lockfile.
 * `runTimeoutMs` sits under it, so the hook stops the sync itself and reports that, rather than
 * being killed with nothing said.
 *
 * USAGE:
 * run({ command: gatewaySyncHookStatics.command.name, args: [...gatewaySyncHookStatics.command.args], cwd });
 * // Runs `dungeonmaster gateway-sync`
 */
export const gatewaySyncHookStatics = {
  command: {
    name: 'dungeonmaster',
    args: ['gateway-sync'],
    display: 'dungeonmaster gateway-sync',
  },
  hook: {
    matcher: 'Bash',
    bin: 'dungeonmaster-post-bash',
    settingsTimeoutSeconds: 300,
  },
  limits: {
    runTimeoutMs: 280_000,
  },
} as const;

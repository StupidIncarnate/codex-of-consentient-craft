/**
 * PURPOSE: The closed set of `dungeonmaster siegelense <call>` names — no `prefix`, because there
 * is no registration and no prefix on a CLI: the name typed after `dungeonmaster siegelense` IS
 * the call. Reach for this over `siegelenseToolsStatics`, which survives only because four files
 * under `packages/mcp` still import it until the MCP layer is deleted with them.
 *
 * USAGE:
 * siegelenseCallStatics.calls.names;
 * // Returns the readonly tuple of thirteen call names, in the spec's own order
 *
 * siegelenseCallStatics.docs.scopes;
 * // Returns the readonly tuple of `docs { for }` scopes, one per tool-using role
 */

export const siegelenseCallStatics = {
  calls: {
    names: [
      'start',
      'run',
      'results',
      'kill',
      'capacity',
      'profile',
      'status',
      'cleanup',
      'prune',
      'compare',
      'snapshots',
      'recipes',
      'docs',
    ],
  },
  docs: {
    scopes: ['operating', 'planning', 'walking', 'attacking', 'fixing', 'driving', 'operational'],
  },
} as const;

/**
 * PURPOSE: The closed set of MCP tool names this package registers, and the prefix every one is
 * registered under. Pinning the thirteen names now — before any handler exists behind them — is
 * what stops the chunk that registers them from inventing a fourteenth or dropping one; `look` is
 * deliberately absent because it is a step value inside `run`'s `steps` array, not a tool.
 *
 * USAGE:
 * siegelenseToolsStatics.tools.prefix;
 * // Returns 'siegelense-'
 *
 * siegelenseToolsStatics.tools.names;
 * // Returns the readonly tuple of thirteen tool names, each registered as `${prefix}${name}`
 *
 * siegelenseToolsStatics.docs.scopes;
 * // Returns the readonly tuple of `docs { for }` scopes, one per tool-using role
 */

export const siegelenseToolsStatics = {
  tools: {
    prefix: 'siegelense-',
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

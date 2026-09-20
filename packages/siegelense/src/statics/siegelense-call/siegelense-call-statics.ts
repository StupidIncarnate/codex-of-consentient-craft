/**
 * PURPOSE: The closed set of `dungeonmaster siegelense <call>` names — no `prefix`, because there
 * is no registration and no prefix on a CLI: the name typed after `dungeonmaster siegelense` IS
 * the call. This is the single source for that name list and for the `docs { for }` scopes; any
 * caller naming a siegelense call or a docs scope reaches for this rather than retyping either
 * list.
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
    humanRenderers: ['status', 'cleanup', 'prune', 'recipes', 'docs'],
  },
  docs: {
    scopes: ['operating', 'planning', 'walking', 'attacking', 'fixing', 'driving', 'operational'],
  },
} as const;

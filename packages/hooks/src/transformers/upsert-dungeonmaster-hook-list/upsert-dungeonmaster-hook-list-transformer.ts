/**
 * PURPOSE: Replaces any existing dungeonmaster-* hook entries in a Claude settings.json hook array with a freshly-generated set, preserving any third-party entries the user has added. Used by the install responder to make `dungeonmaster init` idempotent across re-runs and additive when new hook types are introduced.
 *
 * USAGE:
 * upsertDungeonmasterHookListTransformer({
 *   existing: [{ hooks: [{ command: 'their-hook' }] }, { hooks: [{ command: 'dungeonmaster-old' }] }],
 *   fresh: [{ hooks: [{ command: 'dungeonmaster-new' }] }],
 * });
 * // Returns: [{ hooks: [{ command: 'their-hook' }] }, { hooks: [{ command: 'dungeonmaster-new' }] }]
 */

import { isDungeonmasterHookEntryGuard } from '../../guards/is-dungeonmaster-hook-entry/is-dungeonmaster-hook-entry-guard';
import type { SettingsHookListEntry } from '../../contracts/claude-settings/claude-settings-contract';

export const upsertDungeonmasterHookListTransformer = <T extends SettingsHookListEntry>({
  existing,
  fresh,
}: {
  existing: readonly T[];
  fresh: readonly T[];
}): T[] => [...existing.filter((entry) => !isDungeonmasterHookEntryGuard({ entry })), ...fresh];

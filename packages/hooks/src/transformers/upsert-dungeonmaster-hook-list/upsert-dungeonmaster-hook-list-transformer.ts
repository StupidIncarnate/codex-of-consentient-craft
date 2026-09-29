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
import { settingsHookListEntryContract } from '../../contracts/settings-hook-list-entry/settings-hook-list-entry-contract';
import type { SettingsHookListEntry } from '../../contracts/settings-hook-list-entry/settings-hook-list-entry-contract';

export const upsertDungeonmasterHookListTransformer = ({
  existing,
  fresh,
}: {
  existing: readonly SettingsHookListEntry[];
  fresh: readonly SettingsHookListEntry[];
}): SettingsHookListEntry[] => [
  ...existing.filter((entry) => !isDungeonmasterHookEntryGuard({ entry })),
  ...fresh.map((entry) => settingsHookListEntryContract.parse(entry)),
];

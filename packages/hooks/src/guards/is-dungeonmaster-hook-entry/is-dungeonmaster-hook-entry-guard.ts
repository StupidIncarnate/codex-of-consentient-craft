/**
 * PURPOSE: Reports whether a Claude settings.json hook entry was written by dungeonmaster (its command name starts with the `dungeonmaster-` prefix). Used by the install responder to strip prior dungeonmaster entries before re-merging, so re-running `dungeonmaster init` after adding new hook types updates settings.json in-place.
 *
 * USAGE:
 * isDungeonmasterHookEntryGuard({ entry: { hooks: [{ command: 'dungeonmaster-pre-bash' }] } });
 * // Returns true
 */

import type { SettingsHookListEntry } from '../../contracts/claude-settings/claude-settings-contract';

export const isDungeonmasterHookEntryGuard = ({
  entry,
}: {
  entry?: SettingsHookListEntry;
}): boolean =>
  (entry?.hooks ?? []).some(
    (h) => typeof h.command === 'string' && h.command.startsWith('dungeonmaster-'),
  );

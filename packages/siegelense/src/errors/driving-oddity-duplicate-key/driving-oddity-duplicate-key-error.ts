/**
 * PURPOSE: Represents an append that would add a SECOND entry for a key the committed driving-oddity
 * file already carries. Refused rather than merged, so `drivingOddityAppendBroker` never rewrites a
 * line another round already wrote — the append stays a pure O_APPEND, which is what keeps every
 * existing entry byte-for-byte untouched. A round that finds an existing entry WRONG corrects it by
 * hand, in the file itself, rather than through this call. `key` and `filePath` are stored as
 * `unknown`, matching `RefStaleError`: this file is a leaf node (`errors/` imports nothing), so it
 * cannot brand them through a contract.
 *
 * USAGE:
 * throw new DrivingOddityDuplicateKeyError({
 *   key: 'GUILD_ADD_MODAL',
 *   filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
 * });
 * // Throws error naming the key already present in the file
 *
 * WHEN-TO-USE: `drivingOddityAppendBroker` finds the entry it was asked to append shares a `key` with
 * one already in the file.
 * WHEN-NOT-TO-USE: The key is new — append proceeds normally and this never throws.
 */
export class DrivingOddityDuplicateKeyError extends Error {
  public readonly key: unknown;

  public readonly filePath: unknown;

  public constructor({ key, filePath }: { key: unknown; filePath: unknown }) {
    super(
      `Driving-oddity file at ${String(filePath)} already has an entry keyed "${String(key)}" — append refuses a duplicate; edit the existing line by hand to correct it.`,
    );
    this.key = key;
    this.filePath = filePath;
    this.name = 'DrivingOddityDuplicateKeyError';
  }
}

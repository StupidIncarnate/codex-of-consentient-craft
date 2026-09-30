/**
 * PURPOSE: Represents an error when no guild on disk contains a quest with the given id (deleted, abandoned, or never existed)
 *
 * USAGE:
 * throw new QuestNotFoundError({ questId: 'add-auth' });
 * // Throws error indicating the quest is not found in any guild
 *
 * WHEN-TO-USE: From quest-lookup brokers (questFindQuestPathBroker) so callers can `instanceof`-check
 * to distinguish a gone-quest from other load failures.
 * WHEN-NOT-TO-USE: For per-call validation failures or transient I/O errors — those should remain plain Errors.
 */
export class QuestNotFoundError extends Error {
  public constructor({ questId }: { questId: string }) {
    super(`Quest with id "${questId}" not found in any guild`);
    this.name = 'QuestNotFoundError';
  }
}

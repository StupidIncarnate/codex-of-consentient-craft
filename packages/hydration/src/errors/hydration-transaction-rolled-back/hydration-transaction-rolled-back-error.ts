/**
 * PURPOSE: Reports that a database-backed plan was undone whole because one op inside its
 * transaction failed, naming which op triggered the rollback. Reach for this over any other mid-run
 * class in this folder: those name a SINGLE op's own failure; this one names the CONSEQUENCE for
 * every op that shared its transaction, which a database-backed repo's own atomicity makes
 * unavoidable.
 *
 * USAGE:
 * throw new HydrationTransactionRolledBackError({
 *   recipeName: 'seed-users-and-posts',
 *   ingredientName: 'comment',
 *   opDescription: 'create comment[0:2]',
 *   cause: new Error('foreign key violation on post_id'),
 * });
 * // Throws error naming the recipe, the triggering op and the underlying database failure
 *
 * WHEN-TO-USE: From the runner, once a database-backed plan's transaction fails and the driver
 * rolls every op in it back.
 * WHEN-NOT-TO-USE: For a file-backed plan — nothing there is transactional, and a failed op simply
 * halts the batch per the mid-run rule, with no rollback to report.
 */
export class HydrationTransactionRolledBackError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    opDescription,
    cause,
  }: {
    recipeName: string;
    ingredientName: string;
    opDescription: string;
    cause: unknown;
  }) {
    super(
      `recipe "${recipeName}": the transaction rolled back, undoing the whole plan — triggered by ${opDescription} on ingredient "${ingredientName}": ${String(cause)}`,
    );
    this.name = 'HydrationTransactionRolledBackError';
  }
}

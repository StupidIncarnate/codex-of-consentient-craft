/**
 * PURPOSE: Stamps a server-generated id onto every incoming step assertion that lacks one
 *
 * USAGE:
 * questStepAssertionsStampIdsTransformer({ steps: validated.steps });
 * // Returns: the same steps with each assertion lacking an `id` assigned a fresh UUID
 *
 * Runs in quest-modify-broker BEFORE the steps array-upsert. New assertions (authored without an id)
 * get a stable id so they persist with one; assertions that already carry an id (echoed back by an
 * agent editing a specific assertion) are left untouched so the upsert matches and deep-merges them
 * by id — preserving per-assertion fields (observablesSatisfied, field) a partial patch omits.
 */

import { stepAssertionIdContract } from '@dungeonmaster/shared/contracts';
import type { ItemWithId } from '@dungeonmaster/shared/contracts';

export const questStepAssertionsStampIdsTransformer = ({
  steps,
}: {
  steps: readonly ItemWithId[];
}): ItemWithId[] =>
  steps.map((step): ItemWithId => {
    const { assertions } = step;
    if (!Array.isArray(assertions)) {
      return step;
    }

    const stamped = (assertions as readonly unknown[]).map((assertion) => {
      if (typeof assertion !== 'object' || assertion === null) {
        return assertion;
      }
      if ('id' in assertion) {
        return assertion;
      }
      return {
        id: stepAssertionIdContract.parse(crypto.randomUUID()),
        ...assertion,
      };
    });

    return { ...step, assertions: stamped };
  });

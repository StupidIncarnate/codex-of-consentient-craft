/**
 * An unknown field in an attach's own match object must not compile — the same excess-property
 * rule `bad-where-field.ts` proves for `filter`'s `where`, over `AttachWhereFor<I>` instead of
 * `FieldValuesFor<FieldsOf<I>>`.
 */
import { dm } from './_shared';

export const attachBadWhereField = dm.quests.attach({ nope: 1 }, () => []);

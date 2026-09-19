/**
 * PURPOSE: The `QuestFields` keys `modifyQuestInputContract` actually recognizes, so the quest
 * `update` route can drop everything else before calling `questModifyBroker` (which is
 * `.strict()` and throws on an unrecognized key). Single source of truth so the transformer and
 * its test cannot drift onto two different lists.
 *
 * USAGE:
 * modifiableQuestFieldsStatics.names.includes('title');
 * // Returns true
 */
export const modifiableQuestFieldsStatics = {
  names: [
    'designDecisions',
    'toolingRequirements',
    'contracts',
    'packagesAffected',
    'flows',
    'comments',
    'status',
    'pausedAtStatus',
    'title',
    'designPort',
    'workItems',
    'wardResults',
    'planningNotes',
  ],
} as const;

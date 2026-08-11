/**
 * PURPOSE: Maps quest pipeline stages to the sections each stage includes
 *
 * USAGE:
 * questStageMappingStatics.stages.spec;
 * // Returns ['flows', 'designDecisions', 'contracts', 'toolingRequirements']
 *
 * This lives in shared because BOTH ends of a staged get-quest need it: the orchestrator filters
 * the quest down to the stage's sections, and `questToTextDisplayTransformer` needs to know which
 * sections were filtered OUT so it can omit them instead of rendering them as "(none)". Without
 * the second consumer a `stage: 'spec'` response prints an empty `## Operations` header, which
 * reads to an agent as "this quest has no operations ledger" rather than "you didn't ask for it".
 */

export const questStageMappingStatics = {
  stages: {
    // Everything a quest is specified FROM, plus the plan authored against it. ChaosWhisperer
    // reconciles the ledger against the spec in one read, and an execution agent sees the flows it
    // is aiming at, the ledger position it occupies, and which sessions already ran.
    spec: [
      'flows',
      'designDecisions',
      'contracts',
      'toolingRequirements',
      'packagesAffected',
      'operations',
      'workItems',
    ],
    // The cheap ledger-only read, for a reviewer that needs the plan and not the spine. It still
    // carries `packagesAffected`, because every stage that renders `operations` renders each item's
    // `[packages: …]` names, and a name with no entry to resolve it to a location and a kind is the
    // write-only string list the entry shape replaced.
    planning: ['planningNotes', 'operations', 'contracts', 'packagesAffected'],
    // The full picture, for diagnosing plan-vs-reality: a plan without the flows it targets is not
    // diagnosable, and an item Chaos linked to no flow leaves the whole spine as the only reference.
    implementation: [
      'flows',
      'designDecisions',
      'contracts',
      'toolingRequirements',
      'packagesAffected',
      'operations',
      'workItems',
      'planningNotes',
    ],
  },
} as const;

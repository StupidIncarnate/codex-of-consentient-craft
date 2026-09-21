/**
 * PURPOSE: Which units a STEP is measured over, keyed by (family, step) rather than by track — so
 * filtering a step's denominator never depends on which TRACK its family happens to write to. Reach
 * for this once a caller needs a step-level scope; `signoffTrackEligibilityStatics` still answers the
 * track-scoped question every current reader asks, until story 26 retires the half of it duplicated
 * here.
 *
 * USAGE:
 * stepScopeStatics.byFamilyStep.flowrider.review.verificationMethods.includes('reading');
 * // Returns false — a `(read-check)` observable never reaches flowrider's denominator
 * stepScopeStatics.byFamilyStep.siegemaster.adversarial.unitKinds;
 * // Returns ['off-map'] — the family it was allocated, and nothing else
 *
 * A STEP WITH NO DECLARED SCOPE INHERITS ITS FAMILY'S WHOLE IN-SCOPE SET UNFILTERED. Every `worker`
 * step and every `planner` step in `agentFlowStatics` is absent from `byFamilyStep` for exactly that
 * reason — a worker is handed the units its piece assigns, not a scope, and a planner is assigned
 * none, so neither has a filter to declare. Absence here is not an omission to fill in: a scope keyed
 * to a step nobody declared is a filter that can never fire.
 *
 * `flowScope` AND `packageScope` DO NOT SURVIVE THE RE-KEY, and dropping both costs nothing. Neither
 * rule is read by any production file today — `operation-signoff-scope-transformer.ts` narrows on an
 * item's own `flowIds` unconditionally, and `qa-units-in-package-scope-transformer.ts` hardcodes the
 * intersection rule in code — so there is no call site either field would re-point at this file. Story
 * 22 replaces the package rule outright (a glue seam's units go to the SECOND cell only, by the cell
 * ordering the orchestrator already computes, not to every cell intersecting the node's packages), and
 * carrying a value nothing reads and one story is about to invalidate buys nothing over leaving it out.
 *
 * VALUES ARE RESTATED HERE, NEVER IMPORTED, from `signoffTrackEligibilityStatics`'s matching track.
 * Three reasons: two entries have no counterpart to import at all (`siegemaster.adversarial` and its
 * `unitKinds: ['off-map']` appear nowhere in the old statics, and neither does either step key); the
 * old file's other half (`signoffField`) is deleted in story 26, and an import would put this file in
 * that deletion's blast radius for no gain; and the coupling is the exact thing this re-key exists to
 * break — importing would mean an edit to a TRACK's list silently changes a STEP's scope, which is a
 * track keying a step, the thing that stopped existing.
 *
 * SIEGEMASTER'S `flowTypes` IS A DELIBERATE NARROWING OF WHAT THE OLD TRACK CARRIES, NOT A COPY. The
 * old track carries `['runtime', 'operational']` (`signoffTrackEligibilityStatics.byTrack.siegemaster`);
 * both siege steps here carry `['runtime']` alone, because operational units move to codeweaver's
 * reviewer — the only family that can settle them, since an operational flow is a one-time task
 * sequence with no repeatable walk for a siege lane to drive. See each entry's own comment below.
 *
 * `observableOrigins` IS CARRIED VERBATIM FROM EACH STEP'S MATCHING TRACK, pending an open design
 * question this file does not resolve: whether "strictly after" still holds once a back-edge can mint
 * a worker from a later family's `unmet`. Dropping the field would not deadlock either reading — the
 * reviewer would mark the unit `unmet` and the ordinary route would mint a worker — so it is carried
 * unchanged rather than decided here.
 */

export const stepScopeStatics = {
  byFamilyStep: {
    codeweaver: {
      review: {
        flowTypes: ['runtime', 'operational'],
        verificationMethods: ['test', 'reading'],
        unitKinds: ['terminal', 'branch', 'observable'],
        packageTypes: [
          'http-backend',
          'mcp-server',
          'frontend-react',
          'frontend-ink',
          'hook-handlers',
          'eslint-plugin',
          'cli-tool',
          'programmatic-service',
          'library',
        ],
        observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      },
    },
    flowrider: {
      review: {
        flowTypes: ['runtime'],
        verificationMethods: ['test'],
        unitKinds: ['terminal', 'branch', 'observable'],
        packageTypes: [
          'http-backend',
          'mcp-server',
          'frontend-react',
          'frontend-ink',
          'hook-handlers',
          'eslint-plugin',
          'cli-tool',
          'programmatic-service',
          'library',
        ],
        observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      },
    },
    siegemaster: {
      happyWalk: {
        // NARROWED from the old track's ['runtime', 'operational']: operational units move to
        // codeweaver's reviewer, the only family that can settle them — an operational flow is a
        // one-time task sequence with no repeatable walk for a siege lane to drive.
        flowTypes: ['runtime'],
        verificationMethods: ['test'],
        unitKinds: ['terminal', 'branch', 'observable', 'off-map'],
        packageTypes: [
          'http-backend',
          'mcp-server',
          'frontend-react',
          'frontend-ink',
          'hook-handlers',
          'eslint-plugin',
          'cli-tool',
          'programmatic-service',
          'library',
        ],
        observableOrigins: [
          'spec',
          'chaoswhisperer',
          'codeweaver',
          'flowrider',
          'siegemaster',
          'operator',
        ],
      },
      adversarial: {
        // Same narrowing as happyWalk, and for the same reason: operational units move to
        // codeweaver's reviewer, so this step is never measured over them either.
        flowTypes: ['runtime'],
        verificationMethods: ['test'],
        unitKinds: ['off-map'],
        packageTypes: [
          'http-backend',
          'mcp-server',
          'frontend-react',
          'frontend-ink',
          'hook-handlers',
          'eslint-plugin',
          'cli-tool',
          'programmatic-service',
          'library',
        ],
        observableOrigins: [
          'spec',
          'chaoswhisperer',
          'codeweaver',
          'flowrider',
          'siegemaster',
          'operator',
        ],
      },
    },
  },
} as const;

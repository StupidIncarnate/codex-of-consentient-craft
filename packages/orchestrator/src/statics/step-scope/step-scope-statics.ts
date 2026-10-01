/**
 * PURPOSE: Which units a STEP is measured over, keyed by (family, step) rather than by track — so
 * filtering a step's denominator never depends on which TRACK its family happens to write to. Reach
 * for this whenever a caller needs a step-level scope. `qaUnitsInPackageScopeTransformer`,
 * `qaChecklistBuildTransformer`, `relayTailFanOutTransformer`, `stepInScopeUnitsTransformer` and
 * `questGetQaChecklistBroker` all read this table; none reads a track-keyed one, because none exists.
 *
 * USAGE:
 * stepScopeStatics.byFamilyStep.flowrider.review.verificationMethods.includes('reading');
 * // Returns false — a `(read-check)` observable never reaches flowrider's denominator
 * stepScopeStatics.byFamilyStep.siegemaster.adversarial.unitKinds;
 * // Returns ['off-map'] — the family it was allocated, and nothing else
 *
 * EVERY STEP OF THE THREE UNIT-BEARING FAMILIES IS DECLARED, IN EXACTLY ONE OF THE TWO TABLES, and
 * `stepInScopeUnitsTransformer` throws on a step in neither. `byFamilyStep` holds the steps measured
 * over a real filter. `unscopedByFamilyStep` holds the rest as one of two words: `all` is the family's
 * whole in-scope set unfiltered — a planner, which reads everything to cut pieces and is assigned
 * none — and `none` is the empty set — a step that settles no unit at all (`commit`, `ward`, the
 * spiritmender `repair`, the sweeps and the on-request helpers). A silent "missing means unfiltered"
 * is what handed a codeweaver `repair` seven siegemaster-only off-map probes it could never settle.
 *
 * A WORKER CARRIES ITS REVIEWER'S SCOPE. `codeweaver.work` and `flowrider.work` restate their
 * `review`'s scope, because a worker can only settle what its own reviewer measures — a pieceless
 * worker handed anything wider holds units no session in its family can ever sign. Both siege fixers
 * restate `happyWalk`'s, the widest scope siege settles: an adversarial walker records a measured
 * defect as a NEW observable, so `fixAdversarial` has to be able to carry one, not off-map alone.
 *
 * `flowScope` AND `packageScope` HAVE NO FIELD HERE, and dropping both costs nothing. Neither rule is
 * read by any production file: `qaUnitsInPackageScopeTransformer` hardcodes the intersection rule in
 * code, and a glue seam's units go to the LAST-ORDERED cell alone, by the cell ordering the
 * orchestrator already computes — never to every cell intersecting the node's packages. Carrying a
 * value nothing reads buys nothing over leaving it out.
 *
 * VALUES ARE STATED DIRECTLY ON EACH STEP, never behind a track-keyed indirection. Two reasons: an
 * import would mean an edit to some OTHER concept's list silently changes a STEP's scope, which is
 * the exact coupling this file exists to avoid; and `siegemaster.adversarial`'s `unitKinds:
 * ['off-map']` has no counterpart to share with any other entry, so there is nothing to factor out.
 *
 * SIEGEMASTER'S STEPS CARRY `flowTypes: ['runtime']` ALONE, NOT `['runtime', 'operational']`, because
 * operational units move to codeweaver's reviewer — the only family that can settle them, since an
 * operational flow is a one-time task sequence with no repeatable walk for a siege lane to drive. See
 * each entry's own comment below.
 *
 * `observableOrigins` IS STATED PER STEP, pending an open design question this file does not resolve:
 * whether "strictly after" still holds once a back-edge can mint a worker from a later family's
 * `unmet`. Dropping the field would not deadlock either reading — the reviewer would mark the unit
 * `unmet` and the ordinary route would mint a worker — so it is carried unchanged rather than decided
 * here.
 *
 * NO ENTRY LISTS `human-check`, AND THAT ABSENCE IS WHAT DROPS A HUMAN-ONLY CRITERION FROM EVERY
 * STEP'S SCOPE. An observable flagged `verifyByHuman` resolves to `human-check`; because no
 * (family, step) below declares that method, the unit matches no scope and falls out of every
 * denominator at once, with no special case anywhere. Adding `human-check` to any list below hands
 * that step a criterion no automated check can settle, which is the one thing the flag exists to
 * prevent. The explicit element type is what makes the value expressible at all: under `as const`
 * alone each array infers its own literal tuple, so a method nothing lists has nowhere to be
 * declared.
 */

type VerificationMethod = 'test' | 'reading' | 'human-check';

export const stepScopeStatics = {
  byFamilyStep: {
    codeweaver: {
      review: {
        flowTypes: ['runtime', 'operational'],
        verificationMethods: ['test', 'reading'] as readonly VerificationMethod[],
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
      work: {
        flowTypes: ['runtime', 'operational'],
        verificationMethods: ['test', 'reading'] as readonly VerificationMethod[],
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
        verificationMethods: ['test'] as readonly VerificationMethod[],
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
      work: {
        flowTypes: ['runtime'],
        verificationMethods: ['test'] as readonly VerificationMethod[],
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
        // 'runtime' alone, never 'operational': operational units move to codeweaver's reviewer,
        // the only family that can settle them — an operational flow is a one-time task sequence
        // with no repeatable walk for a siege lane to drive.
        flowTypes: ['runtime'],
        verificationMethods: ['test'] as readonly VerificationMethod[],
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
      fixHappy: {
        flowTypes: ['runtime'],
        verificationMethods: ['test'] as readonly VerificationMethod[],
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
        verificationMethods: ['test'] as readonly VerificationMethod[],
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
      fixAdversarial: {
        flowTypes: ['runtime'],
        verificationMethods: ['test'] as readonly VerificationMethod[],
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
    },
  },
  unscopedByFamilyStep: {
    codeweaver: { plan: 'all', commit: 'none', ward: 'none', repair: 'none' },
    flowrider: {
      recipe: 'none',
      writeIngredient: 'none',
      plan: 'all',
      commit: 'none',
      ward: 'none',
      repair: 'none',
    },
    siegemaster: {
      sweepIn: 'none',
      recipe: 'none',
      writeIngredient: 'none',
      read: 'none',
      plan: 'all',
      commit: 'none',
      ward: 'none',
      repair: 'none',
      sweepOut: 'none',
    },
  },
} as const;

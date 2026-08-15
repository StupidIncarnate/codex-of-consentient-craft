/**
 * PURPOSE: Single source of truth mapping each quest type to the data that drives its complete
 * work-item flow — the intake slash command, the create-time seed role, the Start-Quest relay
 * seed (implementation operation items + the fixed verify tail), and the execution roles it uses.
 *
 * USAGE:
 * questTypeRegistryStatics['bug-hunt'].relayTail;
 * // Returns the verify-tail operation-item seeds questBuildRelayGraphBroker appends at Start.
 *
 * This is DATA only (statics may import statics, never brokers). `startImplementationOps` are the
 * implementation operation items the orchestrator seeds at Start. BOTH quest types now use it:
 * bug-hunt seeds its pesteater item, and feature seeds a codeweaver item that fans out into one
 * slice per (package, flow) cell plus a foundation item per package. ChaosWhisperer no longer
 * authors the ledger at all — `operations` has left its modify-quest allowlist, and the partition
 * is DERIVED from the flow nodes' package tags and the contracts' source paths instead. `relayTail`
 * is the fixed verify chain appended after the implementation items. Adding a new quest type = one
 * entry here + the type added to questTypeContract.
 *
 * `fanOutBy` is how ONE seed becomes N operation items, expressed as data so the relay's expansion
 * reads a field instead of matching role names:
 *
 * - `flow` — one item per quest flow, of either flow type, each carrying a single `flowId`.
 * - `e2e-flow` — one item per RUNTIME flow that touches an e2e-eligible package, so a quest whose
 *   flows land nowhere a browser can reach seeds none at all.
 * - `package` — one item per package the quest's node tags name, plus one seam item for the units
 *   whose node spans more than one.
 * - `implementation` — one item per (package, flow) cell across BOTH flow types, plus one flow-less
 *   foundation item per package holding the contracts whose `source` resolves to it. Ordered by
 *   package KIND tier, then manifest depth. This is the derived codeweaver ledger.
 *
 * An entry that OMITS the field seeds exactly one item, which is why it is absent rather than
 * carrying a "none" member: the shape mirrors `wardMode`, read at the seed site with an `in` check.
 * `locked` is read the same way and defaults TRUE. Codeweaver sets it false on purpose: `locked` is
 * what enrols an item in its role's `slotManagerStatics` pt budget, and a codeweaver chain must stay
 * unbounded because the flows are the acceptance target and the work has to land. Nothing can delete
 * an unlocked item any more either — `operations` is off the modify-quest allowlist entirely.
 *
 * Role and slash-command-filename strings are cross-checked against workItemRoleContract and
 * slashCommandsStatics in the colocated test so they cannot drift.
 */

export const questTypeRegistryStatics = {
  feature: {
    intakeSlashCommandFileName: 'dumpster-create.md',
    initialWorkItemRole: 'chaoswhisperer',
    startImplementationOps: [
      {
        role: 'codeweaver',
        // Fanned out into one item per (package, flow) cell plus a foundation item per package.
        // `locked: false` keeps the pt chain unbounded — see the `locked` note above.
        text: 'Codeweaver: build this slice',
        fanOutBy: 'implementation',
        locked: false,
      },
    ],
    relayTail: [
      { role: 'ward', text: 'Ward gate (changed files)', wardMode: 'changed' },
      {
        role: 'flowrider',
        // Fanned out per PACKAGE: every runtime flow on a relay-scale quest spans the same handful
        // of packages, so slicing by flow reduces nothing while slicing by package gives each
        // session a scope one context can hold.
        text: 'Flowrider: author the flow-perspective test suites below the browser',
        fanOutBy: 'package',
      },
      {
        role: 'groundstomper',
        // Fanned out per RUNTIME flow that touches an e2e-eligible package. A Playwright test is a
        // path walk, so the flow is the unit; a flow landing in no browser-reachable package seeds
        // no item, because there is nothing for a browser to walk.
        text: 'Groundstomper: author the browser walk for this flow',
        fanOutBy: 'e2e-flow',
      },
      {
        role: 'siegemaster',
        // Fanned out to ONE item per quest flow by questBuildRelayGraphBroker, which appends
        // "— flow: <id>". Per-flow items mean per-flow pt budgets and a per-flow completion gate:
        // a whole-quest item put every flow behind one budget of 3 and one session's context.
        text: 'Siegemaster: manual-QA this flow and review its test suite',
        fanOutBy: 'flow',
      },
      // No blightwarden item: the standards review is `blightscout`, appended by the signal-back
      // handler after EVERY committing item rather than run once over the whole diff here.
      { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
    ],
    roles: [
      'codeweaver',
      'ward',
      'flowrider',
      'groundstomper',
      'siegemaster',
      'blightscout',
      'spiritmender',
    ],
  },
  'bug-hunt': {
    intakeSlashCommandFileName: 'dumpster-hunt.md',
    initialWorkItemRole: 'bughunt',
    startImplementationOps: [
      {
        role: 'pesteater',
        text: 'PestEater: reproduce the bug with a failing test first, then fix it',
      },
    ],
    relayTail: [
      { role: 'ward', text: 'Ward gate (changed files)', wardMode: 'changed' },
      { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
    ],
    roles: ['pesteater', 'ward', 'blightscout', 'spiritmender'],
  },
} as const;

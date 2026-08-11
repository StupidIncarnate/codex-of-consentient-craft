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
 * implementation operation items the orchestrator seeds at Start for types whose plan is NOT
 * authored by an intake agent (bug-hunt's pesteater); feature quests leave it empty because
 * ChaosWhisperer authors the codeweaver operation items at spec time. `relayTail` is the fixed
 * verify/review chain appended after the implementation items — every entry becomes a locked
 * pending operation item. Adding a new quest type = one entry here + the type added to
 * questTypeContract.
 *
 * `fanOutBy` is how ONE seed becomes N operation items, expressed as data so the relay's expansion
 * reads a field instead of matching role names:
 *
 * - `flow` — one item per quest flow, of either flow type, each carrying a single `flowId`.
 * - `e2e-flow` — one item per RUNTIME flow that touches an e2e-eligible package, so a quest whose
 *   flows land nowhere a browser can reach seeds none at all.
 * - `package` — one item per package the quest's node tags name, plus one seam item for the units
 *   whose node spans more than one.
 *
 * An entry that OMITS the field seeds exactly one item, which is why it is absent rather than
 * carrying a fourth "none" member: the shape mirrors `wardMode`, read at the seed site with an
 * `in` check.
 *
 * Role and slash-command-filename strings are cross-checked against workItemRoleContract and
 * slashCommandsStatics in the colocated test so they cannot drift.
 */

export const questTypeRegistryStatics = {
  feature: {
    intakeSlashCommandFileName: 'dumpster-create.md',
    initialWorkItemRole: 'chaoswhisperer',
    startImplementationOps: [],
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
      { role: 'blightwarden', text: 'Blightwarden: cross-cutting audit across the whole diff' },
      { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
    ],
    roles: [
      'codeweaver',
      'ward',
      'flowrider',
      'groundstomper',
      'siegemaster',
      'blightwarden',
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
      { role: 'blightwarden', text: 'Blightwarden: cross-cutting audit across the whole diff' },
      { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
    ],
    roles: ['pesteater', 'ward', 'blightwarden', 'spiritmender'],
  },
} as const;

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
        text: 'Flowrider: author the flow-perspective test suite over every quest flow',
      },
      {
        role: 'siegemaster',
        text: 'Siegemaster: manual-QA every quest flow and review the flow test suite',
      },
      { role: 'lawbringer', text: 'Lawbringer: standards review across the whole quest diff' },
      { role: 'blightwarden', text: 'Blightwarden: cross-cutting audit across the whole diff' },
      { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
    ],
    roles: [
      'codeweaver',
      'ward',
      'flowrider',
      'siegemaster',
      'lawbringer',
      'blightwarden',
      'spiritmender',
    ],
  },
  'bug-hunt': {
    intakeSlashCommandFileName: 'dumpster-hunt.md',
    initialWorkItemRole: null,
    startImplementationOps: [
      {
        role: 'pesteater',
        text: 'PestEater: reproduce the bug with a failing test first, then fix it',
      },
    ],
    relayTail: [
      { role: 'ward', text: 'Ward gate (changed files)', wardMode: 'changed' },
      { role: 'lawbringer', text: 'Lawbringer: standards review across the whole quest diff' },
      { role: 'blightwarden', text: 'Blightwarden: cross-cutting audit across the whole diff' },
      { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
    ],
    roles: ['pesteater', 'ward', 'lawbringer', 'blightwarden', 'spiritmender'],
  },
} as const;

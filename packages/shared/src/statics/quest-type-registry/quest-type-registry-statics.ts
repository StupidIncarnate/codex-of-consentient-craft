/**
 * PURPOSE: Single source of truth mapping each quest type to the data that drives its complete
 * work-item flow — the intake slash command, the create-time seed role, the Start-Quest graph
 * kind, and the execution roles it uses.
 *
 * USAGE:
 * questTypeRegistryStatics['bug-hunt'].startGraphKind;
 * // Returns: 'bug-hunt' — the discriminator orchestrationStartResponder switches on to pick a
 * // work-item graph builder.
 *
 * This is DATA only (statics may import statics, never brokers). The "which broker builds the
 * graph" mapping lives in orchestrationStartResponder, which reads startGraphKind here. Adding a
 * new quest type = one entry here + one matching graph builder + the type added to questTypeContract.
 *
 * Role and slash-command-filename strings are cross-checked against workItemRoleContract and
 * slashCommandsStatics in the colocated test so they cannot drift.
 */

export const questTypeRegistryStatics = {
  feature: {
    intakeSlashCommandFileName: 'dumpster-create.md',
    initialWorkItemRole: 'chaoswhisperer',
    startGraphKind: 'pathseeker',
    roles: [
      'pathseeker-surface',
      'pathseeker-dedup',
      'pathseeker-assertion-correctness',
      'pathseeker-walk',
      'codeweaver',
      'ward',
      'siegemaster',
      'lawbringer',
      'blightwarden',
      'spiritmender',
    ],
  },
  'bug-hunt': {
    intakeSlashCommandFileName: 'dumpster-hunt.md',
    initialWorkItemRole: null,
    startGraphKind: 'bug-hunt',
    roles: ['pesteater', 'ward', 'lawbringer', 'blightwarden'],
  },
} as const;
